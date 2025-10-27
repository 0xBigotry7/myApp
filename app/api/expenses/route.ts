import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { tripId, amount, category, currency, date, endDate, note, accountId } = body;

    // Verify the trip belongs to the user or they are a member
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
      },
      include: {
        members: true,
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Create expense and transaction together in a transaction
    const expense = await prisma.expense.create({
      data: {
        tripId,
        userId: session.user.id,
        amount,
        category,
        currency,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        note: note || null,
      },
      include: {
        user: true,
      },
    });

    // Create corresponding transaction if account exists
    if (userAccountId) {
      const account = await prisma.account.findUnique({
        where: { id: userAccountId },
      });

      if (account) {
        // Create transaction (negative amount for expense)
        await prisma.transaction.create({
          data: {
            userId: session.user.id,
            accountId: userAccountId,
            amount: -Math.abs(amount), // Always negative for expenses
            category: category || "Travel",
            description: note || `Trip expense: ${trip.name}`,
            date: new Date(date),
            isTripRelated: true,
            tripId: tripId,
            location: trip.destination,
          },
        });

        // Update account balance
        await prisma.account.update({
          where: { id: userAccountId },
          data: { balance: account.balance - Math.abs(amount) },
        });
      }
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
