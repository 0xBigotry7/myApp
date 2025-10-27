import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { plaidClient } from '@/lib/plaid';
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

    if (bankConnection.provider !== 'plaid') {
      return NextResponse.json({ error: 'Not a Plaid connection' }, { status: 400 });
    }

    let cursor = bankConnection.cursor;
    let hasMore = true;
    let addedTransactions: any[] = [];
    let modifiedTransactions: any[] = [];
    let removedTransactions: any[] = [];

    // Sync transactions using the /transactions/sync endpoint
    while (hasMore) {
      const request: any = {
        access_token: bankConnection.accessToken,
      };
      if (cursor) {
        request.cursor = cursor;
      }

      const response = await plaidClient.transactionsSync(request);
      const data = response.data;

      // Process added transactions
      for (const transaction of data.added) {
        const account = bankConnection.accounts.find(
          (acc) => acc.plaidAccountId === transaction.account_id
        );

        if (!account) continue;

        // Check if transaction already exists
        const existing = await prisma.transaction.findUnique({
          where: { bankTransactionId: transaction.transaction_id },
        });

        if (existing) {
          continue; // Skip duplicates
        }

        // Auto-categorize based on Plaid category or merchant
        const category = await determineCategory(
          transaction,
          session.user.id
        );

        const newTransaction = await prisma.transaction.create({
          data: {
            userId: session.user.id,
            accountId: account.id,
            amount: transaction.amount,
            category,
            merchantName: transaction.merchant_name || transaction.name,
            description: transaction.name,
            date: new Date(transaction.date),
            isFromBankSync: true,
            bankTransactionId: transaction.transaction_id,
            pending: transaction.pending,
            location: transaction.location?.city
              ? `${transaction.location.city}, ${transaction.location.region}`
              : null,
            latitude: transaction.location?.lat || null,
            longitude: transaction.location?.lon || null,
          },
        });

        addedTransactions.push(newTransaction);
      }

      // Process modified transactions
      for (const transaction of data.modified) {
        const updated = await prisma.transaction.updateMany({
          where: { bankTransactionId: transaction.transaction_id },
          data: {
            amount: transaction.amount,
            merchantName: transaction.merchant_name || transaction.name,
            description: transaction.name,
            pending: transaction.pending,
          },
        });
        if (updated.count > 0) {
          modifiedTransactions.push(transaction);
        }
      }

      // Process removed transactions
      for (const transaction of data.removed) {
        const deleted = await prisma.transaction.deleteMany({
          where: { bankTransactionId: transaction.transaction_id },
        });
        if (deleted.count > 0) {
          removedTransactions.push(transaction);
        }
      }

      hasMore = data.has_more;
      cursor = data.next_cursor;
    }

    // Update cursor and last synced time
    await prisma.bankConnection.update({
      where: { id: bankConnectionId },
      data: {
        cursor,
        lastSyncedAt: new Date(),
      },
    });

    // Update account balances
    const balancesResponse = await plaidClient.accountsBalanceGet({
      access_token: bankConnection.accessToken,
    });

    await Promise.all(
      balancesResponse.data.accounts.map(async (plaidAccount) => {
        const account = bankConnection.accounts.find(
          (acc) => acc.plaidAccountId === plaidAccount.account_id
        );
        if (account) {
          await prisma.account.update({
            where: { id: account.id },
            data: {
              balance: plaidAccount.balances.current || 0,
              lastSyncedAt: new Date(),
            },
          });
        }
      })
    );

    return NextResponse.json({
      success: true,
      added: addedTransactions.length,
      modified: modifiedTransactions.length,
      removed: removedTransactions.length,
    });
  } catch (error: any) {
    console.error('Error syncing transactions:', error);
    return NextResponse.json(
      { error: 'Failed to sync transactions', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to determine category
async function determineCategory(transaction: any, userId: string): Promise<string> {
  // First, check if we have a category rule for this merchant
  if (transaction.merchant_name) {
    const rule = await prisma.categoryRule.findFirst({
      where: {
        userId,
        merchant: {
          contains: transaction.merchant_name,
          mode: 'insensitive',
        },
      },
      orderBy: { confidence: 'desc' },
    });

    if (rule) {
      // Increment usage count
      await prisma.categoryRule.update({
        where: { id: rule.id },
        data: { timesUsed: { increment: 1 } },
      });
      return rule.category;
    }
  }

  // Fall back to Plaid's category
  if (transaction.personal_finance_category) {
    const plaidCategory = transaction.personal_finance_category.primary;
    return mapPlaidCategory(plaidCategory);
  }

  // Default category
  return 'Uncategorized';
}

// Map Plaid categories to our categories
function mapPlaidCategory(plaidCategory: string): string {
  const categoryMap: Record<string, string> = {
    'FOOD_AND_DRINK': 'Food',
    'TRANSPORTATION': 'Transportation',
    'ENTERTAINMENT': 'Entertainment',
    'SHOPPING': 'Shopping',
    'TRAVEL': 'Travel',
    'GENERAL_SERVICES': 'Services',
    'RENT_AND_UTILITIES': 'Housing',
    'HEALTHCARE': 'Healthcare',
    'INCOME': 'Income',
    'TRANSFER': 'Transfer',
  };

  return categoryMap[plaidCategory] || 'Other';
}
