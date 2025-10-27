import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH update activity
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify activity ownership through trip
    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        trip: {
          include: {
            members: true,
          }
        }
      },
    });

    const hasAccess = activity && (
      activity.trip.ownerId === session.user.id ||
      activity.trip.members.some(m => m.userId === session.user.id)
    );

    if (!activity || !hasAccess) {
      return NextResponse.json(
        { error: "Activity not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update activity
    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: {
        ...body,
        date: body.date ? new Date(body.date) : undefined,
      },
    });

    return NextResponse.json({ activity: updatedActivity });
  } catch (error) {
    console.error("Error updating activity:", error);
    return NextResponse.json(
      { error: "Failed to update activity" },
      { status: 500 }
    );
  }
}

// DELETE activity
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify activity ownership through trip
    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        trip: {
          include: {
            members: true,
          }
        }
      },
    });

    const hasAccess = activity && (
      activity.trip.ownerId === session.user.id ||
      activity.trip.members.some(m => m.userId === session.user.id)
    );

    if (!activity || !hasAccess) {
      return NextResponse.json(
        { error: "Activity not found or unauthorized" },
        { status: 404 }
      );
    }

    await prisma.activity.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return NextResponse.json(
      { error: "Failed to delete activity" },
      { status: 500 }
    );
  }
}
