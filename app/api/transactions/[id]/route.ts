import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET single transaction
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            icon: true,
            color: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction" },
      { status: 500 }
    );
  }
}

// PATCH - Update transaction
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      accountId,
      amount,
      category,
      merchantName,
      description,
      date,
      tags,
      isTripRelated,
      tripId,
      isRecurring,
      receiptUrl,
      location,
      latitude,
      longitude,
    } = body;

    // Get existing transaction
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: { account: true },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // If account is changing, verify new account belongs to user
    if (accountId && accountId !== existingTransaction.accountId) {
      const newAccount = await prisma.account.findFirst({
        where: {
          id: accountId,
          userId: session.user.id,
        },
      });

      if (!newAccount) {
        return NextResponse.json(
          { error: "New account not found or unauthorized" },
          { status: 404 }
        );
      }

      // Revert old account balance and update new account balance
      await prisma.account.update({
        where: { id: existingTransaction.accountId },
        data: { balance: existingTransaction.account.balance - existingTransaction.amount },
      });

      await prisma.account.update({
        where: { id: accountId },
        data: { balance: newAccount.balance + (amount || existingTransaction.amount) },
      });
    } else if (amount !== undefined && amount !== existingTransaction.amount) {
      // Amount changed but same account - update balance
      const balanceDiff = amount - existingTransaction.amount;
      await prisma.account.update({
        where: { id: existingTransaction.accountId },
        data: { balance: existingTransaction.account.balance + balanceDiff },
      });
    }

    // Update transaction
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...(accountId !== undefined && { accountId }),
        ...(amount !== undefined && { amount }),
        ...(category !== undefined && { category }),
        ...(merchantName !== undefined && { merchantName }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(tags !== undefined && { tags }),
        ...(isTripRelated !== undefined && { isTripRelated }),
        ...(tripId !== undefined && { tripId }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(receiptUrl !== undefined && { receiptUrl }),
        ...(location !== undefined && { location }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            icon: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

// DELETE transaction
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get transaction to revert account balance
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: { account: true },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Revert account balance
    await prisma.account.update({
      where: { id: transaction.accountId },
      data: { balance: transaction.account.balance - transaction.amount },
    });

    // Delete transaction
    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
