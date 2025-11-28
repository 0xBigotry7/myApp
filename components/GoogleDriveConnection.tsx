"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Cloud, ExternalLink, HardDrive, LogOut, RefreshCw } from "lucide-react";

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
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <img src="https://upload.wikimedia.org/wikipedia/commons/d/da/Google_Drive_logo_%282020-present%29.svg" alt="Google Drive" className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                Google Drive
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              </h3>
              <p className="text-sm text-zinc-500">Photos are automatically backed up to your Drive</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {folderId && (
              <button
                onClick={handleOpenFolder}
                className="flex-1 px-4 py-3 bg-white border border-zinc-200 text-zinc-700 rounded-xl font-medium hover:bg-zinc-50 hover:border-zinc-300 transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open Folder in Drive
              </button>
            )}
            <button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="flex-1 px-4 py-3 bg-white border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 hover:border-red-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isDisconnecting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              {isDisconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 flex gap-3 text-sm text-blue-900">
            <AlertCircle className="w-5 h-5 shrink-0 text-blue-600" />
            <div>
              <p className="font-bold mb-1">Your photos are safe</p>
              <p className="opacity-90">
                Even if you disconnect, all photos remain in your personal Google Drive. You maintain full ownership and control of your data.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center p-3">
              <img src="https://upload.wikimedia.org/wikipedia/commons/d/da/Google_Drive_logo_%282020-present%29.svg" alt="Google Drive" className="w-full h-full" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-zinc-900">Connect Google Drive</h3>
              <p className="text-sm text-zinc-500">Secure cloud storage for your memories</p>
            </div>
          </div>
          <div className="hidden sm:block px-3 py-1 bg-zinc-100 rounded-full text-xs font-bold text-zinc-500">
            Recommended
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <ul className="space-y-3 text-sm text-zinc-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Unlimited photo storage (via Google)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Access photos outside the app</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Automatic backup & sync</span>
            </li>
          </ul>
          <div className="bg-zinc-50 rounded-xl p-4 text-xs text-zinc-500 leading-relaxed">
            We use Google Drive to store your photos securely. This ensures you always own your data and can access your memories even if you stop using our app.
          </div>
        </div>

        <button
          onClick={handleConnect}
          className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold text-base shadow-lg shadow-zinc-200 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <HardDrive className="w-5 h-5" />
          Connect Google Drive Account
        </button>
      </div>
    </div>
  );
}
