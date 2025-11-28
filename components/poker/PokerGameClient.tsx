"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PlayingCard from "./PlayingCard";
import { Card, getAvailableActions } from "@/lib/poker";
import Link from "next/link";
import { ChevronLeft, Trophy, Coins, AlertCircle } from "lucide-react";

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
            setPlayerHoleCards(hand.playerHoleCards || []);
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
      const res = await fetch(`/api/poker/${game.id}/start-hand`, { method: "POST" });
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error starting hand:", error);
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
      }
    } catch (error) {
      console.error("Error performing action:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-800 px-6 py-4 backdrop-blur-xl fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link
            href="/poker"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold text-sm"
          >
            <ChevronLeft className="w-5 h-5" />
            Lobby
          </Link>
          <div className="flex items-center gap-6">
            <div className="bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700 text-xs font-bold text-slate-300 tracking-wider">
              BLINDS: <span className="text-emerald-400">${game.smallBlind}/${game.bigBlind}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 pt-24 pb-12 px-4 overflow-y-auto">
        <div className="max-w-5xl mx-auto h-full flex flex-col justify-center">
          
          {/* Opponent Area */}
          <div className="flex justify-center mb-12 relative z-10">
            <div className={`relative flex items-center gap-4 px-8 py-4 bg-slate-900/80 backdrop-blur-md rounded-full border-2 shadow-2xl transition-all duration-500 ${
              !isMyTurn && game.currentTurn && hasActiveHand 
                ? 'border-emerald-500 shadow-emerald-500/20 scale-105' 
                : 'border-slate-700'
            }`}>
              <div className="absolute -top-3 -right-3 bg-slate-800 text-xs font-bold px-3 py-1 rounded-full border border-slate-600 text-slate-400 shadow-sm">
                OPPONENT
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center text-2xl border-2 border-slate-600 shadow-inner">
                {opponent.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-black text-xl text-white tracking-tight">{opponent.name}</div>
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold">
                  <Coins className="w-4 h-4" />
                  ${opponentChips.toLocaleString()}
                </div>
              </div>
              
              {opponentBet > 0 && (
                <div className="ml-6 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 shadow-lg">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Bet</div>
                  <div className="font-mono font-bold text-white text-lg">${opponentBet.toLocaleString()}</div>
                </div>
              )}

              {hasActiveHand && (
                <div className="flex gap-1 ml-6">
                  <PlayingCard faceDown small className="opacity-90" />
                  <PlayingCard faceDown small className="opacity-90 -ml-8 rotate-6" />
                </div>
              )}
            </div>
          </div>

          {/* Poker Table */}
          <div className="relative w-full aspect-[2/1] max-h-[500px] bg-[#1a4731] rounded-[100px] border-[16px] border-[#2d1b12] shadow-2xl shadow-black/50 flex items-center justify-center mb-12 overflow-hidden ring-1 ring-white/10">
            {/* Table Felt Texture & Radial Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#235c3f] via-[#1a4731] to-[#0f2b1d]" />
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/felt.png')]" />
            
            {/* Center Pot */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10">
              <div className="text-emerald-200/50 text-sm font-bold tracking-[0.2em] uppercase mb-2">Total Pot</div>
              <div className="bg-black/30 backdrop-blur-sm px-6 py-2 rounded-full border border-white/10 shadow-inner">
                <span className="text-3xl font-black text-white font-mono tracking-tight">${game.pot.toLocaleString()}</span>
              </div>
            </div>

            {/* Community Cards */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] flex gap-3 z-20">
              {hasActiveHand ? (
                <>
                  {communityCards.length > 0 ? (
                    communityCards.map((card, i) => (
                      <div key={i} className="shadow-2xl transform transition-all hover:-translate-y-2">
                        <PlayingCard card={card} />
                      </div>
                    ))
                  ) : (
                    <div className="flex gap-3 opacity-20">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-24 h-36 rounded-xl border-2 border-white/30 bg-white/5" />
                      ))}
                    </div>
                  )}
                </>
              ) : game.status === "finished" ? (
                <div className="text-center">
                  <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 drop-shadow-glow animate-bounce" />
                  <h2 className="text-4xl font-black text-white mb-2 drop-shadow-lg">
                    {game.winnerId === userId ? "YOU WIN!" : "GAME OVER"}
                  </h2>
                  <Link
                    href="/poker"
                    className="inline-block mt-4 px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl shadow-lg transition-all"
                  >
                    Exit Game
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleStartHand}
                  disabled={loading}
                  className="bg-gradient-to-b from-emerald-500 to-emerald-700 text-white px-12 py-4 rounded-full font-black text-xl shadow-xl shadow-emerald-900/50 border-t border-white/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {loading ? "DEALING..." : "DEAL HAND"}
                </button>
              )}
            </div>

            {/* Game Status Badge */}
            {hasActiveHand && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                <div className={`px-6 py-2 rounded-full font-bold text-sm tracking-wider uppercase shadow-lg backdrop-blur-md border ${
                  isMyTurn 
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 animate-pulse" 
                    : "bg-black/40 border-white/10 text-slate-400"
                }`}>
                  {isMyTurn ? "Your Turn" : "Opponent's Turn"}
                </div>
              </div>
            )}
          </div>

          {/* Player Controls Area */}
          <div className="relative z-20 -mt-24">
            <div className={`mx-auto max-w-3xl bg-slate-900/90 backdrop-blur-xl rounded-[32px] border-2 p-1 shadow-2xl transition-all duration-300 ${
              isMyTurn ? "border-emerald-500/50 shadow-emerald-900/20" : "border-slate-800"
            }`}>
              <div className="bg-slate-950/50 rounded-[28px] p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  
                  {/* Player Info */}
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg border-4 border-slate-900">
                      {playerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">You</div>
                      <div className="text-2xl font-black text-white">{playerName}</div>
                      <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-lg">
                        <Coins className="w-5 h-5" />
                        ${playerChips.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="flex gap-3 -mt-12 md:mt-0">
                    {playerHoleCards && playerHoleCards.map((card, i) => (
                      <div key={i} className="transform transition-transform hover:-translate-y-6 duration-300 shadow-2xl">
                        <PlayingCard card={card} />
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex-1 w-full md:w-auto min-w-[280px]">
                    {hasActiveHand && isMyTurn && actions ? (
                      <div className="grid grid-cols-2 gap-3">
                        {actions.canFold && (
                          <button
                            onClick={() => handleAction("fold")}
                            disabled={loading}
                            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm transition-colors border border-slate-700"
                          >
                            FOLD
                          </button>
                        )}
                        {actions.canCheck && (
                          <button
                            onClick={() => handleAction("check")}
                            disabled={loading}
                            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm transition-colors border border-slate-700"
                          >
                            CHECK
                          </button>
                        )}
                        {actions.canCall && (
                          <button
                            onClick={() => handleAction("call")}
                            disabled={loading}
                            className="col-span-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-indigo-900/20"
                          >
                            CALL ${actions.callAmount}
                          </button>
                        )}
                        {actions.canRaise && (
                          <button
                            onClick={() => handleAction("raise", actions.minRaise)}
                            disabled={loading}
                            className="col-span-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-emerald-900/20"
                          >
                            RAISE TO ${actions.minRaise}
                          </button>
                        )}
                        {actions.canAllIn && (
                          <button
                            onClick={() => handleAction("all_in")}
                            disabled={loading}
                            className="col-span-2 px-4 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl font-bold text-sm transition-colors shadow-lg"
                          >
                            ALL IN
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-900/50 rounded-xl p-4 text-center border border-slate-800">
                        <div className="text-slate-500 text-sm font-medium flex items-center justify-center gap-2">
                          {playerBet > 0 ? (
                            <>Current Bet: <span className="text-white font-mono">${playerBet}</span></>
                          ) : (
                            <>Waiting for action...</>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
