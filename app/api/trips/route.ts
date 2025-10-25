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
    const {
      name,
      destination,
      startDate,
      endDate,
      totalBudget,
      currency,
      budgetCategories,
    } = body;

    // Get all users to automatically add them as members
    const allUsers = await prisma.user.findMany({ select: { id: true } });

    const trip = await prisma.trip.create({
      data: {
        name,
        destination,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalBudget,
        currency,
        ownerId: session.user.id,
        budgetCategories: {
          create: budgetCategories,
        },
        // Automatically add all users as members (shared trips for couples)
        members: {
          create: allUsers.map(user => ({
            userId: user.id,
            role: user.id === session.user.id ? "owner" : "member"
          }))
        }
      },
      include: {
        budgetCategories: true,
        members: true,
      },
    });

    return NextResponse.json(trip);
  } catch (error) {
    console.error("Error creating trip:", error);
    return NextResponse.json(
      { error: "Failed to create trip" },
      { status: 500 }
    );
  }
}
