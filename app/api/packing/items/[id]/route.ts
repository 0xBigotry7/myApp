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
    // Check if item exists (no ownership check for household sharing)
    const item = await prisma.packingItem.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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
    const { name, category, quantity, weight, isPacked, notes, tags, belongsTo, colorCode, importance } = body;

    // Check if item exists (no ownership check for household sharing)
    const item = await prisma.packingItem.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ error: "Not found", details: "Item not found" }, { status: 404 });
    }

    // Build update data object, only including defined fields
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (weight !== undefined) updateData.weight = weight ? parseFloat(weight) : null;
    if (isPacked !== undefined) updateData.isPacked = isPacked;
    if (notes !== undefined) updateData.notes = notes || null;
    if (tags !== undefined) updateData.tags = tags;
    if (belongsTo !== undefined) updateData.belongsTo = belongsTo;
    if (colorCode !== undefined) updateData.colorCode = colorCode;
    if (importance !== undefined) updateData.importance = importance;
    if (isPacked === true) updateData.lastUsedDate = new Date();

    const updatedItem = await prisma.packingItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating packing item:", error);
    return NextResponse.json(
      { error: "Failed to update item", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
