'use client';

import { useState } from 'react';

interface WiseConnectFormProps {
  onSuccess?: () => void;
}

export function WiseConnectForm({ onSuccess }: WiseConnectFormProps) {
  const [apiToken, setApiToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiToken.trim()) {
      alert('Please enter your Wise API token');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/wise/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiToken }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to connect Wise account');
      }

      const data = await response.json();
      console.log('Wise connected:', data);

      // Trigger sync immediately after connection
      await fetch('/api/wise/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankConnectionId: data.bankConnection.id }),
      });

      setApiToken('');
      setShowForm(false);
      onSuccess?.();
      alert('Wise account connected successfully!');
    } catch (error: any) {
      console.error('Error connecting Wise:', error);
      alert(error.message || 'Failed to connect Wise account. Please check your API token and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Connect Wise Account
      </button>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-white">
      <h3 className="text-lg font-semibold mb-2">Connect Wise Account</h3>
      <p className="text-sm text-gray-600 mb-4">
        To connect your Wise account, you need an API token.
        <a
          href="https://wise.com/settings/personal-tokens"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline ml-1"
        >
          Get your token here
        </a>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="apiToken" className="block text-sm font-medium text-gray-700 mb-1">
            Wise API Token
          </label>
          <input
            type="password"
            id="apiToken"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder="Enter your Wise API token"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={loading}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !apiToken.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connecting...' : 'Connect'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setApiToken('');
            }}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
