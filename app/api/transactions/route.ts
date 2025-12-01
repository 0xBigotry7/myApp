import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { convertCurrency } from "@/lib/currency";

// GET all transactions for current user with pagination support
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
    const limitParam = searchParams.get("limit");
    const cursor = searchParams.get("cursor"); // For cursor-based pagination
    const tripId = searchParams.get("tripId");
    const includeTripRelated = searchParams.get("includeTripRelated");
    const paginated = searchParams.get("paginated"); // New: opt-in to paginated response

    // Default limit (unlimited for legacy, 20 for paginated)
    const limit = limitParam 
      ? Math.min(parseInt(limitParam), 100) 
      : (paginated === "true" ? 20 : undefined);

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

    // For paginated requests, fetch one extra to check if there are more
    const take = paginated === "true" && limit ? limit + 1 : limit;

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
      take,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor itself
      }),
    });

    // For paginated requests, return paginated response
    if (paginated === "true" && limit) {
      const hasMore = transactions.length > limit;
      const data = hasMore ? transactions.slice(0, -1) : transactions;
      const nextCursor = hasMore && data.length > 0 ? data[data.length - 1].id : null;

      return NextResponse.json({
        transactions: data,
        nextCursor,
        hasMore,
      });
    }

    // Legacy format: return array directly for backward compatibility
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

    // Determine transaction currency (use provided currency, or infer from trip destination, or default to account currency)
    let transactionCurrency = currency || account.currency || "USD";
    
    // If transaction is trip-related and no currency specified, try to infer from trip destination
    if (!currency && tripId) {
      const trip = await prisma.trip.findFirst({
        where: {
          id: tripId,
          OR: [
            { ownerId: session.user.id },
            { members: { some: { userId: session.user.id } } }
          ]
        },
        select: { destination: true },
      });
      
      if (trip?.destination) {
        const dest = trip.destination.toLowerCase();
        if (dest.includes('thailand') || dest.includes('phuket') || dest.includes('bangkok')) {
          transactionCurrency = 'THB';
        } else if (dest.includes('japan') || dest.includes('tokyo') || dest.includes('osaka')) {
          transactionCurrency = 'JPY';
        } else if (dest.includes('china') || dest.includes('beijing') || dest.includes('shanghai')) {
          transactionCurrency = 'CNY';
        } else if (dest.includes('korea') || dest.includes('seoul')) {
          transactionCurrency = 'KRW';
        } else if (dest.includes('uk') || dest.includes('london') || dest.includes('england')) {
          transactionCurrency = 'GBP';
        } else if (dest.includes('europe') || dest.includes('paris') || dest.includes('berlin') || dest.includes('rome')) {
          transactionCurrency = 'EUR';
        } else if (dest.includes('singapore')) {
          transactionCurrency = 'SGD';
        } else if (dest.includes('australia') || dest.includes('sydney')) {
          transactionCurrency = 'AUD';
        } else if (dest.includes('canada') || dest.includes('toronto')) {
          transactionCurrency = 'CAD';
        }
      }
    }

    // Convert transaction amount to account currency for balance update only
    const amountInAccountCurrency = convertCurrency(
      amount,
      transactionCurrency,
      account.currency
    );

    // Create transaction and update balance atomically
    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: session.user.id,
          accountId,
          amount: amount, // Store original amount in transaction currency
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
          currency: transactionCurrency, // Store original transaction currency
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
      }),
      // Update account balance with converted amount
      prisma.account.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: amountInAccountCurrency
          }
        },
      }),
    ]);

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
