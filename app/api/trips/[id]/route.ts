import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET single trip
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
    const trip = await prisma.trip.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
      },
      include: {
        budgetCategories: true,
        members: {
          include: { user: true }
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json(trip);
  } catch (error) {
    console.error("Error fetching trip:", error);
    return NextResponse.json(
      { error: "Failed to fetch trip" },
      { status: 500 }
    );
  }
}

// PATCH - Update trip
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
    // Check if user has access to the trip
    const existingTrip = await prisma.trip.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
      },
    });

    if (!existingTrip) {
      return NextResponse.json({ error: "Trip not found or unauthorized" }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
      destination,
      startDate,
      endDate,
      totalBudget,
      currency,
      description,
      budgetCategories,
    } = body;

    // Build update data
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (destination !== undefined) updateData.destination = destination;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (totalBudget !== undefined) updateData.totalBudget = totalBudget;
    if (currency !== undefined) updateData.currency = currency;
    if (description !== undefined) updateData.description = description;

    // Update trip
    const trip = await prisma.trip.update({
      where: { id },
      data: updateData,
      include: {
        budgetCategories: true,
        members: {
          include: { user: true }
        },
      },
    });

    // Update budget categories if provided
    if (budgetCategories && Array.isArray(budgetCategories)) {
      // Delete existing categories and recreate
      await prisma.budgetCategory.deleteMany({
        where: { tripId: id },
      });
      
      await prisma.budgetCategory.createMany({
        data: budgetCategories.map((bc: any) => ({
          tripId: id,
          category: bc.category,
          budgetAmount: bc.budgetAmount,
        })),
      });

      // Refetch with updated categories
      const updatedTrip = await prisma.trip.findUnique({
        where: { id },
        include: {
          budgetCategories: true,
          members: {
            include: { user: true }
          },
        },
      });

      return NextResponse.json(updatedTrip);
    }

    return NextResponse.json(trip);
  } catch (error) {
    console.error("Error updating trip:", error);
    return NextResponse.json(
      { error: "Failed to update trip" },
      { status: 500 }
    );
  }
}

// DELETE - Delete trip
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
    // Only owner can delete
    const trip = await prisma.trip.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found or unauthorized" }, { status: 404 });
    }

    await prisma.trip.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting trip:", error);
    return NextResponse.json(
      { error: "Failed to delete trip" },
      { status: 500 }
    );
  }
}

