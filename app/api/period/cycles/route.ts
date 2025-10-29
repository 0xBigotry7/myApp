import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");

    const cycles = await prisma.periodCycle.findMany({
      where: { userId: session.user.id },
      include: {
        dailyLogs: {
          orderBy: { date: "asc" },
        },
      },
      orderBy: { startDate: "desc" },
      ...(limit && { take: parseInt(limit) }),
    });

    return NextResponse.json(cycles);
  } catch (error) {
    console.error("Error fetching cycles:", error);
    return NextResponse.json(
      { error: "Failed to fetch cycles" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { startDate, endDate, flowIntensity, notes } = body;

    // Get the last cycle to check if we should mark it as complete
    const lastCycle = await prisma.periodCycle.findFirst({
      where: { userId: session.user.id, isComplete: false },
      orderBy: { startDate: "desc" },
    });

    // Calculate predictions based on historical data
    const historicalCycles = await prisma.periodCycle.findMany({
      where: { userId: session.user.id, isComplete: true },
      orderBy: { startDate: "desc" },
      take: 6,
    });

    let predictions = {};
    if (historicalCycles.length > 0) {
      const avgCycleLength =
        historicalCycles.reduce((sum, c) => sum + (c.cycleLength || 28), 0) /
        historicalCycles.length;
      const avgPeriodLength =
        historicalCycles.reduce((sum, c) => sum + (c.periodLength || 5), 0) /
        historicalCycles.length;

      const startDateObj = new Date(startDate);
      const predictedNextStart = new Date(startDateObj);
      predictedNextStart.setDate(
        startDateObj.getDate() + Math.round(avgCycleLength)
      );

      const predictedEndDateObj = new Date(startDateObj);
      predictedEndDateObj.setDate(
        startDateObj.getDate() + Math.round(avgPeriodLength)
      );

      // Ovulation typically occurs 14 days before next period
      const ovulationDate = new Date(predictedNextStart);
      ovulationDate.setDate(ovulationDate.getDate() - 14);

      // Fertile window is typically 5 days before ovulation + ovulation day
      const fertileStart = new Date(ovulationDate);
      fertileStart.setDate(fertileStart.getDate() - 5);

      predictions = {
        predictedStartDate: predictedNextStart,
        predictedEndDate: endDate || predictedEndDateObj,
        ovulationDate,
        fertileWindowStart: fertileStart,
        fertileWindowEnd: ovulationDate,
      };
    }

    // If there's an incomplete cycle, mark it as complete and calculate its cycle length
    if (lastCycle) {
      const cycleLength = Math.ceil(
        (new Date(startDate).getTime() - new Date(lastCycle.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      await prisma.periodCycle.update({
        where: { id: lastCycle.id },
        data: {
          isComplete: true,
          cycleLength,
        },
      });
    }

    // Create new cycle
    const cycle = await prisma.periodCycle.create({
      data: {
        userId: session.user.id,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        flowIntensity,
        notes,
        isComplete: false,
        ...predictions,
      },
    });

    return NextResponse.json(cycle);
  } catch (error) {
    console.error("Error creating cycle:", error);
    return NextResponse.json(
      { error: "Failed to create cycle" },
      { status: 500 }
    );
  }
}
