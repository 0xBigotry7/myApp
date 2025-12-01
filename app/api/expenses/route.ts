import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { convertCurrency } from "@/lib/currency";

// This route now creates transactions instead of expenses (Expense table deprecated)
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      tripId, amount, category, currency, date, note, accountId, location,
    } = body;

    // Parse date correctly
    let parsedDate: Date;
    if (date && typeof date === 'string') {
      if (date.includes('T') || date.includes('Z')) {
        parsedDate = new Date(date);
      } else {
        const [year, month, day] = date.split('-').map(Number);
        parsedDate = new Date(year, month - 1, day, 12, 0, 0, 0);
      }
    } else {
      parsedDate = new Date();
    }

    // Verify the trip belongs to the user or they are a member
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found or unauthorized" }, { status: 401 });
    }

    // Get user's default account or first active account if accountId not provided
    let userAccountId = accountId;
    if (!userAccountId) {
      const defaultAccount = await prisma.account.findFirst({
        where: { userId: session.user.id, isActive: true },
        orderBy: { createdAt: "asc" },
      });
      userAccountId = defaultAccount?.id;
    }

    if (!userAccountId) {
      return NextResponse.json({ error: "No account found" }, { status: 400 });
    }

    const account = await prisma.account.findUnique({
      where: { id: userAccountId },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 400 });
    }

    // Calculate amount in account currency
    const expenseCurrency = currency || "USD";
    const amountInAccountCurrency = convertCurrency(
      Number(amount), 
      expenseCurrency, 
      account.currency
    );

    // Create transaction and update balance atomically
    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: session.user.id,
          accountId: userAccountId,
          amount: -Math.abs(amountInAccountCurrency),
          currency: expenseCurrency,
          category: category || "Other",
          description: note || `Trip expense: ${trip.name}`,
          date: parsedDate,
          isTripRelated: true,
          tripId: tripId,
          location: location || trip.destination,
        },
        include: {
          user: true,
          account: true,
          trip: true,
        },
      }),
      prisma.account.update({
        where: { id: userAccountId },
        data: {
          balance: {
            decrement: Math.abs(amountInAccountCurrency)
          }
        },
      }),
    ]);

    // Return in a format compatible with old expense response
    return NextResponse.json({
      id: transaction.id,
      tripId: transaction.tripId,
      userId: transaction.userId,
      amount: Math.abs(transaction.amount),
      category: transaction.category,
      currency: transaction.currency,
      date: transaction.date,
      note: transaction.description,
      location: transaction.location,
      user: transaction.user,
      isTransaction: true,
    });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
