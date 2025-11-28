/**
 * IndexedDB wrapper for offline data storage
 * Stores transactions, accounts, trips, and pending changes
 */

const DB_NAME = 'travelai-offline';
const DB_VERSION = 1;

// Store names
export const STORES = {
  TRANSACTIONS: 'transactions',
  ACCOUNTS: 'accounts',
  TRIPS: 'trips',
  PENDING_CHANGES: 'pending_changes',
  SYNC_META: 'sync_meta',
} as const;

type StoreName = typeof STORES[keyof typeof STORES];

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize the IndexedDB database
 */
export async function initDB(): Promise<IDBDatabase> {
  // Guard against SSR
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB is not available');
  }
  
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Transactions store
      if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
        const txStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
        txStore.createIndex('date', 'date');
        txStore.createIndex('accountId', 'accountId');
        txStore.createIndex('tripId', 'tripId');
        txStore.createIndex('category', 'category');
      }

      // Accounts store
      if (!db.objectStoreNames.contains(STORES.ACCOUNTS)) {
        db.createObjectStore(STORES.ACCOUNTS, { keyPath: 'id' });
      }

      // Trips store
      if (!db.objectStoreNames.contains(STORES.TRIPS)) {
        db.createObjectStore(STORES.TRIPS, { keyPath: 'id' });
      }

      // Pending changes store (for offline mutations)
      if (!db.objectStoreNames.contains(STORES.PENDING_CHANGES)) {
        const pendingStore = db.createObjectStore(STORES.PENDING_CHANGES, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        pendingStore.createIndex('type', 'type');
        pendingStore.createIndex('createdAt', 'createdAt');
      }

      // Sync metadata store
      if (!db.objectStoreNames.contains(STORES.SYNC_META)) {
        db.createObjectStore(STORES.SYNC_META, { keyPath: 'key' });
      }
    };
  });
}

/**
 * Get all items from a store
 */
export async function getAll<T>(storeName: StoreName): Promise<T[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get a single item by ID
 */
export async function getById<T>(storeName: StoreName, id: string): Promise<T | undefined> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Put (upsert) an item
 */
export async function put<T>(storeName: StoreName, item: T): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Put multiple items at once
 */
export async function putMany<T>(storeName: StoreName, items: T[]): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    items.forEach(item => store.put(item));

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * Delete an item by ID
 */
export async function deleteById(storeName: StoreName, id: string | number): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all items in a store
 */
export async function clearStore(storeName: StoreName): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ============ Sync Metadata ============

export interface SyncMeta {
  key: string;
  lastSynced: string;
  version?: number;
}

export async function getLastSynced(key: string): Promise<Date | null> {
  const meta = await getById<SyncMeta>(STORES.SYNC_META, key);
  return meta ? new Date(meta.lastSynced) : null;
}

export async function setLastSynced(key: string): Promise<void> {
  await put(STORES.SYNC_META, {
    key,
    lastSynced: new Date().toISOString(),
  });
}

// ============ Pending Changes ============

export interface PendingChange {
  id?: number;
  type: 'create' | 'update' | 'delete';
  storeName: StoreName;
  data: any;
  createdAt: string;
  retryCount: number;
}

export async function addPendingChange(change: Omit<PendingChange, 'id' | 'createdAt' | 'retryCount'>): Promise<void> {
  await put(STORES.PENDING_CHANGES, {
    ...change,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  });
}

export async function getPendingChanges(): Promise<PendingChange[]> {
  return getAll<PendingChange>(STORES.PENDING_CHANGES);
}

export async function removePendingChange(id: number): Promise<void> {
  await deleteById(STORES.PENDING_CHANGES, id);
}

export async function hasPendingChanges(): Promise<boolean> {
  const changes = await getPendingChanges();
  return changes.length > 0;
}

// ============ Helper to check if we're online ============

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

// ============ Initialize on import ============

if (typeof window !== 'undefined') {
  initDB().catch(console.error);
}

