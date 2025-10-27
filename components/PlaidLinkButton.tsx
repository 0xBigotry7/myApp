'use client';

import { useCallback, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';

interface PlaidLinkButtonProps {
  onSuccess?: () => void;
  onExit?: () => void;
}

export function PlaidLinkButton({ onSuccess, onExit }: PlaidLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSuccessCallback = useCallback(
    async (public_token: string, metadata: any) => {
      setLoading(true);
      try {
        // Exchange public token for access token
        const response = await fetch('/api/plaid/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_token, metadata }),
        });

        if (!response.ok) {
          throw new Error('Failed to exchange token');
        }

        const data = await response.json();
        console.log('Bank connected:', data);

        // Trigger sync immediately after connection
        await fetch('/api/plaid/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bankConnectionId: data.bankConnection.id }),
        });

        onSuccess?.();
      } catch (error) {
        console.error('Error exchanging token:', error);
        alert('Failed to connect bank account. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [onSuccess]
  );

  const config = {
    token: linkToken,
    onSuccess: onSuccessCallback,
    onExit: (error: any, metadata: any) => {
      console.log('Plaid Link exited:', error, metadata);
      onExit?.();
    },
  };

  const { open, ready } = usePlaidLink(config);

  const handleClick = async () => {
    if (linkToken) {
      open();
      return;
    }

    setLoading(true);
    try {
      // Get link token
      const response = await fetch('/api/plaid/link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to create link token');
      }

      const data = await response.json();
      setLinkToken(data.link_token);

      // The usePlaidLink hook will automatically open when linkToken is set
      // But we need to wait for the next render, so we'll open it manually
      setTimeout(() => {
        open();
      }, 100);
    } catch (error) {
      console.error('Error creating link token:', error);
      alert('Failed to initialize Plaid. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading || (linkToken !== null && !ready)}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Loading...' : 'Connect Bank of America'}
    </button>
  );
}
