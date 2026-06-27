import { getDefaultData, loadData, saveData } from "@/lib/storage";
import type { AppData } from "@/types";

type Listener = () => void;

const listeners = new Set<Listener>();
let cache: AppData | null = null;

function notify() {
  listeners.forEach((listener) => listener());
}

export function getAppData(): AppData {
  if (typeof window === "undefined") {
    return getDefaultData();
  }
  if (!cache) {
    cache = loadData();
  }
  return cache;
}

export function setAppData(data: AppData): void {
  cache = data;
  saveData(data);
  notify();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getServerSnapshot(): AppData {
  return getDefaultData();
}
