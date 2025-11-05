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
    // Check if luggage exists (no ownership check for household sharing)
    const luggage = await prisma.luggage.findUnique({
      where: { id },
    });

    if (!luggage) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Delete luggage (items will be cascade deleted)
    await prisma.luggage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting luggage:", error);
    return NextResponse.json(
      { error: "Failed to delete luggage" },
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
    const { name, type, color, maxWeight, description, airtagName, isActive } = body;

    // Check if luggage exists (no ownership check for household sharing)
    const luggage = await prisma.luggage.findUnique({
      where: { id },
    });

    if (!luggage) {
      return NextResponse.json({ error: "Not found", details: "Luggage not found" }, { status: 404 });
    }

    // Build update data object, only including defined fields
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (color !== undefined) updateData.color = color;
    if (maxWeight !== undefined) updateData.maxWeight = maxWeight ? parseFloat(maxWeight) : null;
    if (description !== undefined) updateData.description = description || null;
    if (airtagName !== undefined) updateData.airtagName = airtagName || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update luggage
    const updatedLuggage = await prisma.luggage.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedLuggage);
  } catch (error) {
    console.error("Error updating luggage:", error);
    return NextResponse.json(
      { error: "Failed to update luggage", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
