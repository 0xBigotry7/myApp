import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
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

export async function GET(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    // Calculate date range for the selected month
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    // Fetch ALL transactions for the selected month
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
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

    // Process transactions with currency conversion
    let totalSpent = 0;
    let totalIncome = 0;
    let tripSpent = 0;
    let transactionCount = transactions.length;

    for (const tx of transactions) {
      // Determine currency
      let currency = tx.currency;
      
      if (!currency && (tx.isTripRelated || tx.tripId) && tx.trip?.destination) {
        const inferredCurrency = inferCurrencyFromDestination(tx.trip.destination);
        if (inferredCurrency) {
          currency = inferredCurrency;
        }
      }
      
      if (!currency) {
        currency = tx.account?.currency || 'USD';
      }

      // Convert to USD
      const amountUSD = convertCurrency(Math.abs(tx.amount), currency, "USD");
      
      if (tx.amount < 0) {
        // Expense
        totalSpent += amountUSD;
        if (tx.isTripRelated || tx.tripId) {
          tripSpent += amountUSD;
        }
      } else {
        // Income
        totalIncome += amountUSD;
      }
    }

    // Calculate daily average
    const daysInMonth = new Date(year, month, 0).getDate();
    const now = new Date();
    const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();
    const daysPassed = isCurrentMonth ? now.getDate() : daysInMonth;
    const dailyAverage = daysPassed > 0 ? totalSpent / daysPassed : 0;

    return NextResponse.json({
      totalSpent,
      totalIncome,
      tripSpent,
      net: totalIncome - totalSpent,
      dailyAverage,
      transactionCount,
      month,
      year,
    });
  } catch (error) {
    console.error("Error fetching monthly stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch monthly stats" },
      { status: 500 }
    );
  }
}



