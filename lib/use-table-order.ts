"use client";
import { useEffect, useRef, useState } from "react";
import {
  fetchTableOrder,
  setTableAllergies,
  setTableLine,
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

/**
 * The diner's order, either on this phone only or shared with the table through a link.
 * A shared order is checked every few seconds while the menu is open, and each change is
 * saved one line at a time so people adding at once never overwrite each other.
 *
 * People at a shared table can also choose to share their allergies. Once shared, this
 * phone's entry follows the diner's settings, and it's removed when they leave the table.
 */
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
  const codeRef = useRef(code);
  const lastSent = useRef("");
  useEffect(() => {
    codeRef.current = code;
  });

  function endShared() {
    setCode(null);
    setEnded(true);
    setAllergies({});
    showCodeInAddress(null);
  }

  useEffect(() => {
    if (!code) return;
    let active = true;
    const check = () => {
      if (document.visibilityState === "hidden") return;
      fetchTableOrder(restaurantSlug, code)
        .then((table) => {
          if (!active) return;
          setOrder(table.lines);
          setAllergies(table.allergies);
          setMe(personFor(code));
        })
        .catch((error) => {
          if (active && error instanceof TableEndedError) endShared();
        });
    };
    const first = setTimeout(check, 0);
    const timer = setInterval(check, CHECK_EVERY_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      active = false;
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [code, restaurantSlug]);

  function setQuantity(line: string, quantity: number) {
    setOrder((prev) => {
      const next = { ...prev };
      if (quantity > 0) next[line] = quantity;
      else delete next[line];
      return next;
    });
    const shared = codeRef.current;
    if (!shared) return;
    setTableLine(shared, line, quantity)
      .then((lines) => codeRef.current === shared && setOrder(lines))
      .catch((error) => {
        if (error instanceof TableEndedError) endShared();
      });
  }

  /** Shares this phone's allergies with the table, or stops sharing them with null. */
  async function shareAllergies(entry: TableAllergyEntry | null) {
    const shared = codeRef.current;
    if (!shared) return;
    const person = personFor(shared);
    setMe(person);
    lastSent.current = JSON.stringify(entry);
    try {
      const all = await setTableAllergies(shared, person, entry);
      if (codeRef.current === shared) setAllergies(all);
    } catch (error) {
      if (error instanceof TableEndedError) endShared();
      else throw error;
    }
  }

  // Once shared, keep this phone's entry in step with the diner's current settings.
  const mineShared = me ? allergies[me] : undefined;
  useEffect(() => {
    if (!code || !me || !mineShared || !mine || sameAllergies(mineShared, mine)) return;
    const next = hasAllergies(mine) ? { ...mine, label: mineShared.label } : null;
    const body = JSON.stringify(next);
    if (body === lastSent.current) return;
    lastSent.current = body;
    setTableAllergies(code, me, next)
      .then((all) => codeRef.current === code && setAllergies(all))
      .catch(() => {});
  }, [code, me, mineShared, mine]);

  async function startShared() {
    const started = await startTableOrder(restaurantSlug, order);
    setOrder(started.lines);
    setCode(started.code);
    setEnded(false);
    showCodeInAddress(started.code);
    return started.code;
  }

  function leaveShared() {
    // Leaving the table takes this phone's allergies off it too.
    if (code && me && allergies[me]) setTableAllergies(code, me, null).catch(() => {});
    setCode(null);
    setAllergies({});
    showCodeInAddress(null);
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
  };
}
