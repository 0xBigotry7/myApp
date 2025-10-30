import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createWiseClient } from '@/lib/wise';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bankConnectionId } = await request.json();

    // Get bank connection
    const bankConnection = await prisma.bankConnection.findUnique({
      where: { id: bankConnectionId },
      include: { accounts: true },
    });

    if (!bankConnection || bankConnection.userId !== session.user.id) {
      return NextResponse.json({ error: 'Bank connection not found' }, { status: 404 });
    }

    if (bankConnection.provider !== 'wise') {
      return NextResponse.json({ error: 'Not a Wise connection' }, { status: 400 });
    }

    const wiseClient = createWiseClient(bankConnection.accessToken);

    // Get profiles
    const profiles = await wiseClient.getProfiles();
    const profile = profiles.find((p: any) => p.type === 'PERSONAL') || profiles[0];

    // Get borderless accounts
    const borderlessAccounts = await wiseClient.getAccounts(profile.id);

    if (borderlessAccounts.length === 0) {
      return NextResponse.json({ error: 'No Wise accounts found' }, { status: 404 });
    }

    const borderlessAccount = borderlessAccounts[0];
    let addedTransactions: any[] = [];

    // Sync transactions for each currency
    for (const account of bankConnection.accounts) {
      if (!account.currency) continue;

      try {
        // Get transactions for the last 90 days
        const statement = await wiseClient.getTransactions(
          profile.id,
          borderlessAccount.id.toString(),
          account.currency,
          {
            intervalStart: account.lastSyncedAt
              ? account.lastSyncedAt.toISOString()
              : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            intervalEnd: new Date().toISOString(),
          }
        );

        // Process transactions
        if (statement.transactions && Array.isArray(statement.transactions)) {
          for (const transaction of statement.transactions) {
            // Skip if transaction already exists
            const existing = await prisma.transaction.findUnique({
              where: { bankTransactionId: `wise_${transaction.referenceNumber}` },
            });

            if (existing) continue;

            // Determine category based on transaction type
            const category = categorizeWiseTransaction(transaction);

            const newTransaction = await prisma.transaction.create({
              data: {
                userId: session.user.id,
                accountId: account.id,
                amount: Math.abs(transaction.amount.value),
                category,
                merchantName: transaction.details?.merchant?.name || transaction.details?.description || null,
                description: transaction.details?.description || transaction.type,
                date: new Date(transaction.date),
                isFromBankSync: true,
                bankTransactionId: `wise_${transaction.referenceNumber}`,
                pending: false,
              },
            });

            addedTransactions.push(newTransaction);
          }
        }

        // Update account balance
        const balances = await wiseClient.getBalance(
          profile.id,
          borderlessAccount.id.toString()
        );

        const balance = balances.find((b: any) => b.currency === account.currency);
        if (balance) {
          await prisma.account.update({
            where: { id: account.id },
            data: {
              balance: balance.amount.value,
              lastSyncedAt: new Date(),
            },
          });
        }
      } catch (error) {
        console.error(`Error syncing ${account.currency} transactions:`, error);
        // Continue with other currencies even if one fails
      }
    }

    // Update last synced time
    await prisma.bankConnection.update({
      where: { id: bankConnectionId },
      data: {
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      added: addedTransactions.length,
      modified: 0,
      removed: 0,
    });
  } catch (error: any) {
    console.error('Error syncing Wise transactions:', error);
    return NextResponse.json(
      { error: 'Failed to sync Wise transactions', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to categorize Wise transactions
function categorizeWiseTransaction(transaction: any): string {
  const type = transaction.type?.toLowerCase() || '';
  const description = transaction.details?.description?.toLowerCase() || '';

  if (type.includes('transfer') || type.includes('conversion')) {
    return 'Transfer';
  }

  if (type.includes('card')) {
    // Try to categorize based on merchant or description
    if (description.includes('restaurant') || description.includes('food')) {
      return 'Food';
    }
    if (description.includes('transport') || description.includes('uber') || description.includes('taxi')) {
      return 'Transportation';
    }
    if (description.includes('hotel') || description.includes('airbnb')) {
      return 'Accommodation';
    }
    return 'Shopping';
  }

  if (type.includes('deposit') || transaction.amount.value > 0) {
    return 'Income';
  }

  return 'Other';
}
