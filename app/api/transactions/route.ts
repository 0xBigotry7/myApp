import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET all transactions for current user
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = searchParams.get("limit");
    const tripId = searchParams.get("tripId");
    const includeTripRelated = searchParams.get("includeTripRelated");

    const where: any = {
      userId: session.user.id,
    };

    if (accountId) {
      where.accountId = accountId;
    }

    if (category) {
      where.category = category;
    }

    if (tripId) {
      where.tripId = tripId;
    }

    // Filter by trip-related status if specified
    if (includeTripRelated === "false") {
      where.isTripRelated = false;
    } else if (includeTripRelated === "only") {
      where.isTripRelated = true;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            icon: true,
            color: true,
            currency: true,
          },
        },
        trip: {
          select: {
            id: true,
            name: true,
            destination: true,
          },
        },
      },
      orderBy: { date: "desc" },
      take: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// POST - Create new transaction (unified for both general and trip expenses)
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      accountId,
      amount,
      category,
      merchantName,
      description,
      date,
      tags,
      tripId,
      isRecurring,
      recurringTransactionId,
      receiptUrl,
      location,
      latitude,
      longitude,
      currency,
      // Transportation fields
      transportationMethod,
      fromLocation,
      toLocation,
      transportationDistance,
      transportationDuration,
      ticketReference,
      numberOfPassengers,
      // Accommodation fields
      accommodationName,
      accommodationType,
      checkInDate,
      checkOutDate,
      numberOfNights,
      googlePlaceId,
      hotelAddress,
      hotelPhone,
      hotelWebsite,
      hotelRating,
      hotelPhotos,
      confirmationNumber,
      // Food & Dining fields
      partySize,
      mealType,
      cuisineType,
      restaurantName,
      hasReservation,
      // Activities fields
      activityType,
      activityName,
      activityDuration,
      numberOfTickets,
      activityReference,
      hasGuide,
      // Shopping fields
      storeName,
      shoppingCategory,
      numberOfItems,
      hasReturnPolicy,
      isGift,
      giftRecipient,
      // Other fields
      otherSubcategory,
      expenseRating,
    } = body;

    // Validate required fields
    if (!accountId || amount === undefined || !category || !date) {
      return NextResponse.json(
        { error: "Account, amount, category, and date are required" },
        { status: 400 }
      );
    }

    // Verify account belongs to user
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: session.user.id,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Account not found or unauthorized" },
        { status: 404 }
      );
    }

    // If tripId is provided, verify user has access to the trip
    if (tripId) {
      const trip = await prisma.trip.findFirst({
        where: {
          id: tripId,
          OR: [
            { ownerId: session.user.id },
            { members: { some: { userId: session.user.id } } }
          ]
        },
      });

      if (!trip) {
        return NextResponse.json(
          { error: "Trip not found or unauthorized" },
          { status: 404 }
        );
      }
    }

    // Parse dates
    const parsedDate = new Date(date);
    const parsedCheckInDate = checkInDate ? new Date(checkInDate) : null;
    const parsedCheckOutDate = checkOutDate ? new Date(checkOutDate) : null;

    // Create transaction with all fields
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        accountId,
        amount,
        category,
        merchantName,
        description,
        date: parsedDate,
        tags: tags || [],
        isTripRelated: !!tripId,
        tripId: tripId || null,
        isRecurring: isRecurring || false,
        recurringTransactionId,
        receiptUrl,
        location,
        latitude,
        longitude,
        currency: currency || null,
        // Transportation fields
        transportationMethod: transportationMethod || null,
        fromLocation: fromLocation || null,
        toLocation: toLocation || null,
        transportationDistance: transportationDistance ?? null,
        transportationDuration: transportationDuration ?? null,
        ticketReference: ticketReference || null,
        numberOfPassengers: numberOfPassengers ?? null,
        // Accommodation fields
        accommodationName: accommodationName || null,
        accommodationType: accommodationType || null,
        checkInDate: parsedCheckInDate,
        checkOutDate: parsedCheckOutDate,
        numberOfNights: numberOfNights ?? null,
        googlePlaceId: googlePlaceId || null,
        hotelAddress: hotelAddress || null,
        hotelPhone: hotelPhone || null,
        hotelWebsite: hotelWebsite || null,
        hotelRating: hotelRating ?? null,
        hotelPhotos: hotelPhotos || [],
        confirmationNumber: confirmationNumber || null,
        // Food & Dining fields
        partySize: partySize ?? null,
        mealType: mealType || null,
        cuisineType: cuisineType || null,
        restaurantName: restaurantName || null,
        hasReservation: hasReservation ?? null,
        // Activities fields
        activityType: activityType || null,
        activityName: activityName || null,
        activityDuration: activityDuration ?? null,
        numberOfTickets: numberOfTickets ?? null,
        activityReference: activityReference || null,
        hasGuide: hasGuide ?? null,
        // Shopping fields
        storeName: storeName || null,
        shoppingCategory: shoppingCategory || null,
        numberOfItems: numberOfItems ?? null,
        hasReturnPolicy: hasReturnPolicy ?? null,
        isGift: isGift ?? null,
        giftRecipient: giftRecipient || null,
        // Other fields
        otherSubcategory: otherSubcategory || null,
        expenseRating: expenseRating ?? null,
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            icon: true,
            color: true,
            currency: true,
          },
        },
        trip: {
          select: {
            id: true,
            name: true,
            destination: true,
          },
        },
      },
    });

    // Update account balance
    const newBalance = account.balance + amount;
    await prisma.account.update({
      where: { id: accountId },
      data: { balance: newBalance },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
