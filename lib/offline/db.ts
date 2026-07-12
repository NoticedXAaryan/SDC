import { openDB, DBSchema, IDBPDatabase } from "idb";

export interface STCDB extends DBSchema {
  pendingCheckIns: {
    key: string;
    value: {
      id: string; // Random UUID
      eventId: string;
      token: string;
      timestamp: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<STCDB>> | null = null;

export function getDB() {
  if (typeof window === "undefined") return null;
  
  if (!dbPromise) {
    dbPromise = openDB<STCDB>("stc-os-offline-db", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("pendingCheckIns")) {
          db.createObjectStore("pendingCheckIns", { keyPath: "id" });
        }
      }
    });
  }
  return dbPromise;
}

export async function addPendingCheckIn(eventId: string, token: string) {
  const db = await getDB();
  if (!db) return;
  
  const id = crypto.randomUUID();
  await db.add("pendingCheckIns", {
    id,
    eventId,
    token,
    timestamp: Date.now()
  });
  return id;
}

export async function getPendingCheckIns() {
  const db = await getDB();
  if (!db) return [];
  return await db.getAll("pendingCheckIns");
}

export async function removePendingCheckIn(id: string) {
  const db = await getDB();
  if (!db) return;
  await db.delete("pendingCheckIns", id);
}
