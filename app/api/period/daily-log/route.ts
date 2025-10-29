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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const date = searchParams.get("date");

    let where: any = { userId: session.user.id };

    if (date) {
      // Fetch specific date
      const dateObj = new Date(date);
      where.date = {
        gte: new Date(dateObj.setHours(0, 0, 0, 0)),
        lte: new Date(dateObj.setHours(23, 59, 59, 999)),
      };
    } else if (startDate && endDate) {
      // Fetch date range
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const logs = await prisma.dailyLog.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching daily logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily logs" },
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
    const {
      date,
      flowIntensity,
      symptoms,
      mood,
      energyLevel,
      sleepQuality,
      sexualActivity,
      notes,
      weight,
      temperature,
      cervicalMucus,
    } = body;

    // Find active cycle for this date
    const activeCycle = await prisma.periodCycle.findFirst({
      where: {
        userId: session.user.id,
        startDate: { lte: new Date(date) },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date(date) } },
        ],
      },
    });

    // Upsert daily log (update if exists, create if not)
    const log = await prisma.dailyLog.upsert({
      where: {
        userId_date: {
          userId: session.user.id,
          date: new Date(date),
        },
      },
      update: {
        flowIntensity,
        symptoms: symptoms || [],
        mood: mood || [],
        energyLevel,
        sleepQuality,
        sexualActivity,
        notes,
        weight,
        temperature,
        cervicalMucus,
        ...(activeCycle && { cycleId: activeCycle.id }),
      },
      create: {
        userId: session.user.id,
        date: new Date(date),
        flowIntensity,
        symptoms: symptoms || [],
        mood: mood || [],
        energyLevel,
        sleepQuality,
        sexualActivity,
        notes,
        weight,
        temperature,
        cervicalMucus,
        ...(activeCycle && { cycleId: activeCycle.id }),
      },
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error("Error creating/updating daily log:", error);
    return NextResponse.json(
      { error: "Failed to save daily log" },
      { status: 500 }
    );
  }
}
