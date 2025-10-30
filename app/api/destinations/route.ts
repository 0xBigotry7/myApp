import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      city,
      country,
      countryCode,
      latitude,
      longitude,
      visitDate,
      isFuture,
      notes,
      rating,
      highlights,
    } = body;

    // Validation
    if (!city || !country || !countryCode || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const destination = await prisma.travelDestination.create({
      data: {
        userId: session.user.id,
        city,
        country,
        countryCode: countryCode.toUpperCase(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        visitDate: visitDate ? new Date(visitDate) : null,
        isFuture: isFuture || false,
        notes,
        rating,
        highlights: highlights || [],
      },
    });

    return NextResponse.json(destination, { status: 201 });
  } catch (error) {
    console.error("Error creating destination:", error);
    return NextResponse.json(
      { error: "Failed to create destination" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const destinations = await prisma.travelDestination.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        visitDate: "desc",
      },
    });

    return NextResponse.json(destinations);
  } catch (error) {
    console.error("Error fetching destinations:", error);
    return NextResponse.json(
      { error: "Failed to fetch destinations" },
      { status: 500 }
    );
  }
}
