"use client";

// Settings page skeleton matching page layout
export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        {/* Account Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>👤</span>
            <span>Account</span>
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-600">Name:</span>
              <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mt-1" />
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Email:</span>
              <div className="h-7 w-56 bg-gray-200 rounded animate-pulse mt-1" />
            </div>
          </div>
        </div>

        {/* Google Drive Integration Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📁</span>
            <span>Google Drive</span>
          </h2>
          <div className="space-y-4">
            <div className="h-5 w-64 bg-gray-100 rounded animate-pulse" />
            <div className="flex items-center gap-4">
              <div className="h-12 w-48 bg-blue-100 rounded-lg animate-pulse" />
              <div className="h-12 w-32 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



