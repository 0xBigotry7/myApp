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
    const { tripId, amount, category, currency, date, note, accountId, location, receiptUrl, transportationMethod, fromLocation, toLocation } = body;

    // Parse date correctly - if it's just a date string (YYYY-MM-DD), treat it as local timezone at noon
    let parsedDate: Date;
    if (date && typeof date === 'string') {
      if (date.includes('T') || date.includes('Z')) {
        // Already has time info, use as-is
        parsedDate = new Date(date);
      } else {
        // Just a date string - parse as local date at noon to avoid timezone issues
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
        date: parsedDate,
        note: note || null,
        location: location || null,
        receiptUrl: receiptUrl || null,
        transportationMethod: transportationMethod || null,
        fromLocation: fromLocation || null,
        toLocation: toLocation || null,
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
        // Create transaction and update balance atomically
        await prisma.$transaction([
          // Create transaction (negative amount for expense)
          prisma.transaction.create({
            data: {
              userId: session.user.id,
              accountId: userAccountId,
              amount: -Math.abs(amount), // Always negative for expenses
              category: category || "Travel",
              description: note || `Trip expense: ${trip.name}`,
              date: parsedDate,
              isTripRelated: true,
              tripId: tripId,
              location: trip.destination,
            },
          }),
          // Update account balance using decrement
          prisma.account.update({
            where: { id: userAccountId },
            data: {
              balance: {
                decrement: Math.abs(amount)
              }
            },
          }),
        ]);
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
