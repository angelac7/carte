"use client";
import { useEffect, useRef, useState } from "react";
import {
  changeTableLine,
  fetchTableOrder,
  setTableAllergies,
  startTableOrder,
  TableEndedError,
  type TableAllergies,
} from "@/lib/api-client";
import {
  hasAllergies,
  isPersonId,
  newPersonId,
  sameAllergies,
  type MyAllergies,
  type TableAllergyEntry,
} from "@/lib/table-allergies";

import { TableSync, type TableSyncStatus } from "@/lib/table-sync";

type Lines = Record<string, number>;

const CHECK_EVERY_MS = 4000;

/** Puts the table code in the address bar, so sharing or reloading the page keeps it. */
function showCodeInAddress(code: string | null) {
  const url = new URL(window.location.href);
  if (code) url.searchParams.set("table", code);
  else url.searchParams.delete("table");
  window.history.replaceState(null, "", url.toString());
}

/** This phone's random id at one table, kept for the browser session so a reload keeps it. */
function personFor(code: string): string {
  const key = `carte-table-person:${code}`;
  try {
    const saved = sessionStorage.getItem(key);
    if (isPersonId(saved)) return saved;
  } catch {
    /* A new id each time still works; the old entry expires with the order. */
  }
  const id = newPersonId(crypto.getRandomValues(new Uint8Array(12)));
  try {
    sessionStorage.setItem(key, id);
  } catch {
    /* See above. */
  }
  return id;
}

/** Serializes writes and retries failed changes while the diner remains at this table. */
export function useTableOrder(
  restaurantSlug: string,
  initialCode: string | null,
  mine?: MyAllergies,
) {
  const [order, setOrder] = useState<Lines>({});
  const [allergies, setAllergies] = useState<TableAllergies>({});
  const [me, setMe] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(initialCode);
  const [ended, setEnded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<TableSyncStatus>("saving");
  const engine = useRef<TableSync | null>(null);
  const starting = useRef(false);
  const leaving = useRef(false);
  const person = useRef<string | null>(null);
  // The order a table started with on this phone, until the first read.
  const startedWith = useRef<Lines>({});

  useEffect(() => {
    if (!code) return;
    person.current = personFor(code);
    const sync = new TableSync(
      {
        read: () => fetchTableOrder(restaurantSlug, code),
        change: (line, by, id) => changeTableLine(code, line, by, id),
        newId: () => newPersonId(crypto.getRandomValues(new Uint8Array(12))),
        allergies: (id, entry) => setTableAllergies(code, id, entry),
        showLines: setOrder,
        showAllergies: (all) => {
          setAllergies(all);
          setMe(person.current);
        },
        status: setSyncStatus,
        online: () => navigator.onLine,
        error: (error) => {
          if (error instanceof TableEndedError) {
            sync.stop();
            setCode(null);
            setEnded(true);
            setAllergies({});
            showCodeInAddress(null);
          }
        },
      },
      startedWith.current,
    );
    startedWith.current = {};
    engine.current = sync;
    const refresh = () => {
      if (document.visibilityState !== "hidden") void sync.refresh();
    };
    const first = setTimeout(refresh, 0);
    const timer = setInterval(refresh, CHECK_EVERY_MS);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    return () => {
      sync.stop();
      engine.current = null;
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
    };
  }, [code, restaurantSlug]);

  function setQuantity(line: string, quantity: number) {
    if (leaving.current) return;
    // At a shared table, the sync shows the change along with everyone else's.
    if (engine.current) return engine.current.quantity(line, quantity);
    setOrder((previous) => {
      const next = { ...previous };
      if (quantity > 0) next[line] = quantity;
      else delete next[line];
      return next;
    });
  }
  async function shareAllergies(entry: TableAllergyEntry | null) {
    if (!engine.current || !person.current) throw new Error("Table not connected");
    await engine.current.share(person.current, entry);
  }
  const mineShared = me ? allergies[me] : undefined;
  useEffect(() => {
    if (!code || !me || !mineShared || !mine || sameAllergies(mineShared, mine)) return;
    const next = hasAllergies(mine) ? { ...mine, label: mineShared.label } : null;
    void engine.current?.share(me, next, true).catch(() => {});
  }, [code, me, mineShared, mine]);

  async function startShared() {
    if (starting.current) throw new Error("Already connecting");
    starting.current = true;
    try {
      const started = await startTableOrder(restaurantSlug, order);
      startedWith.current = started.lines;
      setOrder(started.lines);
      setCode(started.code);
      setEnded(false);
      showCodeInAddress(started.code);
      return started.code;
    } finally {
      starting.current = false;
    }
  }
  async function leaveShared() {
    if (leaving.current) return;
    leaving.current = true;
    try {
      // Confirm removal before leaving; offline failure keeps the table and the visible warning.
      if (engine.current && person.current) await engine.current.share(person.current, null);
      engine.current?.stop();
      engine.current = null;
      setCode(null);
      setAllergies({});
      showCodeInAddress(null);
    } catch {
      /* Pending removal is retried; the diner can leave after reconnecting. */
    } finally {
      leaving.current = false;
    }
  }
  function clear() {
    for (const line of Object.keys(order)) setQuantity(line, 0);
  }
  return {
    order,
    setQuantity,
    clear,
    code,
    ended,
    startShared,
    leaveShared,
    allergies,
    me,
    shareAllergies,
    syncStatus,
  };
}
