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
    const { name, type, color, maxWeight, description, airtagName, order } = body;

    const luggage = await prisma.luggage.create({
      data: {
        userId: session.user.id,
        name,
        type,
        color: color || "gray",
        maxWeight: maxWeight ? parseFloat(maxWeight) : null,
        description: description || null,
        airtagName: airtagName || null,
        order: order || 0,
      },
    });

    return NextResponse.json(luggage);
  } catch (error) {
    console.error("Error creating luggage:", error);
    return NextResponse.json(
      { error: "Failed to create luggage" },
      { status: 500 }
    );
  }
}
