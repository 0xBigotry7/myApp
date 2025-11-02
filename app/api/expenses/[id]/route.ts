import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the expense to check ownership
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        trip: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Check if user has access (is owner of trip OR is a member OR created the expense)
    const hasAccess =
      expense.trip.ownerId === session.user.id ||
      expense.trip.members.some((m: { userId: string }) => m.userId === session.user.id) ||
      expense.userId === session.user.id;

    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the expense
    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { amount, category, currency, date, note, location, receiptUrl, transportationMethod, fromLocation, toLocation } = body;

    // Parse date correctly - handle different formats
    let parsedDate: Date | undefined;
    if (date && typeof date === 'string') {
      if (date.includes('T') || date.includes('Z')) {
        // ISO format: use as-is
        parsedDate = new Date(date);
        console.log('Received ISO date:', date, '→ Parsed as:', parsedDate);
      } else if (date.includes(' ') && date.includes(':')) {
        // Format: "YYYY-MM-DD HH:mm" - parse as local time
        const [datePart, timePart] = date.split(' ');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes] = timePart.split(':').map(Number);
        parsedDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
        console.log('Received date+time:', date, '→ Parsed as:', parsedDate);
      } else {
        // Just a date string - parse as local date at noon to avoid timezone issues
        const [year, month, day] = date.split('-').map(Number);
        parsedDate = new Date(year, month - 1, day, 12, 0, 0, 0);
        console.log('Received date-only:', date, '→ Parsed as:', parsedDate);
      }
    }

    // Get the expense to check ownership
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        trip: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Check if user has access
    const hasAccess =
      expense.trip.ownerId === session.user.id ||
      expense.trip.members.some((m: { userId: string }) => m.userId === session.user.id) ||
      expense.userId === session.user.id;

    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update the expense
    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        amount: amount ? parseFloat(amount) : undefined,
        category,
        currency,
        date: parsedDate,
        note: note !== undefined ? (note || null) : undefined,
        location: location !== undefined ? (location || null) : undefined,
        receiptUrl: receiptUrl !== undefined ? (receiptUrl || null) : undefined,
        transportationMethod: transportationMethod !== undefined ? (transportationMethod || null) : undefined,
        fromLocation: fromLocation !== undefined ? (fromLocation || null) : undefined,
        toLocation: toLocation !== undefined ? (toLocation || null) : undefined,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}
