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
    let newOpponentChips = opponentChips;
    let newPlayerBet = playerBet;
    let newOpponentBet = opponentBet;
    let newPot = currentHand.pot;
    let nextRound: string | null = currentHand.currentRound;
    let newCommunityCards = JSON.parse(currentHand.communityCards as string) as Card[];
    let handCompleted = false;
    let winnerId: string | null = null;
    let roundAdvanced = false;

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
          roundAdvanced = true;
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

      // Check if either player is all-in after this call
      const playerAllIn = newPlayerChips === 0;
      const opponentAllIn = opponentChips === 0;

      // If either player is all-in, deal all remaining community cards and go to showdown
      if (playerAllIn || opponentAllIn) {
        // Deal all remaining community cards at once
        while (newCommunityCards.length < 5) {
          const round = newCommunityCards.length === 0 ? "flop" :
                       newCommunityCards.length === 3 ? "turn" : "river";
          newCommunityCards = dealCommunityCards(round, newCommunityCards);
        }

        // Go directly to showdown
        handCompleted = true;
        const result = determineWinner(
          JSON.parse(currentHand.player1Cards as string),
          JSON.parse(currentHand.player2Cards as string),
          newCommunityCards
        );
        winnerId = result.winner === "player1" ? game.player1Id : result.winner === "player2" ? game.player2Id : null;
        nextRound = "showdown";
      } else {
        // Move to next round normally
        nextRound = getNextRound(currentHand.currentRound);
        if (nextRound) {
          newCommunityCards = dealCommunityCards(nextRound, newCommunityCards);
          roundAdvanced = true;
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
    } else if (action === "raise" || action === "all_in") {
      const raiseAmount = action === "all_in" ? playerChips : amount;
      if (raiseAmount > playerChips) {
        return NextResponse.json({ error: "Not enough chips" }, { status: 400 });
      }
      newPlayerChips -= raiseAmount;
      newPlayerBet += raiseAmount;
      newPot += raiseAmount;

      // If player went all-in and opponent has no chips left to call
      if (newPlayerChips === 0 && opponentChips < (newPlayerBet - opponentBet)) {
        // Opponent can't match the all-in, deal remaining cards and go to showdown
        while (newCommunityCards.length < 5) {
          const round = newCommunityCards.length === 0 ? "flop" :
                       newCommunityCards.length === 3 ? "turn" : "river";
          newCommunityCards = dealCommunityCards(round, newCommunityCards);
        }
        handCompleted = true;
        const result = determineWinner(
          JSON.parse(currentHand.player1Cards as string),
          JSON.parse(currentHand.player2Cards as string),
          newCommunityCards
        );
        winnerId = result.winner === "player1" ? game.player1Id : result.winner === "player2" ? game.player2Id : null;
        nextRound = "showdown";
      }
      // If opponent was already all-in and player now covers that all-in
      else if (opponentChips === 0 && newPlayerBet >= opponentBet) {
        // Both players all-in, deal remaining cards and go to showdown
        while (newCommunityCards.length < 5) {
          const round = newCommunityCards.length === 0 ? "flop" :
                       newCommunityCards.length === 3 ? "turn" : "river";
          newCommunityCards = dealCommunityCards(round, newCommunityCards);
        }
        handCompleted = true;
        const result = determineWinner(
          JSON.parse(currentHand.player1Cards as string),
          JSON.parse(currentHand.player2Cards as string),
          newCommunityCards
        );
        winnerId = result.winner === "player1" ? game.player1Id : result.winner === "player2" ? game.player2Id : null;
        nextRound = "showdown";
      }
    }

    // If advancing to next round, reset bets to 0 (they're already in the pot)
    if (roundAdvanced) {
      newPlayerBet = 0;
      newOpponentBet = 0;
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
        player1Bet: isPlayer1 ? newPlayerBet : newOpponentBet,
        player2Bet: isPlayer1 ? newOpponentBet : newPlayerBet,
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

    // Award pot to winner if hand is completed
    let finalPlayer1Chips = isPlayer1 ? newPlayerChips : newOpponentChips;
    let finalPlayer2Chips = isPlayer1 ? newOpponentChips : newPlayerChips;
    let finalPot = newPot;

    if (handCompleted && winnerId) {
      if (winnerId === game.player1Id) {
        finalPlayer1Chips += newPot;
      } else {
        finalPlayer2Chips += newPot;
      }
      finalPot = 0; // Reset pot after awarding
    }

    // Check if a player has lost all their chips (game over)
    let gameOver = false;
    let gameWinnerId: string | null = null;
    if (finalPlayer1Chips === 0) {
      gameOver = true;
      gameWinnerId = game.player2Id;
    } else if (finalPlayer2Chips === 0) {
      gameOver = true;
      gameWinnerId = game.player1Id;
    }

    // Determine next player's turn
    // If game is over or hand is completed, no turn
    // If a player has no chips, they can't act - skip their turn or end hand
    let nextTurn: string | null = null;
    if (!handCompleted && !gameOver) {
      const opponentId = isPlayer1 ? game.player2Id : game.player1Id;
      const nextPlayerChips = isPlayer1 ? finalPlayer2Chips : finalPlayer1Chips;

      // Only give turn to opponent if they have chips to act with
      if (nextPlayerChips > 0) {
        nextTurn = opponentId;
      } else {
        // Opponent has no chips, they can't act - hand should be completed
        // This shouldn't happen if logic above is correct, but just in case
        nextTurn = null;
      }
    }

    // Update game
    const updatedGame = await prisma.pokerGame.update({
      where: { id: gameId },
      data: {
        player1Chips: finalPlayer1Chips,
        player2Chips: finalPlayer2Chips,
        pot: finalPot,
        currentRound: nextRound || currentHand.currentRound,
        currentTurn: nextTurn,
        ...(handCompleted && {
          status: gameOver ? "finished" : "completed",
          winnerId: gameOver ? gameWinnerId : winnerId,
          winAmount: newPot,
        }),
        // If game is over, mark it as finished
        ...(gameOver && !handCompleted && {
          status: "finished",
          winnerId: gameWinnerId,
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
