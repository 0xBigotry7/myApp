import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sourceFilter = searchParams.get("source"); // "travel", "finance", "health", "life"
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const search = searchParams.get("search");
    const showPrivate = searchParams.get("showPrivate") !== "false";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const userId = session.user.id;

    // Build date filter
    const dateFilter: any = {};
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom);
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo);
    }

    // Get all trips user has access to (owned or member of)
    const userTrips = await prisma.trip.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      select: { id: true },
    });
    const tripIds = userTrips.map((t) => t.id);

    // Fetch data from all sources in parallel
    const sources = sourceFilter ? [sourceFilter] : ["travel", "finance", "health", "life"];

    const results = await Promise.all([
      // Travel Posts (if travel included) - from all household trips
      sources.includes("travel") && tripIds.length > 0
        ? prisma.tripPost.findMany({
            where: {
              tripId: { in: tripIds },
              timestamp: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
            },
            include: {
              user: { select: { id: true, name: true, email: true } },
              trip: { select: { id: true, name: true, destination: true } },
            },
            orderBy: { timestamp: "desc" },
          })
        : Promise.resolve([]),

      // Expenses (if travel included) - from all household trips
      sources.includes("travel") && tripIds.length > 0
        ? prisma.expense.findMany({
            where: {
              tripId: { in: tripIds },
              date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
            },
            include: {
              user: { select: { id: true, name: true } },
              trip: { select: { id: true, name: true, destination: true } },
            },
            orderBy: { date: "desc" },
          })
        : Promise.resolve([]),

      // Transactions (if finance included)
      sources.includes("finance")
        ? prisma.transaction.findMany({
            where: {
              userId,
              date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
              amount: { gte: 100 }, // Only show significant transactions
            },
            include: {
              user: { select: { id: true, name: true, email: true } },
              account: { select: { name: true, type: true } },
            },
            orderBy: { date: "desc" },
            take: 100,
          })
        : Promise.resolve([]),

      // Health Logs (if health included)
      sources.includes("health")
        ? prisma.dailyLog.findMany({
            where: {
              userId,
              date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
              OR: [
                { notes: { not: null } },
                { symptoms: { isEmpty: false } },
              ],
            },
            include: {
              user: { select: { id: true, name: true, email: true } },
              cycle: true,
            },
            orderBy: { date: "desc" },
            take: 100,
          })
        : Promise.resolve([]),

      // Life Events (if life included)
      sources.includes("life")
        ? prisma.lifeEvent.findMany({
            where: {
              userId,
              date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
              isPrivate: showPrivate ? undefined : false,
            },
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { date: "desc" },
          })
        : Promise.resolve([]),
    ]);

    const [tripPosts, expenses, transactions, healthLogs, lifeEvents] = results;

    // Transform to unified timeline format
    const timelineItems: any[] = [
      ...tripPosts.map((post) => ({
        id: `post-${post.id}`,
        originalId: post.id,
        source: "trip_post",
        type: post.type,
        date: post.timestamp,
        title: post.content || "Travel moment",
        content: post.content,
        photos: post.photos,
        location: post.location,
        metadata: {
          tripId: post.tripId,
          tripName: post.trip?.name,
          tripDestination: post.trip?.destination,
        },
        user: post.user,
        isEditable: true,
      })),

      ...expenses.map((expense) => ({
        id: `expense-${expense.id}`,
        originalId: expense.id,
        source: "expense",
        type: expense.category,
        date: expense.date,
        title: `${expense.category}: $${expense.amount}`,
        content: expense.note,
        photos: expense.receiptUrl ? [expense.receiptUrl] : [],
        location: expense.location,
        metadata: {
          amount: expense.amount,
          currency: expense.currency,
          category: expense.category,
          tripId: expense.tripId,
          tripName: expense.trip?.name,
          transportationMethod: expense.transportationMethod,
          fromLocation: expense.fromLocation,
          toLocation: expense.toLocation,
        },
        user: expense.user,
        isEditable: false,
      })),

      ...transactions.map((tx) => ({
        id: `transaction-${tx.id}`,
        originalId: tx.id,
        source: "transaction",
        type: tx.category,
        date: tx.date,
        title: tx.merchantName || tx.description || "Transaction",
        content: tx.description,
        photos: tx.receiptUrl ? [tx.receiptUrl] : [],
        location: tx.location,
        metadata: {
          amount: tx.amount,
          category: tx.category,
          merchantName: tx.merchantName,
          accountName: tx.account.name,
        },
        user: tx.user,
        isEditable: false,
      })),

      ...healthLogs.map((log) => ({
        id: `health-${log.id}`,
        originalId: log.id,
        source: "health",
        type: "daily_log",
        date: log.date,
        title: log.notes || `Health log - ${log.flowIntensity || "Daily entry"}`,
        content: log.notes,
        photos: [],
        location: null,
        metadata: {
          flowIntensity: log.flowIntensity,
          symptoms: log.symptoms,
          mood: log.mood,
          energyLevel: log.energyLevel,
          cycleId: log.cycleId,
        },
        user: log.user,
        isEditable: false,
      })),

      ...lifeEvents.map((event) => ({
        id: `life-${event.id}`,
        originalId: event.id,
        source: "life_event",
        type: event.type,
        date: event.date,
        title: event.title,
        content: event.content,
        photos: event.photos,
        location: event.location,
        metadata: {
          tags: event.tags,
          mood: event.mood,
          isPrivate: event.isPrivate,
        },
        user: event.user,
        isEditable: true,
      })),
    ];

    // Sort by date descending
    timelineItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply search filter
    let filteredItems = timelineItems;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = timelineItems.filter(
        (item) =>
          item.title?.toLowerCase().includes(searchLower) ||
          item.content?.toLowerCase().includes(searchLower) ||
          item.location?.toLowerCase().includes(searchLower) ||
          item.metadata?.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply pagination
    const paginatedItems = filteredItems.slice(offset, offset + limit);

    return NextResponse.json({
      items: paginatedItems,
      total: filteredItems.length,
      hasMore: filteredItems.length > offset + limit,
    });
  } catch (error) {
    console.error("Error fetching timeline:", error);
    return NextResponse.json(
      { error: "Failed to fetch timeline" },
      { status: 500 }
    );
  }
}
