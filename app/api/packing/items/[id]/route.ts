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
    // Check ownership
    const item = await prisma.packingItem.findUnique({
      where: { id },
      include: { luggage: true },
    });

    if (!item || item.luggage.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.packingItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting packing item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
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
    const { name, category, quantity, weight, isPacked, notes, tags } = body;

    // Check ownership
    const item = await prisma.packingItem.findUnique({
      where: { id },
      include: { luggage: true },
    });

    if (!item || item.luggage.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedItem = await prisma.packingItem.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        category: category !== undefined ? category : undefined,
        quantity: quantity !== undefined ? quantity : undefined,
        weight: weight !== undefined ? (weight ? parseFloat(weight) : null) : undefined,
        isPacked: isPacked !== undefined ? isPacked : undefined,
        notes: notes !== undefined ? (notes || null) : undefined,
        tags: tags !== undefined ? tags : undefined,
        lastUsedDate: isPacked === true ? new Date() : undefined,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating packing item:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}
