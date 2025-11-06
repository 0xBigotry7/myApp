"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PlayingCard from "./PlayingCard";
import { Card, getAvailableActions } from "@/lib/poker";
import Link from "next/link";

interface PokerGameClientProps {
  game: any;
  currentHand: any;
  playerHoleCards: Card[] | null;
  communityCards: Card[];
  isPlayer1: boolean;
  userId: string;
}

export default function PokerGameClient({
  game: initialGame,
  currentHand: initialHand,
  playerHoleCards: initialPlayerCards,
  communityCards: initialCommunityCards,
  isPlayer1,
  userId,
}: PokerGameClientProps) {
  const router = useRouter();
  const [game, setGame] = useState(initialGame);
  const [currentHand, setCurrentHand] = useState(initialHand);
  const [playerHoleCards, setPlayerHoleCards] = useState(initialPlayerCards);
  const [communityCards, setCommunityCards] = useState(initialCommunityCards);
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const opponent = isPlayer1 ? game.player2 : game.player1;
  const playerChips = isPlayer1 ? game.player1Chips : game.player2Chips;
  const opponentChips = isPlayer1 ? game.player2Chips : game.player1Chips;
  const playerName = isPlayer1 ? game.player1.name : game.player2.name;

  const isMyTurn = game.currentTurn === userId;
  const hasActiveHand = currentHand && !currentHand.completedAt;

  const playerBet = currentHand ? (isPlayer1 ? currentHand.player1Bet : currentHand.player2Bet) : 0;
  const opponentBet = currentHand ? (isPlayer1 ? currentHand.player2Bet : currentHand.player1Bet) : 0;

  const actions = hasActiveHand
    ? getAvailableActions(playerChips, opponentBet, playerBet, game.bigBlind)
    : null;

  // Auto-refresh game state every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/poker/${game.id}`);
        if (res.ok) {
          const data = await res.json();
          setGame(data);
          if (data.hands && data.hands[0]) {
            const hand = data.hands[0];
            setCurrentHand(hand);
            setPlayerHoleCards(hand.playerHoleCards || null);
            setCommunityCards(JSON.parse(hand.communityCards || "[]"));
          }
        }
      } catch (error) {
        console.error("Error refreshing game:", error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [game.id]);

  const handleStartHand = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/poker/${game.id}/start-hand`, {
        method: "POST",
      });

      if (res.ok) {
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to start hand");
      }
    } catch (error) {
      console.error("Error starting hand:", error);
      alert("Failed to start hand");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, amount?: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/poker/${game.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, amount }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to perform action");
      }
    } catch (error) {
      console.error("Error performing action:", error);
      alert("Failed to perform action");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-emerald-800">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link
            href="/poker"
            className="text-white hover:text-green-400 transition-colors"
          >
            ← Back to Lobby
          </Link>
          <div className="text-white font-semibold">
            Blinds: {game.smallBlind}/{game.bigBlind}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Opponent Area */}
        <div className="mb-8">
          <div className="bg-gray-800 rounded-xl p-4 max-w-md mx-auto">
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="text-white font-semibold text-lg">{opponent.name}</div>
                <div className="text-green-400 font-bold">{opponentChips} chips</div>
              </div>
              {opponentBet > 0 && (
                <div className="bg-red-600 text-white px-3 py-1 rounded-lg font-bold">
                  Bet: {opponentBet}
                </div>
              )}
            </div>
            {/* Opponent's cards (face down) */}
            {hasActiveHand && (
              <div className="flex gap-2 justify-center">
                <PlayingCard faceDown small />
                <PlayingCard faceDown small />
              </div>
            )}
          </div>
        </div>

        {/* Poker Table */}
        <div className="bg-green-900 rounded-3xl border-8 border-amber-900 shadow-2xl p-8 mb-8">
          {/* Pot */}
          <div className="text-center mb-6">
            <div className="inline-block bg-yellow-500 text-gray-900 px-6 py-3 rounded-full font-bold text-xl shadow-lg">
              💰 Pot: {game.pot}
            </div>
          </div>

          {/* Community Cards */}
          <div className="flex gap-3 justify-center mb-8">
            {hasActiveHand ? (
              <>
                {communityCards.length > 0 ? (
                  communityCards.map((card, i) => (
                    <PlayingCard key={i} card={card} />
                  ))
                ) : (
                  <>
                    <div className="w-16 h-24 border-2 border-dashed border-gray-600 rounded-lg" />
                    <div className="w-16 h-24 border-2 border-dashed border-gray-600 rounded-lg" />
                    <div className="w-16 h-24 border-2 border-dashed border-gray-600 rounded-lg" />
                    <div className="w-16 h-24 border-2 border-dashed border-gray-600 rounded-lg" />
                    <div className="w-16 h-24 border-2 border-dashed border-gray-600 rounded-lg" />
                  </>
                )}
                {communityCards.length < 5 &&
                  Array.from({ length: 5 - communityCards.length }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="w-16 h-24 border-2 border-dashed border-gray-600 rounded-lg"
                    />
                  ))}
              </>
            ) : (
              <div className="text-white text-center py-8">
                <div className="text-6xl mb-4">🎴</div>
                <div className="text-xl font-semibold mb-2">Ready to play?</div>
                <button
                  onClick={handleStartHand}
                  disabled={loading}
                  className="mt-4 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {loading ? "Starting..." : "Start Hand"}
                </button>
              </div>
            )}
          </div>

          {/* Game Status */}
          {hasActiveHand && (
            <div className="text-center mb-4">
              <div className="inline-block bg-gray-800 text-white px-4 py-2 rounded-lg">
                Round: <span className="capitalize font-bold text-green-400">{currentHand.currentRound}</span>
                {isMyTurn && (
                  <span className="ml-4 text-yellow-400 font-bold">🔥 Your Turn</span>
                )}
                {!isMyTurn && game.currentTurn && (
                  <span className="ml-4 text-gray-400">⏳ Waiting...</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Player Area */}
        <div className="bg-gray-800 rounded-xl p-4 max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-3">
            <div>
              <div className={`font-semibold text-lg ${isPlayer1 ? "text-pink-400" : "text-blue-400"}`}>
                {playerName} (You)
              </div>
              <div className="text-green-400 font-bold">{playerChips} chips</div>
            </div>
            {playerBet > 0 && (
              <div className="bg-blue-600 text-white px-3 py-1 rounded-lg font-bold">
                Bet: {playerBet}
              </div>
            )}
          </div>

          {/* Player's cards */}
          {playerHoleCards && (
            <div className="flex gap-3 justify-center mb-4">
              {playerHoleCards.map((card, i) => (
                <PlayingCard key={i} card={card} />
              ))}
            </div>
          )}

          {/* Betting Controls */}
          {hasActiveHand && isMyTurn && actions && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {actions.canFold && (
                  <button
                    onClick={() => handleAction("fold")}
                    disabled={loading}
                    className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-all"
                  >
                    Fold
                  </button>
                )}
                {actions.canCheck && (
                  <button
                    onClick={() => handleAction("check")}
                    disabled={loading}
                    className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-all"
                  >
                    Check
                  </button>
                )}
                {actions.canCall && (
                  <button
                    onClick={() => handleAction("call")}
                    disabled={loading}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-all"
                  >
                    Call {actions.callAmount}
                  </button>
                )}
              </div>

              {actions.canRaise && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="range"
                      min={actions.minRaise}
                      max={playerChips}
                      step={game.bigBlind}
                      value={raiseAmount || actions.minRaise}
                      onChange={(e) => setRaiseAmount(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min={actions.minRaise}
                      max={playerChips}
                      step={game.bigBlind}
                      value={raiseAmount || actions.minRaise}
                      onChange={(e) => setRaiseAmount(parseInt(e.target.value))}
                      className="w-24 px-3 py-2 bg-gray-700 text-white rounded-lg"
                    />
                  </div>
                  <button
                    onClick={() => handleAction("raise", raiseAmount || actions.minRaise)}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-all"
                  >
                    Raise to {raiseAmount || actions.minRaise}
                  </button>
                </div>
              )}

              {actions.canAllIn && (
                <button
                  onClick={() => handleAction("all_in")}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold disabled:opacity-50 transition-all"
                >
                  All In ({playerChips})
                </button>
              )}
            </div>
          )}

          {!hasActiveHand && game.status === "completed" && (
            <div className="text-center py-4">
              <div className="text-white text-xl font-bold mb-4">
                {game.winnerId === userId ? "🎉 You Won!" : "😔 You Lost"}
              </div>
              <button
                onClick={handleStartHand}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50 transition-all"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
