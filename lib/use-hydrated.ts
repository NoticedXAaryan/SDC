"use client";
import { useSyncExternalStore } from "react";
const subscribe = () => () => {};
/** Prevent a browser's default form submission before client handlers are attached. */
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
