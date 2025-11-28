"use client";

import { useEffect, useState } from "react";
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
    budget: any;
    accounts: any[];
    transactions: any[];
    expenses: any[];
    recurringTransactions: any[];
    trips: any[];
    currentMonth: number;
    currentYear: number;
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
  const transactions = isHydrated && offlineTransactions.length > 0 
    ? offlineTransactions 
    : initialData.transactions;
    
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
        budget={initialData.budget}
        accounts={accounts}
        transactions={transactions}
        recurringTransactions={initialData.recurringTransactions}
        trips={trips}
        currentMonth={initialData.currentMonth}
        currentYear={initialData.currentYear}
      />
    </div>
  );
}


