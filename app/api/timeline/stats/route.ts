import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all trips user has access to (owned or member of)
    const userTrips = await prisma.trip.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      select: { id: true, destination: true },
    });
    const tripIds = userTrips.map((t) => t.id);

    // Fetch counts in parallel
    const [
      tripPostsCount,
      expensesCount,
      healthLogsCount,
      lifeEventsCount,
      totalSpent,
    ] = await Promise.all([
      tripIds.length > 0
        ? prisma.tripPost.count({ where: { tripId: { in: tripIds } } })
        : Promise.resolve(0),
      tripIds.length > 0
        ? prisma.expense.count({ where: { tripId: { in: tripIds } } })
        : Promise.resolve(0),
      prisma.dailyLog.count({ where: { userId } }),
      prisma.lifeEvent.count({ where: { userId } }),
      tripIds.length > 0
        ? prisma.expense.aggregate({
            where: { tripId: { in: tripIds } },
            _sum: { amount: true },
          })
        : Promise.resolve({ _sum: { amount: 0 } }),
    ]);

    // Count unique destinations from trips (extract country from destination string)
    const uniqueDestinations = new Set(
      userTrips.map((t) => {
        // Extract country from "City, Country" format
        const parts = t.destination?.split(",") || [];
        return parts.length > 1 ? parts[parts.length - 1].trim() : t.destination;
      }).filter(Boolean)
    );

    const totalMemories = tripPostsCount + expensesCount + healthLogsCount + lifeEventsCount;

    // Calculate photo count from trip posts
    const tripPosts =
      tripIds.length > 0
        ? await prisma.tripPost.findMany({
            where: { tripId: { in: tripIds } },
            select: { photos: true },
          })
        : [];
    const totalPhotoCount = tripPosts.reduce((sum, post) => sum + post.photos.length, 0);

    // Get life event photos count
    const lifeEventPhotos = await prisma.lifeEvent.findMany({
      where: { userId },
      select: { photos: true },
    });
    const lifeEventPhotoCount = lifeEventPhotos.reduce(
      (sum, event) => sum + event.photos.length,
      0
    );

    return NextResponse.json({
      totalMemories,
      breakdown: {
        travel: tripPostsCount + expensesCount,
        finance: 0, // No transaction tracking yet
        health: healthLogsCount,
        lifeEvents: lifeEventsCount,
      },
      countriesVisited: uniqueDestinations.size,
      photosUploaded: totalPhotoCount + lifeEventPhotoCount,
      totalSpent: totalSpent._sum.amount || 0,
    });
  } catch (error) {
    console.error("Error fetching timeline stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
