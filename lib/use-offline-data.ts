"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initDB,
  getAll,
  putMany,
  put,
  setLastSynced,
  getLastSynced,
  addPendingChange,
  getPendingChanges,
  removePendingChange,
  isOnline,
  STORES,
  type PendingChange,
} from './offline-db';

// Types for our data
export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  category: string;
  merchantName: string | null;
  description: string | null;
  date: string;
  currency: string | null;
  tripId: string | null;
  isTripRelated: boolean;
  location: string | null;
  tags: string[];
  account: {
    id: string;
    name: string;
    type: string;
    currency: string;
  };
  trip?: {
    id: string;
    name: string;
    destination: string;
  } | null;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  icon: string | null;
  color: string | null;
  isActive: boolean;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  currency: string;
}

// ============ Offline-first data hook ============

interface UseOfflineDataOptions<T> {
  storeName: typeof STORES[keyof typeof STORES];
  fetchUrl: string;
  enabled?: boolean;
}

interface UseOfflineDataResult<T> {
  data: T[];
  isLoading: boolean;
  isStale: boolean;
  isSyncing: boolean;
  error: Error | null;
  lastSynced: Date | null;
  refetch: () => Promise<void>;
  isOffline: boolean;
}

export function useOfflineData<T extends { id: string }>({
  storeName,
  fetchUrl,
  enabled = true,
}: UseOfflineDataOptions<T>): UseOfflineDataResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastSynced, setLastSyncedState] = useState<Date | null>(null);
  const [isOfflineState, setIsOfflineState] = useState(false);
  const isMounted = useRef(true);

  // Load cached data first
  const loadCachedData = useCallback(async () => {
    try {
      await initDB();
      const cached = await getAll<T>(storeName);
      const syncTime = await getLastSynced(storeName);
      
      if (isMounted.current) {
        if (cached.length > 0) {
          setData(cached);
          setIsStale(true); // Mark as stale until we sync
        }
        setLastSyncedState(syncTime);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Failed to load cached data:', err);
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [storeName]);

  // Fetch fresh data from server
  const fetchFreshData = useCallback(async () => {
    if (!isOnline()) {
      setIsOfflineState(true);
      return;
    }

    setIsSyncing(true);
    setIsOfflineState(false);

    try {
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const freshData = await response.json();
      const items = Array.isArray(freshData) ? freshData : freshData.data || [];
      
      if (isMounted.current) {
        // Update IndexedDB
        await putMany(storeName, items);
        await setLastSynced(storeName);
        
        setData(items);
        setIsStale(false);
        setLastSyncedState(new Date());
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch fresh data:', err);
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch'));
        // Keep showing cached data
      }
    } finally {
      if (isMounted.current) {
        setIsSyncing(false);
      }
    }
  }, [fetchUrl, storeName]);

  // Initial load: cached first, then fresh
  useEffect(() => {
    if (!enabled) return;
    
    isMounted.current = true;
    
    // Set initial online state
    setIsOfflineState(!navigator.onLine);
    
    const init = async () => {
      await loadCachedData();
      await fetchFreshData();
    };
    
    init();

    return () => {
      isMounted.current = false;
    };
  }, [enabled, loadCachedData, fetchFreshData]);

  // Listen for online/offline changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOfflineState(false);
      fetchFreshData();
    };
    
    const handleOffline = () => {
      setIsOfflineState(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchFreshData]);

  return {
    data,
    isLoading,
    isStale,
    isSyncing,
    error,
    lastSynced,
    refetch: fetchFreshData,
    isOffline: isOfflineState,
  };
}

// ============ Transactions Hook ============

export function useOfflineTransactions() {
  return useOfflineData<Transaction>({
    storeName: STORES.TRANSACTIONS,
    fetchUrl: '/api/transactions',
  });
}

// ============ Accounts Hook ============

export function useOfflineAccounts() {
  return useOfflineData<Account>({
    storeName: STORES.ACCOUNTS,
    fetchUrl: '/api/accounts',
  });
}

// ============ Trips Hook ============

export function useOfflineTrips() {
  return useOfflineData<Trip>({
    storeName: STORES.TRIPS,
    fetchUrl: '/api/trips',
  });
}

// ============ Create Transaction (with offline support) ============

export async function createTransactionOffline(transaction: Omit<Transaction, 'id'>): Promise<{ 
  success: boolean; 
  id: string; 
  isOffline: boolean;
}> {
  // Generate a temporary ID for offline transactions
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const newTransaction = {
    ...transaction,
    id: tempId,
  };

  if (isOnline()) {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }

      const created = await response.json();
      
      // Save to IndexedDB
      await put(STORES.TRANSACTIONS, created);
      
      return { success: true, id: created.id, isOffline: false };
    } catch (error) {
      console.error('Online creation failed, saving offline:', error);
      // Fall through to offline handling
    }
  }

  // Save locally and queue for sync
  await put(STORES.TRANSACTIONS, newTransaction);
  await addPendingChange({
    type: 'create',
    storeName: STORES.TRANSACTIONS,
    data: transaction,
  });

  return { success: true, id: tempId, isOffline: true };
}

// ============ Background Sync ============

export async function syncPendingChanges(): Promise<{ synced: number; failed: number }> {
  if (!isOnline()) {
    return { synced: 0, failed: 0 };
  }

  const pending = await getPendingChanges();
  let synced = 0;
  let failed = 0;

  for (const change of pending) {
    try {
      let response: Response;
      
      switch (change.type) {
        case 'create':
          response = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(change.data),
          });
          break;
        case 'update':
          response = await fetch(`/api/transactions/${change.data.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(change.data),
          });
          break;
        case 'delete':
          response = await fetch(`/api/transactions/${change.data.id}`, {
            method: 'DELETE',
          });
          break;
        default:
          continue;
      }

      if (response.ok) {
        await removePendingChange(change.id!);
        synced++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error('Failed to sync change:', error);
      failed++;
    }
  }

  return { synced, failed };
}

// ============ Offline Status Hook ============

export function useOnlineStatus() {
  const [online, setOnline] = useState(isOnline());
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const updateOnlineStatus = () => setOnline(navigator.onLine);
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Check pending changes
    const checkPending = async () => {
      const pending = await getPendingChanges();
      setPendingCount(pending.length);
    };
    checkPending();

    // Sync when coming online
    const handleOnline = async () => {
      const result = await syncPendingChanges();
      if (result.synced > 0) {
        const pending = await getPendingChanges();
        setPendingCount(pending.length);
      }
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return { online, pendingCount };
}

