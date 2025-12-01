"use client";

import { useOnlineStatus } from "@/lib/use-offline-data";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";

export default function OfflineIndicator() {
  const { online, pendingCount } = useOnlineStatus();

  if (online && pendingCount === 0) {
    return null; // Don't show anything when online and synced
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2">
      {!online && (
        <div className="flex items-center gap-2 bg-amber-500 text-white px-3 py-2 rounded-full shadow-lg text-sm font-medium animate-pulse">
          <CloudOff className="w-4 h-4" />
          <span>Offline</span>
        </div>
      )}
      
      {pendingCount > 0 && (
        <div className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-full shadow-lg text-sm font-medium">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>{pendingCount} pending</span>
        </div>
      )}
    </div>
  );
}

// Sync status badge for headers
export function SyncStatusBadge({ 
  isStale, 
  isSyncing, 
  lastSynced,
  isOffline,
}: { 
  isStale: boolean; 
  isSyncing: boolean; 
  lastSynced: Date | null;
  isOffline: boolean;
}) {
  if (isSyncing) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
        <RefreshCw className="w-3 h-3 animate-spin" />
        Syncing...
      </span>
    );
  }

  if (isOffline) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
        <CloudOff className="w-3 h-3" />
        Offline
      </span>
    );
  }

  if (isStale && lastSynced) {
    const timeAgo = getTimeAgo(lastSynced);
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded-full">
        <Cloud className="w-3 h-3" />
        {timeAgo}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
      <Cloud className="w-3 h-3" />
      Synced
    </span>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}




