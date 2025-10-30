import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { BankConnectionsClient } from './BankConnectionsClient';

export default async function BankConnectionsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  // Fetch bank connections
  const bankConnections = await prisma.bankConnection.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      accounts: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bank Connections</h1>
          <p className="text-gray-600">
            Connect your bank accounts to automatically sync transactions
          </p>
        </div>

        <BankConnectionsClient initialConnections={bankConnections} />
      </div>
    </div>
  );
}
