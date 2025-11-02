"use client";

import { useState, useEffect } from "react";

export default function PWAInstaller() {
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }

    // Check if running in standalone mode (already installed)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes("android-app://");

    if (isStandalone) {
      return; // Already installed, don't show prompt
    }

    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    // Detect if running in Safari (not installed)
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIOS && isSafari) {
      // Check if user already dismissed the prompt
      const dismissed = localStorage.getItem("ios-pwa-prompt-dismissed");
      if (!dismissed) {
        setTimeout(() => setShowIOSPrompt(true), 2000);
      }
    }

    // Android/Chrome install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroidPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleIOSDismiss = () => {
    setShowIOSPrompt(false);
    localStorage.setItem("ios-pwa-prompt-dismissed", "true");
  };

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    setDeferredPrompt(null);
    setShowAndroidPrompt(false);
  };

  if (showIOSPrompt) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 safe-all">
        <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-8 safe-bottom animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Install TravelAI</h3>
            <button
              onClick={handleIOSDismiss}
              className="text-gray-400 hover:text-gray-600 p-2 touch-target"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            Install this app on your iPhone for a better experience with offline access and quick launch from your home screen.
          </p>

          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">1️⃣</span>
              <p className="text-gray-700">
                Tap the <strong>Share</strong> button
                <span className="inline-block mx-1 px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  <svg className="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                </span>
                at the bottom of the screen
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">2️⃣</span>
              <p className="text-gray-700">
                Scroll down and tap <strong>"Add to Home Screen"</strong>
                <span className="inline-block mx-1 px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  <svg className="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                  </svg>
                </span>
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">3️⃣</span>
              <p className="text-gray-700">
                Tap <strong>"Add"</strong> in the top right corner
              </p>
            </div>
          </div>

          <button
            onClick={handleIOSDismiss}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors touch-target"
          >
            Got it!
          </button>
        </div>
      </div>
    );
  }

  if (showAndroidPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-all">
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg mx-auto border-2 border-blue-500">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <img src="/icons/icon-96x96.png" alt="TravelAI" className="w-16 h-16 rounded-2xl" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Install TravelAI</h3>
              <p className="text-sm text-gray-600 mb-4">
                Add to your home screen for quick access and offline use
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleAndroidInstall}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors touch-target"
                >
                  Install
                </button>
                <button
                  onClick={() => setShowAndroidPrompt(false)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-semibold rounded-xl transition-colors touch-target"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
