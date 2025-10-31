"use client";

import { useState } from "react";

interface GoogleDriveConnectionProps {
  isConnected: boolean;
  folderId: string | null;
}

export default function GoogleDriveConnection({
  isConnected,
  folderId,
}: GoogleDriveConnectionProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleConnect = () => {
    // Redirect to OAuth flow
    window.location.href = "/api/auth/google-drive/connect";
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Google Drive? Your photos will remain in Drive but won't be accessible through the app.")) {
      return;
    }

    setIsDisconnecting(true);
    try {
      const res = await fetch("/api/auth/google-drive/disconnect", {
        method: "POST",
      });

      if (res.ok) {
        window.location.reload();
      } else {
        alert("Failed to disconnect Google Drive");
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
      alert("Failed to disconnect Google Drive");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleOpenFolder = () => {
    if (folderId) {
      window.open(`https://drive.google.com/drive/folders/${folderId}`, "_blank");
    }
  };

  if (isConnected) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold text-green-900">Connected</p>
              <p className="text-sm text-green-700">
                Your trip photos are saved to your Google Drive
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {folderId && (
            <button
              onClick={handleOpenFolder}
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
            >
              📁 Open Folder in Drive
            </button>
          )}
          <button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isDisconnecting ? "Disconnecting..." : "Disconnect"}
          </button>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-900">
            <strong>💡 Tip:</strong> All photos you upload through the app are stored in your personal Google Drive.
            You and your wife can access them anytime, even after disconnecting the app.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-bold text-yellow-900">Not Connected</p>
            <p className="text-sm text-yellow-800">
              Connect your Google Drive to save trip photos permanently
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleConnect}
        className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-3"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.545 10.239l3.448 5.97h-6.895l3.447-5.97zm5.707 0l-3.448-5.97-6.896 11.94h3.448l3.448-5.97h3.448zm-11.413 0h-6.896l3.448 5.97 3.448-5.97z" />
        </svg>
        Connect Google Drive
      </button>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <p className="text-sm text-gray-700 mb-3">
          <strong>Why connect Google Drive?</strong>
        </p>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-start gap-2">
            <span>✓</span>
            <span>Your photos are saved to YOUR personal Google Drive</span>
          </li>
          <li className="flex items-start gap-2">
            <span>✓</span>
            <span>Free unlimited storage with Google Photos quality</span>
          </li>
          <li className="flex items-start gap-2">
            <span>✓</span>
            <span>Access photos anytime, even outside the app</span>
          </li>
          <li className="flex items-start gap-2">
            <span>✓</span>
            <span>Automatically backed up by Google</span>
          </li>
          <li className="flex items-start gap-2">
            <span>✓</span>
            <span>You control the photos - delete or share as you wish</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
