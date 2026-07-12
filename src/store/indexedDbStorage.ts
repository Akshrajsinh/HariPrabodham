import type { StateStorage } from 'zustand/middleware';

/**
 * localStorage caps out at roughly 5-10MB per origin, and a single
 * QuotaExceededError on setItem fails SILENTLY as far as the user can
 * tell — the app keeps working in memory, but nothing new gets written
 * to disk. Once a presenter has uploaded a few bhajan audio clips or
 * picture-question images, the persisted state can easily cross that
 * line, so newly added content quietly stops being saved — and then
 * disappears on the next refresh.
 *
 * IndexedDB doesn't have that problem (quotas are typically hundreds of
 * MB to several GB, tied to available disk space), so we persist the
 * game state there instead. This is a minimal key/value wrapper around
 * IndexedDB that satisfies zustand's StateStorage interface.
 */

const DB_NAME = 'gyan-challenge-db';
const STORE_NAME = 'kv';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

// Fallback for environments without IndexedDB (very old browsers, some
// private-browsing modes) so the app doesn't crash — it just won't persist.
const hasIndexedDb = typeof indexedDB !== 'undefined';
const memoryFallback = new Map<string, string>();

export const indexedDbStorage: StateStorage = {
  getItem: async (name) => {
    if (!hasIndexedDb) return memoryFallback.get(name) ?? null;
    try {
      const value = await withStore('readonly', (store) => store.get(name));
      return (value as unknown as string) ?? null;
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    if (!hasIndexedDb) {
      memoryFallback.set(name, value);
      return;
    }
    await withStore('readwrite', (store) => store.put(value, name));
  },
  removeItem: async (name) => {
    if (!hasIndexedDb) {
      memoryFallback.delete(name);
      return;
    }
    await withStore('readwrite', (store) => store.delete(name));
  },
};
