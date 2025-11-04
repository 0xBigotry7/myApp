import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { luggageId, category, name, quantity, weight, isPacked, notes, tags } = body;

    // Verify luggage belongs to user
    const luggage = await prisma.luggage.findUnique({
      where: { id: luggageId },
    });

    if (!luggage || luggage.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const item = await prisma.packingItem.create({
      data: {
        luggageId,
        category,
        name,
        quantity: quantity || 1,
        weight: weight ? parseFloat(weight) : null,
        isPacked: isPacked || false,
        notes: notes || null,
        tags: tags || [],
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error creating packing item:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}
