"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PlayingCard from "./PlayingCard";
import { Card, getAvailableActions } from "@/lib/poker";
import Link from "next/link";

interface PokerGameClientProps {
  game: any;
  currentHand: any;
  playerHoleCards: Card[];
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
    ? getAvailableActions(playerChips, opponentBet, playerBet, game.bigBlind, opponentChips)
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

            // playerHoleCards is already parsed by the API
            setPlayerHoleCards(hand.playerHoleCards || []);

            // Parse community cards if they're a string
            const community = typeof hand.communityCards === 'string'
              ? JSON.parse(hand.communityCards)
              : hand.communityCards;
            setCommunityCards(community || []);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b-2 border-yellow-600 px-4 py-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link
            href="/poker"
            className="flex items-center gap-2 text-white hover:text-yellow-400 transition-colors font-semibold"
          >
            <span className="text-xl">←</span> Back to Lobby
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-yellow-400 font-bold text-lg">
              SB/BB: <span className="text-white">{game.smallBlind}/{game.bigBlind}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Opponent Area */}
        <div className="mb-6">
          <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 max-w-md mx-auto shadow-2xl border-2 ${
            !isMyTurn && game.currentTurn && hasActiveHand ? 'border-yellow-500 animate-pulse' : 'border-gray-700'
          }`}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {opponent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-white font-bold text-lg">{opponent.name}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400 font-bold text-lg">{opponentChips}</span>
                    <span className="text-gray-400 text-sm">chips</span>
                  </div>
                </div>
              </div>
              {opponentBet > 0 && (
                <div className="relative">
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                  <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-xl font-bold shadow-lg">
                    Bet: {opponentBet}
                  </div>
                </div>
              )}
            </div>
            {/* Opponent's cards (face down) */}
            {hasActiveHand && (
              <div className="flex gap-2 justify-center mt-4">
                <PlayingCard faceDown small />
                <PlayingCard faceDown small />
              </div>
            )}
          </div>
        </div>

        {/* Poker Table */}
        <div className="relative bg-gradient-to-br from-green-800 via-green-700 to-green-900 rounded-[3rem] border-[12px] border-amber-900 shadow-2xl p-10 mb-6 overflow-hidden">
          {/* Table felt texture overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-black to-transparent"></div>

          {/* Pot */}
          <div className="text-center mb-8 relative z-10">
            <div className="inline-block bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 text-gray-900 px-8 py-4 rounded-2xl font-bold text-2xl shadow-2xl border-4 border-yellow-600 transform hover:scale-105 transition-transform">
              <span className="text-3xl mr-2">💰</span>
              <span className="text-white drop-shadow-lg">Pot:</span> {game.pot}
            </div>
          </div>

          {/* Community Cards */}
          <div className="flex gap-4 justify-center mb-10 relative z-10">
            {hasActiveHand ? (
              <>
                {communityCards.length > 0 ? (
                  communityCards.map((card, i) => (
                    <div key={i} className="transform hover:scale-110 transition-transform duration-200">
                      <PlayingCard card={card} />
                    </div>
                  ))
                ) : (
                  <>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-20 h-28 border-4 border-dashed border-green-600 rounded-xl bg-green-800/30 backdrop-blur-sm" />
                    ))}
                  </>
                )}
                {communityCards.length > 0 && communityCards.length < 5 &&
                  Array.from({ length: 5 - communityCards.length }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="w-20 h-28 border-4 border-dashed border-green-600 rounded-xl bg-green-800/30 backdrop-blur-sm"
                    />
                  ))}
              </>
            ) : game.status === "finished" ? (
              <div className="text-white text-center py-12 relative z-10">
                <div className="text-8xl mb-6 animate-bounce">🏆</div>
                <div className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  {game.winnerId === userId ? "Victory!" : `${opponent.name} Wins!`}
                </div>
                <div className="text-2xl text-green-400 mb-6 font-semibold">
                  Game Over - All chips won!
                </div>
                <Link
                  href="/poker"
                  className="inline-block mt-4 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-2xl font-bold text-lg shadow-xl transform hover:scale-105 transition-all"
                >
                  Back to Lobby
                </Link>
              </div>
            ) : (
              <div className="text-white text-center py-12 relative z-10">
                <div className="text-8xl mb-6">🎴</div>
                <div className="text-2xl font-bold mb-4">Ready to play?</div>
                <button
                  onClick={handleStartHand}
                  disabled={loading}
                  className="mt-4 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white rounded-2xl font-bold text-lg shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all"
                >
                  {loading ? "Starting..." : "Deal Cards"}
                </button>
              </div>
            )}
          </div>

          {/* Hand Result - Show when hand is completed but game continues */}
          {currentHand && currentHand.completedAt && game.status !== "finished" && (
            <div className="text-center mb-6 relative z-10">
              <div className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-gray-900 px-8 py-6 rounded-2xl shadow-2xl mx-auto max-w-md border-4 border-yellow-600 transform hover:scale-105 transition-transform">
                <div className="text-3xl font-bold mb-3">
                  {currentHand.winnerId === userId ? "🎉 You Won!" : `${opponent.name} Wins 🎊`}
                </div>
                {currentHand.winningHand && (
                  <div className="text-xl font-bold mb-4 text-white drop-shadow-lg">
                    {currentHand.winningHand}
                  </div>
                )}
                <button
                  onClick={handleStartHand}
                  disabled={loading}
                  className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-lg disabled:opacity-50 shadow-lg transform hover:scale-105 transition-all"
                >
                  {loading ? "Starting..." : "Next Hand →"}
                </button>
              </div>
            </div>
          )}

          {/* Game Status */}
          {hasActiveHand && (
            <div className="text-center relative z-10">
              <div className="inline-block bg-gray-900/90 backdrop-blur-md text-white px-6 py-3 rounded-xl shadow-xl border-2 border-gray-700">
                <span className="text-gray-400">Round:</span>{" "}
                <span className="capitalize font-bold text-green-400 text-lg">{currentHand.currentRound}</span>
                {isMyTurn && (
                  <span className="ml-4 text-yellow-400 font-bold text-lg animate-pulse">🔥 Your Turn</span>
                )}
                {!isMyTurn && game.currentTurn && (
                  <span className="ml-4 text-gray-400">⏳ Waiting...</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Player Area */}
        <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 max-w-3xl mx-auto shadow-2xl border-2 ${
          isMyTurn && hasActiveHand ? 'border-green-500 shadow-green-500/50 animate-pulse' : 'border-gray-700'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 bg-gradient-to-br ${isPlayer1 ? 'from-pink-500 to-pink-700' : 'from-blue-500 to-blue-700'} rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                {playerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className={`font-bold text-xl ${isPlayer1 ? "text-pink-400" : "text-blue-400"}`}>
                  {playerName} <span className="text-sm text-gray-400">(You)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 font-bold text-xl">{playerChips}</span>
                  <span className="text-gray-400 text-sm">chips</span>
                </div>
              </div>
            </div>
            {playerBet > 0 && (
              <div className="relative">
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2 rounded-xl font-bold shadow-lg text-lg">
                  Bet: {playerBet}
                </div>
              </div>
            )}
          </div>

          {/* Player's cards */}
          {playerHoleCards && playerHoleCards.length > 0 && (
            <div className="flex gap-4 justify-center mb-6">
              {playerHoleCards.map((card, i) => (
                <div key={i} className="transform hover:scale-110 hover:-translate-y-4 transition-all duration-200">
                  <PlayingCard card={card} />
                </div>
              ))}
            </div>
          )}

          {/* Betting Controls */}
          {hasActiveHand && isMyTurn && actions && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {actions.canFold && (
                  <button
                    onClick={() => handleAction("fold")}
                    disabled={loading}
                    className="px-6 py-4 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl font-bold text-lg shadow-xl disabled:opacity-50 transform hover:scale-105 transition-all"
                  >
                    Fold
                  </button>
                )}
                {actions.canCheck && (
                  <button
                    onClick={() => handleAction("check")}
                    disabled={loading}
                    className="px-6 py-4 bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white rounded-xl font-bold text-lg shadow-xl disabled:opacity-50 transform hover:scale-105 transition-all"
                  >
                    Check
                  </button>
                )}
                {actions.canCall && (
                  <button
                    onClick={() => handleAction("call")}
                    disabled={loading}
                    className="px-6 py-4 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-bold text-lg shadow-xl disabled:opacity-50 transform hover:scale-105 transition-all"
                  >
                    Call <span className="text-yellow-300">{actions.callAmount}</span>
                  </button>
                )}
              </div>

              {actions.canRaise && (
                <div className="space-y-3 bg-gray-900/50 backdrop-blur-sm p-4 rounded-xl border-2 border-gray-700">
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={actions.minRaise}
                      max={playerChips}
                      step={game.bigBlind}
                      value={raiseAmount || actions.minRaise}
                      onChange={(e) => setRaiseAmount(parseInt(e.target.value))}
                      className="flex-1 h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                    />
                    <input
                      type="number"
                      min={actions.minRaise}
                      max={playerChips}
                      step={game.bigBlind}
                      value={raiseAmount || actions.minRaise}
                      onChange={(e) => setRaiseAmount(parseInt(e.target.value))}
                      className="w-28 px-4 py-2 bg-gray-700 text-white rounded-lg font-bold text-lg border-2 border-gray-600 focus:border-green-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={() => handleAction("raise", raiseAmount || actions.minRaise)}
                    disabled={loading}
                    className="w-full px-6 py-4 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-xl font-bold text-lg shadow-xl disabled:opacity-50 transform hover:scale-105 transition-all"
                  >
                    Raise to <span className="text-yellow-300">{raiseAmount || actions.minRaise}</span>
                  </button>
                </div>
              )}

              {actions.canAllIn && (
                <button
                  onClick={() => handleAction("all_in")}
                  disabled={loading}
                  className="w-full px-6 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-500 hover:via-pink-500 hover:to-red-500 text-white rounded-xl font-bold text-xl shadow-2xl disabled:opacity-50 transform hover:scale-105 transition-all border-2 border-white/20"
                >
                  <span className="text-2xl mr-2">🔥</span>
                  ALL IN <span className="text-yellow-300">({playerChips})</span>
                  <span className="text-2xl ml-2">🔥</span>
                </button>
              )}
            </div>
          )}

          {!hasActiveHand && !isMyTurn && game.status === "waiting" && (
            <div className="text-center py-6">
              <div className="text-gray-400 text-lg">
                <span className="animate-pulse">⏳</span> Waiting for next hand...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
