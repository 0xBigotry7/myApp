import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bankConnections = await prisma.bankConnection.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        accounts: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Don't send access tokens to the client
    const sanitized = bankConnections.map(conn => ({
      ...conn,
      accessToken: undefined,
    }));

    return NextResponse.json(sanitized);
  } catch (error: any) {
    console.error('Error fetching bank connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bank connections', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('id');

    if (!connectionId) {
      return NextResponse.json({ error: 'Connection ID is required' }, { status: 400 });
    }

    // Verify ownership
    const connection = await prisma.bankConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection || connection.userId !== session.user.id) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Delete the connection (accounts and transactions will cascade)
    await prisma.bankConnection.delete({
      where: { id: connectionId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting bank connection:', error);
    return NextResponse.json(
      { error: 'Failed to delete bank connection', details: error.message },
      { status: 500 }
    );
  }
}
