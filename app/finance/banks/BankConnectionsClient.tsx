'use client';

import { useState } from 'react';
import { PlaidLinkButton } from '@/components/PlaidLinkButton';
import { WiseConnectForm } from '@/components/WiseConnectForm';
import { useRouter } from 'next/navigation';

interface BankConnection {
  id: string;
  provider: string;
  institutionName: string | null;
  isActive: boolean;
  lastSyncedAt: Date | null;
  createdAt: Date;
  accounts: Account[];
}

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  lastSyncedAt: Date | null;
}

interface Props {
  initialConnections: BankConnection[];
}

export function BankConnectionsClient({ initialConnections }: Props) {
  const router = useRouter();
  const [connections, setConnections] = useState(initialConnections);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);

  const handleRefresh = () => {
    router.refresh();
  };

  const handleSyncConnection = async (connectionId: string, provider: string) => {
    setSyncing(connectionId);
    try {
      const endpoint = provider === 'plaid' ? '/api/plaid/sync' : '/api/wise/sync';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankConnectionId: connectionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync');
      }

      const data = await response.json();
      alert(`Synced successfully! Added ${data.added} new transactions.`);
      router.refresh();
    } catch (error) {
      console.error('Error syncing:', error);
      alert('Failed to sync transactions. Please try again.');
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      const response = await fetch('/api/bank/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to sync all');
      }

      const data = await response.json();
      alert(`Synced all accounts! Added ${data.totalAdded} new transactions.`);
      router.refresh();
    } catch (error) {
      console.error('Error syncing all:', error);
      alert('Failed to sync all accounts. Please try again.');
    } finally {
      setSyncingAll(false);
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this bank? All synced transactions will remain.')) {
      return;
    }

    try {
      const response = await fetch(`/api/bank/connections?id=${connectionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      alert('Bank disconnected successfully!');
      router.refresh();
    } catch (error) {
      console.error('Error deleting connection:', error);
      alert('Failed to disconnect bank. Please try again.');
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Connection buttons */}
      <div className="bg-white rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold mb-4">Add Bank Connection</h2>
        <div className="flex gap-4 flex-wrap">
          <PlaidLinkButton onSuccess={handleRefresh} />
          <WiseConnectForm onSuccess={handleRefresh} />
        </div>
      </div>

      {/* Sync all button */}
      {connections.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSyncAll}
            disabled={syncingAll}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {syncingAll ? 'Syncing...' : 'Sync All Banks'}
          </button>
        </div>
      )}

      {/* Connected banks */}
      {connections.length === 0 ? (
        <div className="bg-white rounded-lg p-12 shadow text-center">
          <p className="text-gray-500">No bank connections yet. Connect your first bank above!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {connections.map((connection) => (
            <div key={connection.id} className="bg-white rounded-lg p-6 shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    {connection.institutionName || 'Unknown Bank'}
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                      {connection.provider}
                    </span>
                  </h3>
                  <p className="text-sm text-gray-500">
                    Last synced: {formatDate(connection.lastSyncedAt)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Connected: {formatDate(connection.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSyncConnection(connection.id, connection.provider)}
                    disabled={syncing === connection.id}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {syncing === connection.id ? 'Syncing...' : 'Sync'}
                  </button>
                  <button
                    onClick={() => handleDeleteConnection(connection.id)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Disconnect
                  </button>
                </div>
              </div>

              {/* Accounts */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Accounts ({connection.accounts.length})</h4>
                {connection.accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-gray-500 capitalize">{account.type}</p>
                      {account.lastSyncedAt && (
                        <p className="text-xs text-gray-400">
                          Synced: {formatDate(account.lastSyncedAt)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        {formatCurrency(account.balance, account.currency)}
                      </p>
                      <p className="text-xs text-gray-500">{account.currency}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
