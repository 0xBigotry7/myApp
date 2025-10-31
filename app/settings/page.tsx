import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import GoogleDriveConnection from "@/components/GoogleDriveConnection";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      googleDriveRefreshToken: true,
      googleDriveFolderId: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const isGoogleDriveConnected = !!user.googleDriveRefreshToken;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        {/* Success/Error Messages */}
        {params.success && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-2xl">
            <p className="text-green-800 font-medium">✓ {params.success}</p>
          </div>
        )}
        {params.error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
            <p className="text-red-800 font-medium">✗ {params.error}</p>
          </div>
        )}

        {/* Account Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>👤</span>
            <span>Account</span>
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-600">Name:</span>
              <p className="text-lg text-gray-900">{user.name}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Email:</span>
              <p className="text-lg text-gray-900">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Google Drive Integration */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📁</span>
            <span>Google Drive</span>
          </h2>
          <GoogleDriveConnection
            isConnected={isGoogleDriveConnected}
            folderId={user.googleDriveFolderId}
          />
        </div>
      </div>
    </div>
  );
}
