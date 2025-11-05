import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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
    const { itemIds } = body;

    if (!Array.isArray(itemIds)) {
      return NextResponse.json({ error: "Invalid itemIds" }, { status: 400 });
    }

    // Check ownership
    const luggage = await prisma.luggage.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!luggage || luggage.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update the order of each item
    await Promise.all(
      itemIds.map((itemId, index) =>
        prisma.packingItem.update({
          where: { id: itemId },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering items:", error);
    return NextResponse.json(
      { error: "Failed to reorder items" },
      { status: 500 }
    );
  }
}
