import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDeck, shuffleDeck, dealCards } from "@/lib/poker";

export async function POST(
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
      include: { hands: true },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Check if user is part of this game
    if (game.player1Id !== session.user.id && game.player2Id !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Check if there's already an active hand
    const activeHand = game.hands.find(h => !h.completedAt);
    if (activeHand) {
      return NextResponse.json(
        { error: "Hand already in progress" },
        { status: 400 }
      );
    }

    // Create and shuffle deck
    let deck = createDeck();
    deck = shuffleDeck(deck);

    // Deal hole cards
    const { dealt: player1Cards, remaining: afterP1 } = dealCards(deck, 2);
    const { dealt: player2Cards, remaining: afterP2 } = dealCards(afterP1, 2);

    // Determine blinds (in heads-up, button is small blind)
    const dealerPosition = game.dealerButton;
    const smallBlindPlayer = dealerPosition === 0 ? game.player1Id : game.player2Id;
    const bigBlindPlayer = dealerPosition === 0 ? game.player2Id : game.player1Id;

    // Set initial bets (blinds) - handle cases where player doesn't have enough
    const player1InitialBet = Math.min(
      smallBlindPlayer === game.player1Id ? game.smallBlind : game.bigBlind,
      game.player1Chips
    );
    const player2InitialBet = Math.min(
      smallBlindPlayer === game.player2Id ? game.smallBlind : game.bigBlind,
      game.player2Chips
    );

    // Check if either player can't post blinds (game should be over)
    if (game.player1Chips === 0 || game.player2Chips === 0) {
      return NextResponse.json(
        { error: "A player has no chips left" },
        { status: 400 }
      );
    }

    // Rotate dealer button for next hand (alternates between 0 and 1)
    const newDealerButton = dealerPosition === 0 ? 1 : 0;

    // Update game chips
    const updatedGame = await prisma.pokerGame.update({
      where: { id: gameId },
      data: {
        player1Chips: game.player1Chips - player1InitialBet,
        player2Chips: game.player2Chips - player2InitialBet,
        pot: player1InitialBet + player2InitialBet,
        status: "active",
        currentRound: "preflop",
        // In heads-up, button acts first preflop, so set turn to button player
        currentTurn: dealerPosition === 0 ? game.player1Id : game.player2Id,
        // Rotate dealer button for next hand
        dealerButton: newDealerButton,
      },
    });

    // Create new hand
    const handNumber = game.hands.length + 1;
    const newHand = await prisma.pokerHand.create({
      data: {
        gameId: game.id,
        handNumber,
        dealerPosition,
        player1Cards: JSON.stringify(player1Cards),
        player2Cards: JSON.stringify(player2Cards),
        communityCards: JSON.stringify([]),
        player1Bet: player1InitialBet,
        player2Bet: player2InitialBet,
        pot: player1InitialBet + player2InitialBet,
        currentRound: "preflop",
        actions: JSON.stringify([
          { playerId: smallBlindPlayer, action: "small_blind", amount: game.smallBlind, timestamp: new Date() },
          { playerId: bigBlindPlayer, action: "big_blind", amount: game.bigBlind, timestamp: new Date() },
        ]),
      },
    });

    return NextResponse.json({
      game: updatedGame,
      hand: newHand,
    });
  } catch (error) {
    console.error("Error starting hand:", error);
    return NextResponse.json(
      { error: "Failed to start hand" },
      { status: 500 }
    );
  }
}
