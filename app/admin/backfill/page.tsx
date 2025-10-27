"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BackfillPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleBackfill = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/admin/backfill-transactions", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to backfill transactions");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold mb-2">Backfill Transactions</h1>
          <p className="text-gray-600 mb-8">
            This will sync all your trip expenses to the finance system,
            creating corresponding transactions.
          </p>

          <button
            onClick={handleBackfill}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {loading ? "Processing..." : "Sync Trip Expenses to Finance"}
          </button>

          {result && (
            <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-xl">
              <h3 className="text-lg font-semibold text-green-800 mb-3">
                {result.summary.errors > 0 ? "Completed with Warnings" : "Success!"}
              </h3>
              <p className="text-green-700 mb-4">{result.message}</p>
              <div className={`grid ${result.summary.errors > 0 ? 'grid-cols-4' : 'grid-cols-3'} gap-4 text-center`}>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-sm text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {result.summary.totalExpenses}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="text-2xl font-bold text-green-600">
                    {result.summary.created}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-sm text-gray-600">Skipped</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {result.summary.skipped}
                  </p>
                </div>
                {result.summary.errors > 0 && (
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm text-gray-600">Errors</p>
                    <p className="text-2xl font-bold text-red-600">
                      {result.summary.errors}
                    </p>
                  </div>
                )}
              </div>
              {result.errorDetails && result.errorDetails.length > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-800 mb-2">Error Details:</p>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    {result.errorDetails.map((error: string, idx: number) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => router.push("/finance")}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Finance
                </button>
                <button
                  onClick={() => router.push("/transactions")}
                  className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Go to Transactions
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-xl">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Error
              </h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-gray-200">
            <button
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
