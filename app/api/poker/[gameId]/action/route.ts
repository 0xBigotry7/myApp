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

    // Parse hole cards for deck validation
    const player1HoleCards = JSON.parse(currentHand.player1Cards as string) as Card[];
    const player2HoleCards = JSON.parse(currentHand.player2Cards as string) as Card[];

    let newPlayerChips = playerChips;
    let newOpponentChips = opponentChips;
    let newPlayerBet = playerBet;
    let newOpponentBet = opponentBet;
    let newPot = currentHand.pot;
    let nextRound: string | null = currentHand.currentRound;
    let newCommunityCards = JSON.parse(currentHand.communityCards as string) as Card[];
    let handCompleted = false;
    let winnerId: string | null = null;
    let winningHandDesc: string | null = null;
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

      // Check if opponent's last action was also check (both players checking closes the round)
      const actions = JSON.parse(currentHand.actions as string) as any[];
      const opponentId = isPlayer1 ? game.player2Id : game.player1Id;

      // Find opponent's last action in this betting round
      const lastAction = actions.length > 0 ? actions[actions.length - 1] : null;
      const opponentJustChecked = lastAction?.playerId === opponentId && lastAction?.action === "check";

      if (opponentJustChecked) {
        // Both players checked, move to next round
        nextRound = getNextRound(currentHand.currentRound);
        if (nextRound) {
          newCommunityCards = dealCommunityCards(nextRound, newCommunityCards, player1HoleCards, player2HoleCards);
          roundAdvanced = true;
        } else {
          // Showdown
          handCompleted = true;
          const result = determineWinner(
            player1HoleCards,
            player2HoleCards,
            newCommunityCards
          );
          if (result.winner === "tie") {
            // Split pot - both players get half
            winnerId = null;
          } else {
            winnerId = result.winner === "player1" ? game.player1Id : game.player2Id;
          }
          winningHandDesc = result.winningHand;
        }
      }
      // Otherwise, just pass turn to opponent (first check)
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
        winningHandDesc = result.winningHand;
        nextRound = "showdown";
      } else {
        // Move to next round normally
        nextRound = getNextRound(currentHand.currentRound);
        if (nextRound) {
          newCommunityCards = dealCommunityCards(nextRound, newCommunityCards, player1HoleCards, player2HoleCards);
          roundAdvanced = true;
        } else {
          // Showdown
          handCompleted = true;
          const result = determineWinner(
            player1HoleCards,
            player2HoleCards,
            newCommunityCards
          );
          if (result.winner === "tie") {
            // Split pot - both players get half
            winnerId = null;
          } else {
            winnerId = result.winner === "player1" ? game.player1Id : game.player2Id;
          }
          winningHandDesc = result.winningHand;
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

      // Raise/all-in doesn't automatically advance the round
      // Opponent needs to act (call/fold/raise)
      // Only exception: if opponent was already all-in and can't act
      if (opponentChips === 0) {
        // Opponent already all-in, can't act anymore
        // If player matched or exceeded opponent's bet, go to showdown
        if (newPlayerBet >= opponentBet) {
          while (newCommunityCards.length < 5) {
            const round = newCommunityCards.length === 0 ? "flop" :
                         newCommunityCards.length === 3 ? "turn" : "river";
            newCommunityCards = dealCommunityCards(round, newCommunityCards, player1HoleCards, player2HoleCards);
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
      // Otherwise, turn goes to opponent to respond to the raise/all-in
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
          winningHand: winningHandDesc,
          completedAt: new Date(),
        }),
      },
    });

    // Award pot to winner if hand is completed
    let finalPlayer1Chips = isPlayer1 ? newPlayerChips : newOpponentChips;
    let finalPlayer2Chips = isPlayer1 ? newOpponentChips : newPlayerChips;
    let finalPot = newPot;

    if (handCompleted) {
      if (winnerId) {
        // Single winner gets entire pot
        if (winnerId === game.player1Id) {
          finalPlayer1Chips += newPot;
        } else {
          finalPlayer2Chips += newPot;
        }
      } else {
        // Tie - split pot
        const halfPot = Math.floor(newPot / 2);
        finalPlayer1Chips += halfPot;
        finalPlayer2Chips += halfPot;
        // If odd chip, give it to a random player (standard poker rule)
        if (newPot % 2 === 1) {
          if (Math.random() < 0.5) {
            finalPlayer1Chips += 1;
          } else {
            finalPlayer2Chips += 1;
          }
        }
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
      // In heads-up poker:
      // - Preflop: Button/Small Blind acts first
      // - Post-flop: Big Blind (non-button) acts first

      // Find who has the button
      const buttonPlayerId = game.dealerButton === 0 ? game.player1Id : game.player2Id;
      const nonButtonPlayerId = game.dealerButton === 0 ? game.player2Id : game.player1Id;

      // Determine who should act based on round advancement
      if (roundAdvanced) {
        // Moving to a new round (flop/turn/river) - non-button acts first
        const nonButtonChips = nonButtonPlayerId === game.player1Id ? finalPlayer1Chips : finalPlayer2Chips;
        if (nonButtonChips > 0) {
          nextTurn = nonButtonPlayerId;
        } else {
          // Non-button has no chips, button acts
          const buttonChips = buttonPlayerId === game.player1Id ? finalPlayer1Chips : finalPlayer2Chips;
          nextTurn = buttonChips > 0 ? buttonPlayerId : null;
        }
      } else {
        // Same round, just alternate turns
        const opponentId = isPlayer1 ? game.player2Id : game.player1Id;
        const nextPlayerChips = isPlayer1 ? finalPlayer2Chips : finalPlayer1Chips;

        // Only give turn to opponent if they have chips to act with
        if (nextPlayerChips > 0) {
          nextTurn = opponentId;
        } else {
          // Opponent has no chips, they can't act - hand should be completed
          nextTurn = null;
        }
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
        ...(handCompleted && !gameOver && {
          status: "waiting", // Hand completed, waiting for next hand
        }),
        ...(gameOver && {
          status: "finished",
          winnerId: gameWinnerId,
          winAmount: newPot,
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

function dealCommunityCards(
  round: string,
  existing: Card[],
  player1Hole: Card[],
  player2Hole: Card[]
): Card[] {
  let deck = createDeck();
  deck = shuffleDeck(deck);

  // Remove hole cards and existing community cards from deck
  deck = deck.filter(card =>
    !existing.some(c => c.suit === card.suit && c.rank === card.rank) &&
    !player1Hole.some(c => c.suit === card.suit && c.rank === card.rank) &&
    !player2Hole.some(c => c.suit === card.suit && c.rank === card.rank)
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
