"use client";
import { useEffect, useState } from "react";

/** Refresh date-based counters at local midnight and after a sleeping tab resumes. */
export function useLocalDay(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      const date = new Date();
      setNow(date);
      const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      timer = setTimeout(refresh, midnight.getTime() - date.getTime() + 50);
    };
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { clearTimeout(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, []);
  return now;
}
