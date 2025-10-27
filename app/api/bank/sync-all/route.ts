import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active bank connections for the user
    const bankConnections = await prisma.bankConnection.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });

    if (bankConnections.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No bank connections to sync',
        results: [],
      });
    }

    // Sync each connection
    const results = await Promise.allSettled(
      bankConnections.map(async (connection) => {
        const endpoint = connection.provider === 'plaid'
          ? '/api/plaid/sync'
          : '/api/wise/sync';

        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3002'}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || '',
          },
          body: JSON.stringify({ bankConnectionId: connection.id }),
        });

        const data = await response.json();

        return {
          connectionId: connection.id,
          provider: connection.provider,
          institutionName: connection.institutionName,
          ...data,
        };
      })
    );

    // Process results
    const syncResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          connectionId: bankConnections[index].id,
          provider: bankConnections[index].provider,
          institutionName: bankConnections[index].institutionName,
          error: result.reason.message || 'Sync failed',
          success: false,
        };
      }
    });

    const totalAdded = syncResults.reduce((sum, r) => sum + (r.added || 0), 0);
    const totalErrors = syncResults.filter(r => !r.success).length;

    return NextResponse.json({
      success: totalErrors === 0,
      totalAdded,
      totalErrors,
      results: syncResults,
    });
  } catch (error: any) {
    console.error('Error syncing all banks:', error);
    return NextResponse.json(
      { error: 'Failed to sync banks', details: error.message },
      { status: 500 }
    );
  }
}
