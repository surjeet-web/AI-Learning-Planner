type StoreName = "courses" | "progress" | "roadmaps" | "presentations" | "user_data"

const DB_NAME = "LearningPlannerDB"
const DB_VERSION = 1

function promisify<T = any>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

let dbPromise: Promise<IDBDatabase> | null = null

export function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains("courses")) db.createObjectStore("courses", { keyPath: "id" })
      if (!db.objectStoreNames.contains("progress")) db.createObjectStore("progress", { keyPath: "id" })
      if (!db.objectStoreNames.contains("roadmaps")) db.createObjectStore("roadmaps", { keyPath: "id" })
      if (!db.objectStoreNames.contains("presentations")) db.createObjectStore("presentations", { keyPath: "id" })
      if (!db.objectStoreNames.contains("user_data")) db.createObjectStore("user_data", { keyPath: "id" })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

export async function getAll<T = any>(store: StoreName): Promise<T[]> {
  const db = await openDB()
  const tx = db.transaction(store, "readonly")
  const os = tx.objectStore(store)
  return promisify<T[]>(os.getAll())
}

export async function get<T = any>(store: StoreName, id: string): Promise<T | undefined> {
  const db = await openDB()
  const tx = db.transaction(store, "readonly")
  const os = tx.objectStore(store)
  return promisify<T | undefined>(os.get(id))
}

export async function put<T = any>(store: StoreName, value: T): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(store, "readwrite")
  const os = tx.objectStore(store)
  await promisify(os.put(value as any))
  await promisify(tx.done as any).catch(() => {})
}

export async function bulkPut<T = any>(store: StoreName, values: T[]): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(store, "readwrite")
  const os = tx.objectStore(store)
  for (const v of values) os.put(v as any)
  await promisify(tx.done as any).catch(() => {})
}

export async function clear(store: StoreName): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(store, "readwrite")
  const os = tx.objectStore(store)
  await promisify(os.clear())
  await promisify(tx.done as any).catch(() => {})
}
