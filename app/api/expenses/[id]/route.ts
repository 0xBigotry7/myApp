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
      expense.trip.members.some((m) => m.userId === session.user.id) ||
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
    const { amount, category, subcategory, currency, date, note, location } = body;

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
      expense.trip.members.some((m) => m.userId === session.user.id) ||
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
        subcategory: subcategory || null,
        currency,
        date: date ? new Date(date) : undefined,
        note: note || null,
        location: location || null,
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
