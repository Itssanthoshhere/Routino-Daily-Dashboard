"use client";
import { createContext, useContext } from "react";
import { scopedStorage, writeBrowserStorage } from "@/lib/accountStorage";
export const AccountStorageContext = createContext<string | null>(null);
export function useAccountStorage() {
  const account = useContext(AccountStorageContext);
  return scopedStorage({ getItem: key => localStorage.getItem(key), setItem: (key, value) => writeBrowserStorage(key, value), removeItem: key => localStorage.removeItem(key) }, () => account);
}
