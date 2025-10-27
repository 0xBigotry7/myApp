import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { imageUrl, type } = await req.json();

    // Determine which field to update based on type
    const updateData: Record<string, string> = {};

    switch (type) {
      case "budget":
        updateData.budgetImageUrl = imageUrl;
        break;
      case "itinerary":
        updateData.itineraryImageUrl = imageUrl;
        break;
      case "expenses":
        updateData.expensesImageUrl = imageUrl;
        break;
      default:
        updateData.destinationImageUrl = imageUrl;
    }

    // Verify access first
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
      return NextResponse.json(
        { error: "Trip not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update trip with image URL
    const trip = await prisma.trip.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, trip });
  } catch (error) {
    console.error("Error updating trip image:", error);
    return NextResponse.json(
      { error: "Failed to update trip image" },
      { status: 500 }
    );
  }
}
