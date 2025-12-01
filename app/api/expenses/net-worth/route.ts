import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { convertCurrency } from "@/lib/currency";

// Helper function to infer currency from trip destination
function inferCurrencyFromDestination(destination?: string | null): string | null {
  if (!destination) return null;
  const dest = destination.toLowerCase();
  
  if (dest.includes('thailand') || dest.includes('phuket') || dest.includes('bangkok') || dest.includes('chiang mai') || dest.includes('pattaya') || dest.includes('krabi')) {
    return 'THB';
  } else if (dest.includes('japan') || dest.includes('tokyo') || dest.includes('osaka') || dest.includes('kyoto')) {
    return 'JPY';
  } else if (dest.includes('china') || dest.includes('beijing') || dest.includes('shanghai')) {
    return 'CNY';
  } else if (dest.includes('korea') || dest.includes('seoul')) {
    return 'KRW';
  } else if (dest.includes('uk') || dest.includes('london') || dest.includes('england') || dest.includes('britain')) {
    return 'GBP';
  } else if (dest.includes('europe') || dest.includes('paris') || dest.includes('berlin') || dest.includes('rome') || dest.includes('spain') || dest.includes('italy') || dest.includes('france') || dest.includes('germany')) {
    return 'EUR';
  } else if (dest.includes('singapore')) {
    return 'SGD';
  } else if (dest.includes('australia') || dest.includes('sydney') || dest.includes('melbourne')) {
    return 'AUD';
  } else if (dest.includes('canada') || dest.includes('toronto') || dest.includes('vancouver')) {
    return 'CAD';
  } else if (dest.includes('hong kong')) {
    return 'HKD';
  } else if (dest.includes('india') || dest.includes('mumbai') || dest.includes('delhi')) {
    return 'INR';
  }
  
  return null;
}

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all active accounts with their current balance
    const accounts = await prisma.account.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        type: true,
        currency: true,
        balance: true, // Include balance to check if account is bank-synced
        bankConnectionId: true,
        lastSyncedAt: true,
      },
    });

    // Get ALL transactions for all accounts
    const allTransactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        accountId: { in: accounts.map(a => a.id) },
      },
      include: {
        account: {
          select: {
            currency: true,
          },
        },
        trip: {
          select: {
            destination: true,
          },
        },
      },
    });

    // Calculate balance for each account from transactions
    // Always calculate from transactions for accuracy (ignoring potentially corrupted DB balances)
    const accountBalances: Record<string, number> = {};
    
    // Initialize all balances to 0 - we'll calculate from transactions
    accounts.forEach(acc => {
      accountBalances[acc.id] = 0;
    });

    // Sum all transactions per account with proper currency conversion
    for (const tx of allTransactions) {
      const account = accounts.find(a => a.id === tx.accountId);
      if (!account) continue;

      // Determine transaction currency
      let txCurrency = tx.currency;
      
      if (!txCurrency && (tx.isTripRelated || tx.tripId) && tx.trip?.destination) {
        const inferredCurrency = inferCurrencyFromDestination(tx.trip.destination);
        if (inferredCurrency) {
          txCurrency = inferredCurrency;
        }
      }
      
      if (!txCurrency) {
        txCurrency = account.currency || 'USD';
      }

      // Convert transaction amount to account currency
      const amountInAccountCurrency = convertCurrency(
        tx.amount,
        txCurrency,
        account.currency
      );

      // Add to account balance
      accountBalances[tx.accountId] += amountInAccountCurrency;
    }

    // Calculate Net Worth: sum all account balances converted to USD
    let netWorth = 0;
    const accountDetails = accounts.map(account => {
      const balance = accountBalances[account.id] || 0;
      const balanceInUSD = convertCurrency(balance, account.currency, "USD");
      
      // For credit cards, loans, and debt accounts, subtract from net worth
      const contribution = ["credit_card", "loan", "debt"].includes(account.type) 
        ? -Math.abs(balanceInUSD) 
        : balanceInUSD;
      
      netWorth += contribution;

      return {
        id: account.id,
        name: account.name,
        type: account.type,
        currency: account.currency,
        balance,
        balanceInUSD,
        contribution,
        calculatedFromTransactions: !account.bankConnectionId || !account.lastSyncedAt || 
          (Date.now() - new Date(account.lastSyncedAt).getTime()) / (1000 * 60 * 60 * 24) >= 7,
      };
    });

    return NextResponse.json({
      netWorth,
      accounts: accountDetails,
      calculatedFromTransactions: true,
    });
  } catch (error) {
    console.error("Error calculating net worth:", error);
    return NextResponse.json(
      { error: "Failed to calculate net worth" },
      { status: 500 }
    );
  }
}

