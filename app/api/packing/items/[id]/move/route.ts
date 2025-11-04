import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { luggageId } = body; // Can be null for unorganized

    // Verify item belongs to user
    const item = await prisma.packingItem.findUnique({
      where: { id },
    });

    if (!item || item.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If moving to luggage, verify luggage belongs to user or is shared
    if (luggageId) {
      const luggage = await prisma.luggage.findUnique({
        where: { id: luggageId },
      });

      if (!luggage || (luggage.userId !== session.user.id && !luggage.isShared)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Update item's luggageId
    const updatedItem = await prisma.packingItem.update({
      where: { id },
      data: {
        luggageId: luggageId || null,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error moving item:", error);
    return NextResponse.json(
      { error: "Failed to move item" },
      { status: 500 }
    );
  }
}
