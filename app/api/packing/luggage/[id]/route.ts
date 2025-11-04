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
    const luggage = await prisma.luggage.findUnique({
      where: { id },
    });

    if (!luggage || luggage.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const { name, type, color, maxWeight, description, isActive } = body;

    // Check ownership
    const luggage = await prisma.luggage.findUnique({
      where: { id },
    });

    if (!luggage || luggage.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update luggage
    const updatedLuggage = await prisma.luggage.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        type: type !== undefined ? type : undefined,
        color: color !== undefined ? color : undefined,
        maxWeight: maxWeight !== undefined ? (maxWeight ? parseFloat(maxWeight) : null) : undefined,
        description: description !== undefined ? (description || null) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    return NextResponse.json(updatedLuggage);
  } catch (error) {
    console.error("Error updating luggage:", error);
    return NextResponse.json(
      { error: "Failed to update luggage" },
      { status: 500 }
    );
  }
}
