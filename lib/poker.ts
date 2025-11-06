import { Hand } from "pokersolver";

export interface Card {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  rank: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "T" | "J" | "Q" | "K" | "A";
}

// Create a standard deck of 52 cards
export function createDeck(): Card[] {
  const suits: Card["suit"][] = ["hearts", "diamonds", "clubs", "spades"];
  const ranks: Card["rank"][] = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];

  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

// Fisher-Yates shuffle
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Deal cards from the deck
export function dealCards(deck: Card[], count: number): { dealt: Card[]; remaining: Card[] } {
  return {
    dealt: deck.slice(0, count),
    remaining: deck.slice(count),
  };
}

// Convert our Card format to pokersolver format
export function cardToPokerSolver(card: Card): string {
  const suitMap = {
    hearts: "h",
    diamonds: "d",
    clubs: "c",
    spades: "s",
  };
  return `${card.rank}${suitMap[card.suit]}`;
}

// Evaluate hand using pokersolver
export function evaluateHand(holeCards: Card[], communityCards: Card[]) {
  const allCards = [...holeCards, ...communityCards];
  const pokerSolverCards = allCards.map(cardToPokerSolver);

  try {
    const hand = Hand.solve(pokerSolverCards);
    return {
      name: hand.name,
      descr: hand.descr,
      rank: hand.rank,
    };
  } catch (error) {
    console.error("Error evaluating hand:", error);
    return {
      name: "High Card",
      descr: "High Card",
      rank: 0,
    };
  }
}

// Determine winner between two hands
export function determineWinner(
  player1HoleCards: Card[],
  player2HoleCards: Card[],
  communityCards: Card[]
): { winner: "player1" | "player2" | "tie"; winningHand: string } {
  const p1Cards = [...player1HoleCards, ...communityCards].map(cardToPokerSolver);
  const p2Cards = [...player2HoleCards, ...communityCards].map(cardToPokerSolver);

  try {
    const p1Hand = Hand.solve(p1Cards);
    const p2Hand = Hand.solve(p2Cards);

    const winners = Hand.winners([p1Hand, p2Hand]);

    if (winners.length > 1) {
      return { winner: "tie", winningHand: p1Hand.descr };
    }

    const winner = winners[0] === p1Hand ? "player1" : "player2";
    const winningHand = winners[0].descr;

    return { winner, winningHand };
  } catch (error) {
    console.error("Error determining winner:", error);
    return { winner: "tie", winningHand: "Unknown" };
  }
}

// Get card display info
export function getCardDisplay(card: Card): { symbol: string; color: string; displayRank: string } {
  const suitSymbols = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
  };

  const suitColors = {
    hearts: "text-red-600",
    diamonds: "text-red-600",
    clubs: "text-gray-900",
    spades: "text-gray-900",
  };

  const rankDisplay: Record<Card["rank"], string> = {
    "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
    "T": "10", "J": "J", "Q": "Q", "K": "K", "A": "A",
  };

  return {
    symbol: suitSymbols[card.suit],
    color: suitColors[card.suit],
    displayRank: rankDisplay[card.rank],
  };
}

// Calculate minimum raise amount
export function getMinRaise(currentBet: number, bigBlind: number): number {
  return Math.max(currentBet * 2, bigBlind * 2);
}

// Check if a bet is valid
export function isValidBet(
  amount: number,
  playerChips: number,
  currentBet: number,
  playerCurrentBet: number
): { valid: boolean; reason?: string } {
  if (amount > playerChips) {
    return { valid: false, reason: "Not enough chips" };
  }

  if (amount < currentBet - playerCurrentBet && amount < playerChips) {
    return { valid: false, reason: "Bet must be at least the current bet or all-in" };
  }

  return { valid: true };
}

// Get action options for a player
export function getAvailableActions(
  playerChips: number,
  currentBet: number,
  playerCurrentBet: number,
  bigBlind: number,
  opponentChips: number = Infinity
): {
  canCheck: boolean;
  canCall: boolean;
  callAmount: number;
  canRaise: boolean;
  minRaise: number;
  canFold: boolean;
  canAllIn: boolean;
} {
  const needToCall = currentBet - playerCurrentBet;
  const canCheck = needToCall === 0;
  const canCall = needToCall > 0 && needToCall <= playerChips;
  const minRaise = getMinRaise(currentBet, bigBlind);

  // Cannot raise if opponent is all-in (has 0 chips)
  const opponentIsAllIn = opponentChips === 0;
  const canRaise = playerChips >= minRaise && !opponentIsAllIn;

  const canAllIn = playerChips > 0 && !opponentIsAllIn;

  return {
    canCheck,
    canCall,
    callAmount: needToCall,
    canRaise,
    minRaise,
    canFold: !canCheck, // Can only fold if there's a bet to call
    canAllIn,
  };
}
