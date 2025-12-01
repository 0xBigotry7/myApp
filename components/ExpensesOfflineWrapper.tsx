"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  useOfflineTransactions, 
  useOfflineAccounts, 
  useOfflineTrips,
  syncPendingChanges,
} from "@/lib/use-offline-data";
import { SyncStatusBadge } from "./OfflineIndicator";
import ExpensesClientEnhanced from "./ExpensesClientEnhanced";
import { initDB, putMany, STORES } from "@/lib/offline-db";

interface ExpensesOfflineWrapperProps {
  // Initial data from server (for first paint)
  initialData: {
    accounts: any[];
    transactions: any[];
    trips: any[];
    currentMonth: number;
    currentYear: number;
    // Pagination support
    hasMoreTransactions?: boolean;
    nextCursor?: string | null;
    monthlyStats?: {
      totalSpent: number;
      transactionCount: number;
    };
  };
}

export default function ExpensesOfflineWrapper({ initialData }: ExpensesOfflineWrapperProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Use offline-first hooks
  const { 
    data: offlineTransactions, 
    isLoading: txLoading,
    isStale: txStale,
    isSyncing: txSyncing,
    lastSynced: txLastSynced,
    isOffline,
    refetch: refetchTransactions,
  } = useOfflineTransactions();
  
  const { 
    data: offlineAccounts,
    isLoading: accLoading,
  } = useOfflineAccounts();
  
  const { 
    data: offlineTrips,
    isLoading: tripsLoading,
  } = useOfflineTrips();

  // Initialize IndexedDB with server data on first load
  useEffect(() => {
    const initializeOfflineData = async () => {
      try {
        await initDB();
        
        // Store initial server data in IndexedDB
        if (initialData.transactions.length > 0) {
          await putMany(STORES.TRANSACTIONS, initialData.transactions);
        }
        if (initialData.accounts.length > 0) {
          await putMany(STORES.ACCOUNTS, initialData.accounts);
        }
        if (initialData.trips.length > 0) {
          await putMany(STORES.TRIPS, initialData.trips);
        }
        
        setIsHydrated(true);
      } catch (error) {
        console.error('Failed to initialize offline data:', error);
        setIsHydrated(true); // Continue anyway
      }
    };

    initializeOfflineData();
  }, [initialData]);

  // Sync pending changes when coming online
  useEffect(() => {
    const handleOnline = async () => {
      const result = await syncPendingChanges();
      if (result.synced > 0) {
        refetchTransactions();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [refetchTransactions]);

  // Use offline data if available and hydrated, otherwise use initial data
  // Deduplicate transactions by ID to prevent duplicate key errors
  const transactions = useMemo(() => {
    const txList = isHydrated && offlineTransactions.length > 0 
      ? offlineTransactions 
      : initialData.transactions;
    
    // Deduplicate by ID, keeping the most recent version
    const seen = new Map<string, any>();
    for (const tx of txList) {
      if (!seen.has(tx.id) || new Date(tx.updatedAt || tx.createdAt || 0) > new Date(seen.get(tx.id).updatedAt || seen.get(tx.id).createdAt || 0)) {
        seen.set(tx.id, tx);
      }
    }
    return Array.from(seen.values());
  }, [isHydrated, offlineTransactions, initialData.transactions]);
    
  const accounts = isHydrated && offlineAccounts.length > 0 
    ? offlineAccounts 
    : initialData.accounts;
    
  const trips = isHydrated && offlineTrips.length > 0 
    ? offlineTrips 
    : initialData.trips;

  return (
    <div className="relative">
      {/* Sync status indicator */}
      <div className="absolute top-0 right-0 z-10">
        <SyncStatusBadge 
          isStale={txStale}
          isSyncing={txSyncing}
          lastSynced={txLastSynced}
          isOffline={isOffline}
        />
      </div>
      
      <ExpensesClientEnhanced
        accounts={accounts}
        transactions={transactions}
        trips={trips}
        currentMonth={initialData.currentMonth}
        currentYear={initialData.currentYear}
        hasMoreTransactions={initialData.hasMoreTransactions}
        nextCursor={initialData.nextCursor}
        monthlyStats={initialData.monthlyStats}
      />
    </div>
  );
}


