import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateItinerary } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tripId, destination, startDate, endDate, budget, interests, travelStyle, numberOfPeople } = body;

    if (!destination || !startDate || !endDate || !budget) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate itinerary using AI
    const activities = await generateItinerary({
      destination,
      startDate,
      endDate,
      budget,
      interests: interests || [],
      travelStyle: travelStyle || "Balanced",
      numberOfPeople: numberOfPeople || 2,
    });

    // If tripId provided, save activities to database
    if (tripId) {
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
      });

      if (!trip || trip.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Trip not found or unauthorized" },
          { status: 404 }
        );
      }

      // Save activities to database
      const savedActivities = await Promise.all(
        activities.map((activity, index) =>
          prisma.activity.create({
            data: {
              tripId,
              title: activity.title,
              description: activity.description,
              date: new Date(activity.date),
              startTime: activity.startTime,
              endTime: activity.endTime,
              location: activity.location,
              category: activity.category,
              estimatedCost: activity.estimatedCost,
              notes: activity.notes,
              order: index,
              isAiGenerated: true,
            },
          })
        )
      );

      return NextResponse.json({
        success: true,
        activities: savedActivities,
      });
    }

    // Otherwise just return the suggestions
    return NextResponse.json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error("Error generating itinerary:", error);
    return NextResponse.json(
      { error: "Failed to generate itinerary" },
      { status: 500 }
    );
  }
}
