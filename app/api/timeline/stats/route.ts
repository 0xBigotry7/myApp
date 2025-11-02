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

    // Fetch counts in parallel
    const [
      tripPostsCount,
      expensesCount,
      transactionsCount,
      healthLogsCount,
      lifeEventsCount,
      uniqueCountries,
      totalPhotos,
      totalSpent,
    ] = await Promise.all([
      prisma.tripPost.count({ where: { userId } }),
      prisma.expense.count({ where: { userId } }),
      prisma.transaction.count({ where: { userId, amount: { gte: 100 } } }),
      prisma.dailyLog.count({ where: { userId } }),
      prisma.lifeEvent.count({ where: { userId } }),
      prisma.travelDestination.findMany({
        where: { userId },
        select: { countryCode: true },
        distinct: ["countryCode"],
      }),
      prisma.tripPost.aggregate({
        where: { userId },
        _sum: { photos: true },
      }),
      prisma.expense.aggregate({
        where: { userId, currency: "USD" },
        _sum: { amount: true },
      }),
    ]);

    const totalMemories =
      tripPostsCount + expensesCount + transactionsCount + healthLogsCount + lifeEventsCount;

    // Calculate photo count
    const photoCount = await prisma.tripPost.findMany({
      where: { userId },
      select: { photos: true },
    });
    const totalPhotoCount = photoCount.reduce((sum, post) => sum + post.photos.length, 0);

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
        finance: transactionsCount,
        health: healthLogsCount,
        lifeEvents: lifeEventsCount,
      },
      countriesVisited: uniqueCountries.length,
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
