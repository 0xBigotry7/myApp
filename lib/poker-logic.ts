
import { Hand } from "pokersolver";

export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "T" | "J" | "Q" | "K" | "A";

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface Player {
  id: string;
  name: string;
  chips: number;
  hand: Card[];
  currentBet: number;
  isFolded: boolean;
  isAllIn: boolean;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  isTurn: boolean;
}

export interface GameState {
  id: string;
  players: Player[];
  communityCards: Card[];
  pot: number;
  currentBet: number;
  deck: Card[];
  stage: "preflop" | "flop" | "turn" | "river" | "showdown";
  winnerId?: string | null;
  winningHand?: string;
  minRaise: number;
}

// --- Deck Management ---

export function createDeck(): Card[] {
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
  const ranks: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

export function dealCards(deck: Card[], count: number): { dealt: Card[]; remaining: Card[] } {
  return {
    dealt: deck.slice(0, count),
    remaining: deck.slice(count),
  };
}

// --- Hand Evaluation ---

export function cardToString(card: Card): string {
  const suitMap: Record<Suit, string> = { hearts: "h", diamonds: "d", clubs: "c", spades: "s" };
  return `${card.rank}${suitMap[card.suit]}`;
}

export function evaluateHand(holeCards: Card[], communityCards: Card[]) {
  const allCards = [...holeCards, ...communityCards].map(cardToString);
  try {
    const hand = Hand.solve(allCards);
    return {
      name: hand.name,
      descr: hand.descr,
      rank: hand.rank, // Higher is better
    };
  } catch (e) {
    console.error("Error evaluating hand", e);
    return { name: "High Card", descr: "High Card", rank: 0 };
  }
}

export function determineWinner(players: Player[], communityCards: Card[]): { winnerId: string | null; winningHand: string } {
  const activePlayers = players.filter(p => !p.isFolded);
  if (activePlayers.length === 0) return { winnerId: null, winningHand: "" };
  if (activePlayers.length === 1) return { winnerId: activePlayers[0].id, winningHand: "Default" };

  const solvedHands = activePlayers.map(player => {
    const allCards = [...player.hand, ...communityCards].map(cardToString);
    return {
      playerId: player.id,
      hand: Hand.solve(allCards)
    };
  });

  const winners = Hand.winners(solvedHands.map(sh => sh.hand));

  if (winners.length > 1) {
    // Tie logic could be complex, for now return null (split pot handled by caller usually, but here we just signal tie)
    // Or return the first one as "winner" for display if we don't support splits fully in this helper
    // Let's return null for tie
    return { winnerId: null, winningHand: winners[0].descr };
  }

  const winnerHand = winners[0];
  const winner = solvedHands.find(sh => sh.hand === winnerHand);

  return {
    winnerId: winner ? winner.playerId : null,
    winningHand: winnerHand.descr
  };
}

// --- Game Logic Helpers ---

export function getNextStage(currentStage: GameState["stage"]): GameState["stage"] {
  switch (currentStage) {
    case "preflop": return "flop";
    case "flop": return "turn";
    case "turn": return "river";
    case "river": return "showdown";
    default: return "showdown";
  }
}
