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
    const { endDate, flowIntensity, notes } = body;

    // Verify cycle belongs to user
    const cycle = await prisma.periodCycle.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!cycle) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    // Calculate period length if ending period
    let periodLength = cycle.periodLength;
    if (endDate && cycle.startDate) {
      periodLength = Math.ceil(
        (new Date(endDate).getTime() - new Date(cycle.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1; // +1 to include both start and end days
    }

    const updatedCycle = await prisma.periodCycle.update({
      where: { id },
      data: {
        ...(endDate && { endDate: new Date(endDate) }),
        ...(periodLength && { periodLength }),
        ...(flowIntensity && { flowIntensity }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(updatedCycle);
  } catch (error) {
    console.error("Error updating cycle:", error);
    return NextResponse.json(
      { error: "Failed to update cycle" },
      { status: 500 }
    );
  }
}

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
    // Verify cycle belongs to user
    const cycle = await prisma.periodCycle.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!cycle) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    await prisma.periodCycle.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cycle:", error);
    return NextResponse.json(
      { error: "Failed to delete cycle" },
      { status: 500 }
    );
  }
}
