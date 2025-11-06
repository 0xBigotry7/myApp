import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gameId } = await params;

    const game = await prisma.pokerGame.findUnique({
      where: { id: gameId },
      include: {
        player1: { select: { id: true, name: true } },
        player2: { select: { id: true, name: true } },
        hands: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Check if user is part of this game
    if (game.player1Id !== session.user.id && game.player2Id !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Determine which player is requesting
    const isPlayer1 = game.player1Id === session.user.id;
    const currentHand = game.hands[0] || null;

    // Filter hole cards - only show player's own cards
    let filteredHand = null;
    if (currentHand) {
      const holeCardsRaw = isPlayer1
        ? currentHand.player1Cards
        : currentHand.player2Cards;

      // Parse JSON cards
      const holeCards = typeof holeCardsRaw === 'string'
        ? JSON.parse(holeCardsRaw)
        : holeCardsRaw;

      filteredHand = {
        ...currentHand,
        playerHoleCards: holeCards,
        // Don't send opponent's hole cards
        player1Cards: undefined,
        player2Cards: undefined,
      };
    }

    return NextResponse.json({
      ...game,
      hands: filteredHand ? [filteredHand] : [],
      currentPlayerNumber: isPlayer1 ? 1 : 2,
    });
  } catch (error) {
    console.error("Error fetching game:", error);
    return NextResponse.json(
      { error: "Failed to fetch game" },
      { status: 500 }
    );
  }
}
