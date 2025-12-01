import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// This route now works with transactions instead of expenses (Expense table deprecated)
// It's kept for backwards compatibility with old expense IDs that are now transaction IDs

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
    // Get the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        trip: {
          include: {
            members: true,
          },
        },
        account: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Check if user has access
    const hasAccess =
      transaction.userId === session.user.id ||
      (transaction.trip && (
        transaction.trip.ownerId === session.user.id ||
        transaction.trip.members.some((m: { userId: string }) => m.userId === session.user.id)
      ));

    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete transaction and restore balance atomically
    await prisma.$transaction([
      prisma.transaction.delete({
        where: { id },
      }),
      // Restore balance (add back what was subtracted)
      prisma.account.update({
        where: { id: transaction.accountId },
        data: {
          balance: {
            increment: Math.abs(transaction.amount), // Add back the expense amount
          },
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense/transaction:", error);
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
    const { amount, category, currency, date, note, location } = body;

    // Parse date correctly
    let parsedDate: Date | undefined;
    if (date && typeof date === 'string') {
      if (date.includes('T') || date.includes('Z')) {
        parsedDate = new Date(date);
      } else if (date.includes(' ') && date.includes(':')) {
        const [datePart, timePart] = date.split(' ');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes] = timePart.split(':').map(Number);
        parsedDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
      } else {
        const [year, month, day] = date.split('-').map(Number);
        parsedDate = new Date(year, month - 1, day, 12, 0, 0, 0);
      }
    }

    // Get the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        trip: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Check if user has access
    const hasAccess =
      transaction.userId === session.user.id ||
      (transaction.trip && (
        transaction.trip.ownerId === session.user.id ||
        transaction.trip.members.some((m: { userId: string }) => m.userId === session.user.id)
      ));

    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update the transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        amount: amount !== undefined ? -Math.abs(parseFloat(amount)) : undefined,
        category: category || undefined,
        currency: currency || undefined,
        date: parsedDate,
        description: note !== undefined ? (note || null) : undefined,
        location: location !== undefined ? (location || null) : undefined,
      },
      include: {
        user: true,
      },
    });

    // Return in expense-compatible format
    return NextResponse.json({
      id: updatedTransaction.id,
      tripId: updatedTransaction.tripId,
      userId: updatedTransaction.userId,
      amount: Math.abs(updatedTransaction.amount),
      category: updatedTransaction.category,
      currency: updatedTransaction.currency,
      date: updatedTransaction.date,
      note: updatedTransaction.description,
      location: updatedTransaction.location,
      user: updatedTransaction.user,
      isTransaction: true,
    });
  } catch (error) {
    console.error("Error updating expense/transaction:", error);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}
