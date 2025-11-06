import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dealCards, createDeck, shuffleDeck, determineWinner, type Card } from "@/lib/poker";

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
    const { action, amount } = await req.json(); // action: "fold", "check", "call", "raise", "all_in"

    const game = await prisma.pokerGame.findUnique({
      where: { id: gameId },
      include: {
        hands: {
          where: { completedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!game || !game.hands[0]) {
      return NextResponse.json({ error: "No active hand" }, { status: 400 });
    }

    const currentHand = game.hands[0];

    // Check if it's player's turn
    if (game.currentTurn !== session.user.id) {
      return NextResponse.json({ error: "Not your turn" }, { status: 400 });
    }

    const isPlayer1 = game.player1Id === session.user.id;
    const playerChips = isPlayer1 ? game.player1Chips : game.player2Chips;
    const opponentChips = isPlayer1 ? game.player2Chips : game.player1Chips;
    const playerBet = isPlayer1 ? currentHand.player1Bet : currentHand.player2Bet;
    const opponentBet = isPlayer1 ? currentHand.player2Bet : currentHand.player1Bet;

    let newPlayerChips = playerChips;
    let newPlayerBet = playerBet;
    let newPot = currentHand.pot;
    let nextRound = currentHand.currentRound;
    let newCommunityCards = JSON.parse(currentHand.communityCards as string) as Card[];
    let handCompleted = false;
    let winnerId: string | null = null;

    // Process action
    if (action === "fold") {
      // Opponent wins
      handCompleted = true;
      winnerId = isPlayer1 ? game.player2Id : game.player1Id;
    } else if (action === "check") {
      // Can only check if bets are equal
      if (playerBet !== opponentBet) {
        return NextResponse.json({ error: "Cannot check" }, { status: 400 });
      }
      // Move to next round if both players have acted
      if (playerBet === opponentBet) {
        nextRound = getNextRound(currentHand.currentRound);
        if (nextRound) {
          newCommunityCards = dealCommunityCards(nextRound, newCommunityCards);
        } else {
          // Showdown
          handCompleted = true;
          const result = determineWinner(
            JSON.parse(currentHand.player1Cards as string),
            JSON.parse(currentHand.player2Cards as string),
            newCommunityCards
          );
          winnerId = result.winner === "player1" ? game.player1Id : result.winner === "player2" ? game.player2Id : null;
        }
      }
    } else if (action === "call") {
      const callAmount = opponentBet - playerBet;
      if (callAmount > playerChips) {
        return NextResponse.json({ error: "Not enough chips" }, { status: 400 });
      }
      newPlayerChips -= callAmount;
      newPlayerBet += callAmount;
      newPot += callAmount;

      // Move to next round
      nextRound = getNextRound(currentHand.currentRound);
      if (nextRound) {
        newCommunityCards = dealCommunityCards(nextRound, newCommunityCards);
      } else {
        // Showdown
        handCompleted = true;
        const result = determineWinner(
          JSON.parse(currentHand.player1Cards as string),
          JSON.parse(currentHand.player2Cards as string),
          newCommunityCards
        );
        winnerId = result.winner === "player1" ? game.player1Id : result.winner === "player2" ? game.player2Id : null;
      }
    } else if (action === "raise" || action === "all_in") {
      const raiseAmount = action === "all_in" ? playerChips : amount;
      if (raiseAmount > playerChips) {
        return NextResponse.json({ error: "Not enough chips" }, { status: 400 });
      }
      newPlayerChips -= raiseAmount;
      newPlayerBet += raiseAmount;
      newPot += raiseAmount;
    }

    // Update hand
    const actions = JSON.parse(currentHand.actions as string) as any[];
    actions.push({
      playerId: session.user.id,
      action,
      amount: amount || 0,
      timestamp: new Date(),
    });

    await prisma.pokerHand.update({
      where: { id: currentHand.id },
      data: {
        player1Bet: isPlayer1 ? newPlayerBet : opponentBet,
        player2Bet: isPlayer1 ? opponentBet : newPlayerBet,
        pot: newPot,
        communityCards: JSON.stringify(newCommunityCards),
        currentRound: nextRound || currentHand.currentRound,
        actions: JSON.stringify(actions),
        ...(handCompleted && {
          winnerId,
          completedAt: new Date(),
        }),
      },
    });

    // Update game
    const updatedGame = await prisma.pokerGame.update({
      where: { id: gameId },
      data: {
        player1Chips: isPlayer1 ? newPlayerChips : opponentChips,
        player2Chips: isPlayer1 ? opponentChips : newPlayerChips,
        pot: newPot,
        currentRound: nextRound || currentHand.currentRound,
        currentTurn: handCompleted ? null : (isPlayer1 ? game.player2Id : game.player1Id),
        ...(handCompleted && {
          status: "completed",
          winnerId,
        }),
      },
    });

    return NextResponse.json({ success: true, game: updatedGame });
  } catch (error) {
    console.error("Error processing action:", error);
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    );
  }
}

function getNextRound(current: string): string | null {
  const rounds = ["preflop", "flop", "turn", "river"];
  const currentIndex = rounds.indexOf(current);
  return currentIndex < rounds.length - 1 ? rounds[currentIndex + 1] : null;
}

function dealCommunityCards(round: string, existing: Card[]): Card[] {
  let deck = createDeck();
  deck = shuffleDeck(deck);

  // Remove existing community cards from deck
  deck = deck.filter(card =>
    !existing.some(c => c.suit === card.suit && c.rank === card.rank)
  );

  if (round === "flop") {
    const { dealt } = dealCards(deck, 3);
    return dealt;
  } else if (round === "turn" || round === "river") {
    const { dealt } = dealCards(deck, 1);
    return [...existing, ...dealt];
  }

  return existing;
}
