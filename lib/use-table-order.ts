"use client";
import { useEffect, useRef, useState } from "react";
import { fetchTableOrder, setTableLine, startTableOrder, TableEndedError } from "@/lib/api-client";

type Lines = Record<string, number>;

const CHECK_EVERY_MS = 4000;

/** Puts the table code in the address bar, so sharing or reloading the page keeps it. */
function showCodeInAddress(code: string | null) {
  const url = new URL(window.location.href);
  if (code) url.searchParams.set("table", code);
  else url.searchParams.delete("table");
  window.history.replaceState(null, "", url.toString());
}

/**
 * The diner's order, either on this phone only or shared with the table through a link.
 * A shared order is checked every few seconds while the menu is open, and each change is
 * saved one line at a time so people adding at once never overwrite each other.
 */
export function useTableOrder(restaurantSlug: string, initialCode: string | null) {
  const [order, setOrder] = useState<Lines>({});
  const [code, setCode] = useState<string | null>(initialCode);
  const [ended, setEnded] = useState(false);
  const codeRef = useRef(code);
  useEffect(() => {
    codeRef.current = code;
  });

  function endShared() {
    setCode(null);
    setEnded(true);
    showCodeInAddress(null);
  }

  useEffect(() => {
    if (!code) return;
    let active = true;
    const check = () => {
      if (document.visibilityState === "hidden") return;
      fetchTableOrder(restaurantSlug, code)
        .then((lines) => active && setOrder(lines))
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

  async function startShared() {
    const started = await startTableOrder(restaurantSlug, order);
    setOrder(started.lines);
    setCode(started.code);
    setEnded(false);
    showCodeInAddress(started.code);
    return started.code;
  }

  function leaveShared() {
    setCode(null);
    showCodeInAddress(null);
  }

  function clear() {
    for (const line of Object.keys(order)) setQuantity(line, 0);
  }

  return { order, setQuantity, clear, code, ended, startShared, leaveShared };
}
