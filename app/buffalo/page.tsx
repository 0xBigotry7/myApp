"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const SYMBOLS = ["🦬", "🦅", "🐺", "🐆", "🦌", "🌅", "💰", "A", "K", "Q", "J", "10", "9"];

// Authentic Buffalo slot machine payouts (coins per symbol count)
const SYMBOL_VALUES: Record<string, number[]> = {
  "🦬": [0, 50, 200, 250, 300],     // Buffalo: 2, 3, 4, 5 symbols
  "🦅": [0, 20, 80, 200, 250],      // Eagle: 2, 3, 4, 5
  "🐆": [0, 20, 80, 200, 250],      // Puma: 2, 3, 4, 5
  "🐺": [0, 10, 40, 100, 150],      // Wolf: 2, 3, 4, 5
  "🦌": [0, 10, 40, 100, 150],      // Deer: 2, 3, 4, 5
  "A": [0, 0, 10, 60, 140],         // Ace: 3, 4, 5 only
  "K": [0, 0, 10, 60, 140],         // King: 3, 4, 5 only
  "Q": [0, 0, 5, 40, 120],          // Queen: 3, 4, 5 only
  "J": [0, 0, 5, 40, 120],          // Jack: 3, 4, 5 only
  "10": [0, 0, 5, 40, 120],         // 10: 3, 4, 5 only
  "9": [0, 0, 5, 40, 120],          // 9: 3, 4, 5 only
};

interface WinningLine {
  symbol: string;
  positions: Array<{ reel: number; row: number }>;
  amount: number;
}

export default function BuffaloSlotPage() {
  const [credits, setCredits] = useState(1000);
  const [bet, setBet] = useState(40);
  const [spinning, setSpinning] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [message, setMessage] = useState("");
  const [freeSpins, setFreeSpins] = useState(0);
  const [winningLines, setWinningLines] = useState<WinningLine[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  const reelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [finalSymbols, setFinalSymbols] = useState<string[][]>([]);

  useEffect(() => {
    // Initialize with random symbols
    setFinalSymbols(
      Array(5).fill(null).map(() =>
        Array(4).fill(null).map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
      )
    );
  }, []);

  // Cycle through winning lines
  useEffect(() => {
    if (winningLines.length === 0) return;

    const interval = setInterval(() => {
      setCurrentLineIndex((prev) => (prev + 1) % winningLines.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [winningLines]);

  const spin = async () => {
    if (spinning) return;
    if (credits < bet && freeSpins === 0) {
      setMessage("⚠️ Not enough credits!");
      setTimeout(() => setMessage(""), 2000);
      return;
    }

    setSpinning(true);
    setMessage("");
    setWinAmount(0);
    setWinningLines([]);
    setCurrentLineIndex(0);

    if (freeSpins === 0) {
      setCredits(credits - bet);
    } else {
      setFreeSpins(freeSpins - 1);
    }

    // Generate final result
    const results: string[][] = Array(5).fill(null).map((_, reelIdx) =>
      Array(4).fill(null).map(() => {
        // Wild only on reels 2, 3, 4
        if (reelIdx >= 1 && reelIdx <= 3 && Math.random() < 0.08) return "🌅";
        // Scatter
        if (Math.random() < 0.06) return "💰";
        // Regular symbols
        return SYMBOLS[Math.floor(Math.random() * (SYMBOLS.length - 2))];
      })
    );

    // Start all reels spinning
    reelRefs.current.forEach((reel, index) => {
      if (!reel) return;
      const symbols = reel.querySelectorAll(".symbol");
      symbols.forEach((symbol) => {
        (symbol as HTMLElement).classList.add("spinning");
      });
    });

    // Stop each reel with delay
    for (let i = 0; i < 5; i++) {
      await new Promise((resolve) => setTimeout(resolve, 400 + i * 200));

      const reel = reelRefs.current[i];
      if (reel) {
        const symbols = reel.querySelectorAll(".symbol");
        symbols.forEach((symbol) => {
          (symbol as HTMLElement).classList.remove("spinning");
        });
      }

      // Update this reel's final symbols
      setFinalSymbols((prev) => {
        const newSymbols = [...prev];
        newSymbols[i] = results[i];
        return newSymbols;
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
    setSpinning(false);

    // Check wins
    checkWins(results);
  };

  const checkWins = (results: string[][]) => {
    let totalWin = 0;
    const allIndividualLines: WinningLine[] = [];

    // Check scatters first (scatters pay anywhere)
    const scatterPositions: Array<{ reel: number; row: number }> = [];
    results.forEach((reel, reelIdx) => {
      reel.forEach((symbol, rowIdx) => {
        if (symbol === "💰") {
          scatterPositions.push({ reel: reelIdx, row: rowIdx });
        }
      });
    });

    // Scatter payouts and free spins
    if (scatterPositions.length >= 3) {
      const bonusSpins = scatterPositions.length === 3 ? 8 : scatterPositions.length === 4 ? 15 : 20;
      setFreeSpins((prev) => prev + bonusSpins);
      setMessage(`🎉 ${bonusSpins} FREE SPINS! 🎉`);

      // Scatter pays: 800x for 5, scale down for less
      const scatterPay = scatterPositions.length === 5 ? bet * 8 :
                         scatterPositions.length === 4 ? bet * 3 :
                         bet * 2;
      totalWin += scatterPay;

      allIndividualLines.push({
        symbol: "💰",
        positions: scatterPositions,
        amount: scatterPay,
      });
    }

    // Buffalo 1024 Ways to Win logic:
    // Generate ALL individual winning paths (not grouped)
    // Each path is ONE symbol from each consecutive reel

    // Get all unique symbols present (excluding scatter)
    const uniqueSymbols = new Set<string>();
    results.forEach((reel) => {
      reel.forEach((symbol) => {
        if (symbol !== "💰") {
          uniqueSymbols.add(symbol);
        }
      });
    });

    // For each symbol, generate ALL individual winning paths
    uniqueSymbols.forEach((targetSymbol) => {
      if (targetSymbol === "🌅") return; // Wild doesn't pay on its own

      // Find all positions of this symbol or wild on each reel
      const symbolsPerReel: number[][] = [];
      for (let reelIdx = 0; reelIdx < 5; reelIdx++) {
        const matchingRows: number[] = [];
        results[reelIdx].forEach((symbol, rowIdx) => {
          if (symbol === targetSymbol || symbol === "🌅") {
            matchingRows.push(rowIdx);
          }
        });
        symbolsPerReel.push(matchingRows);
      }

      // Check how many consecutive reels from the left have this symbol
      let consecutiveReels = 0;
      for (let reelIdx = 0; reelIdx < 5; reelIdx++) {
        if (symbolsPerReel[reelIdx].length > 0) {
          consecutiveReels++;
        } else {
          break;
        }
      }

      // Need at least 3 (or 2 for high-paying symbols) consecutive reels for a win
      const minReels = ["🦬", "🦅", "🐆", "🐺", "🦌"].includes(targetSymbol) ? 2 : 3;

      if (consecutiveReels >= minReels) {
        // Get payout value for this symbol and reel count
        const payoutArray = SYMBOL_VALUES[targetSymbol] || [0, 0, 0, 0, 0];
        const coinPayout = payoutArray[consecutiveReels] || 0;

        if (coinPayout > 0) {
          // Generate ALL individual paths (cartesian product)
          // For example: if reel 0 has [0,2], reel 1 has [1,3], reel 2 has [0]
          // This creates 2×2×1 = 4 individual paths
          const paths = generateAllPaths(symbolsPerReel, consecutiveReels);

          // Each individual path gets equal share of the total payout
          const totalWays = paths.length;
          const totalWinForSymbol = Math.floor((coinPayout * totalWays * bet) / 40);
          const payoutPerPath = Math.floor(totalWinForSymbol / totalWays);

          totalWin += totalWinForSymbol;

          // Add each individual path as a separate line
          paths.forEach((path) => {
            allIndividualLines.push({
              symbol: targetSymbol,
              positions: path,
              amount: payoutPerPath,
            });
          });
        }
      }
    });

    // Apply results
    if (totalWin > 0) {
      setWinAmount(Math.floor(totalWin));
      setCredits((prev) => prev + Math.floor(totalWin));
      setWinningLines(allIndividualLines);

      if (scatterPositions.length < 3) {
        setMessage(`💰 WIN: $${Math.floor(totalWin)}! 💰`);
      }
    }
  };

  // Helper function to generate all possible paths (cartesian product)
  const generateAllPaths = (
    symbolsPerReel: number[][],
    consecutiveReels: number
  ): Array<Array<{ reel: number; row: number }>> => {
    const paths: Array<Array<{ reel: number; row: number }>> = [];

    const generatePath = (reelIdx: number, currentPath: Array<{ reel: number; row: number }>) => {
      if (reelIdx === consecutiveReels) {
        paths.push([...currentPath]);
        return;
      }

      symbolsPerReel[reelIdx].forEach((rowIdx) => {
        currentPath.push({ reel: reelIdx, row: rowIdx });
        generatePath(reelIdx + 1, currentPath);
        currentPath.pop();
      });
    };

    generatePath(0, []);
    return paths;
  };

  // Check if a position is in the current winning line
  const isInWinningLine = (reelIdx: number, rowIdx: number): boolean => {
    if (winningLines.length === 0) return false;
    const currentLine = winningLines[currentLineIndex];
    return currentLine.positions.some((pos) => pos.reel === reelIdx && pos.row === rowIdx);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 via-amber-800 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated buffalo silhouettes */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute text-9xl animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
            }}
          >
            🦬
          </div>
        ))}
      </div>

      <Link href="/" className="absolute top-4 left-4 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white font-bold rounded-lg shadow-lg z-50">
        ← Back
      </Link>

      <div className="relative z-10 w-full max-w-7xl">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 drop-shadow-[0_0_40px_rgba(251,191,36,1)] animate-glow mb-3">
            🦬 BUFFALO 🦬
          </h1>
          <p className="text-4xl font-black text-yellow-300 tracking-widest drop-shadow-lg">
            XTRA REEL POWER™ • 1024 WAYS
          </p>
        </div>

        {/* Slot Machine */}
        <div className="bg-gradient-to-b from-yellow-600 via-amber-700 to-amber-900 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] p-8 border-[16px] border-yellow-500">
          {/* Credits Bar */}
          <div className="bg-black rounded-2xl p-6 mb-6 grid grid-cols-3 gap-6 border-4 border-yellow-600">
            <div className="text-center">
              <div className="text-yellow-400 text-xl font-black mb-2">CREDITS</div>
              <div className="text-6xl font-black text-white">{credits}</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-400 text-xl font-black mb-2">BET</div>
              <div className="text-6xl font-black text-white">{bet}</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-400 text-xl font-black mb-2">FREE SPINS</div>
              <div className="text-6xl font-black text-green-400 animate-pulse">{freeSpins}</div>
            </div>
          </div>

          {/* Reels */}
          <div className="bg-gradient-to-b from-gray-900 via-black to-gray-900 rounded-3xl p-6 mb-6 border-8 border-amber-900 relative overflow-visible">
            {winAmount > 0 && (
              <div className="absolute inset-0 bg-yellow-400/20 animate-flash z-10 pointer-events-none rounded-2xl" />
            )}

            <div className="grid grid-cols-5 gap-4 relative">
              {finalSymbols.map((reel, reelIdx) => (
                <div
                  key={reelIdx}
                  ref={(el) => {
                    reelRefs.current[reelIdx] = el;
                  }}
                  className="bg-gradient-to-b from-amber-950 to-black rounded-2xl overflow-hidden relative"
                  style={{ height: "540px" }}
                >
                  {reel.map((symbol, rowIdx) => {
                    const isWinning = isInWinningLine(reelIdx, rowIdx);

                    return (
                      <div
                        key={rowIdx}
                        className="symbol flex items-center justify-center border-y-2 border-amber-800/50 relative"
                        style={{ height: "135px" }}
                      >
                        {/* Winning highlight glow */}
                        {isWinning && (
                          <div className="absolute inset-0 bg-yellow-400/40 animate-winning-glow z-0 rounded-lg" />
                        )}

                        <div
                          className={`
                            rounded-2xl flex items-center justify-center w-full h-full transition-all duration-200 relative z-10
                            ${symbol === "🌅" ? "bg-gradient-to-br from-orange-600 via-red-600 to-orange-700 shadow-[0_0_30px_rgba(234,88,12,0.8)]" : ""}
                            ${symbol === "💰" ? "bg-gradient-to-br from-yellow-500 via-yellow-400 to-yellow-600 shadow-[0_0_30px_rgba(234,179,8,0.8)] animate-pulse" : ""}
                            ${!["🌅", "💰"].includes(symbol) ? "bg-gradient-to-br from-amber-200 to-amber-300" : ""}
                            ${isWinning ? "scale-110 shadow-[0_0_40px_rgba(251,191,36,1)]" : ""}
                          `}
                        >
                          <span
                            className={`
                              ${["🦬", "🦅", "🐺", "🐆", "🦌", "🌅", "💰"].includes(symbol) ? "text-8xl" : "text-7xl font-black text-amber-900"}
                              drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]
                              ${isWinning ? "animate-bounce-subtle" : ""}
                            `}
                          >
                            {symbol}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Winning Line Connections */}
              {winningLines.length > 0 && (
                <svg
                  className="absolute inset-0 pointer-events-none z-20"
                  style={{ width: "100%", height: "100%" }}
                >
                  <defs>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {winningLines[currentLineIndex]?.positions.map((pos, idx) => {
                    if (idx === 0) return null;

                    const prevPos = winningLines[currentLineIndex].positions[idx - 1];
                    const reelWidth = 100 / 5; // 20% per reel
                    const rowHeight = 135; // pixels per row

                    const x1 = (prevPos.reel + 0.5) * reelWidth;
                    const y1 = prevPos.row * rowHeight + 67.5;
                    const x2 = (pos.reel + 0.5) * reelWidth;
                    const y2 = pos.row * rowHeight + 67.5;

                    return (
                      <g key={`${pos.reel}-${pos.row}`}>
                        <line
                          x1={`${x1}%`}
                          y1={y1}
                          x2={`${x2}%`}
                          y2={y2}
                          stroke="rgba(251, 191, 36, 0.9)"
                          strokeWidth="8"
                          filter="url(#glow)"
                          className="animate-line-pulse"
                        />
                        <line
                          x1={`${x1}%`}
                          y1={y1}
                          x2={`${x2}%`}
                          y2={y2}
                          stroke="rgba(255, 255, 255, 0.6)"
                          strokeWidth="3"
                          className="animate-line-pulse"
                        />
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>

            {/* Winning line info */}
            {winningLines.length > 0 && (
              <div className="mt-4 text-center">
                <div className="inline-block bg-black/80 px-6 py-3 rounded-xl border-2 border-yellow-500">
                  <p className="text-yellow-400 font-black text-xl">
                    {winningLines[currentLineIndex].symbol} x {
                      // Count consecutive reels from left
                      (() => {
                        const reels = new Set(winningLines[currentLineIndex].positions.map(p => p.reel));
                        let consecutive = 0;
                        for (let i = 0; i < 5; i++) {
                          if (reels.has(i)) consecutive++;
                          else break;
                        }
                        return consecutive;
                      })()
                    } = ${winningLines[currentLineIndex].amount}
                  </p>
                  <p className="text-white text-sm mt-1">
                    Win {currentLineIndex + 1} of {winningLines.length}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Win Message */}
          {message && (
            <div className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 rounded-2xl p-6 mb-6 text-center border-4 border-yellow-500 shadow-2xl animate-bounce-slow">
              <p className="text-5xl font-black text-amber-900">{message}</p>
              {winAmount > 0 && (
                <p className="text-7xl font-black text-green-700 mt-3 animate-pulse">
                  +${winAmount}
                </p>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-black/80 rounded-2xl p-6 border-4 border-yellow-600">
              <p className="text-yellow-400 text-2xl font-black mb-4 text-center">BET</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setBet(Math.max(10, bet - 10))}
                  disabled={spinning}
                  className="bg-gradient-to-b from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 disabled:from-gray-700 disabled:to-gray-900 text-white font-black text-3xl py-6 rounded-xl shadow-xl transform hover:scale-105 active:scale-95 transition-all"
                >
                  −10
                </button>
                <button
                  onClick={() => setBet(Math.min(200, bet + 10))}
                  disabled={spinning}
                  className="bg-gradient-to-b from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 disabled:from-gray-700 disabled:to-gray-900 text-white font-black text-3xl py-6 rounded-xl shadow-xl transform hover:scale-105 active:scale-95 transition-all"
                >
                  +10
                </button>
              </div>
            </div>

            <button
              onClick={spin}
              disabled={spinning || (credits < bet && freeSpins === 0)}
              className={`
                bg-gradient-to-b from-green-400 via-green-600 to-green-800
                hover:from-green-500 hover:via-green-700 hover:to-green-900
                disabled:from-gray-700 disabled:via-gray-800 disabled:to-gray-900
                text-white font-black text-6xl py-12 rounded-2xl
                shadow-2xl border-8 border-green-600
                hover:border-green-500 disabled:border-gray-700
                transform hover:scale-105 active:scale-95 transition-all
                disabled:cursor-not-allowed
                ${spinning ? "animate-pulse-fast" : ""}
              `}
            >
              {spinning ? "SPINNING..." : freeSpins > 0 ? "FREE SPIN" : "SPIN"}
            </button>
          </div>
        </div>

        {/* Add Credits Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => setCredits(1000)}
            className="px-10 py-5 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-black text-2xl rounded-xl shadow-2xl transform hover:scale-105 transition-all border-4 border-purple-500"
          >
            🎁 ADD 1000 CREDITS
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-blur {
          0% {
            transform: translateY(0);
            filter: blur(0px);
          }
          5% {
            filter: blur(4px);
          }
          95% {
            filter: blur(4px);
          }
          100% {
            transform: translateY(-200%);
            filter: blur(0px);
          }
        }

        @keyframes glow {
          0%, 100% {
            text-shadow: 0 0 20px rgba(251, 191, 36, 0.8),
                         0 0 40px rgba(251, 191, 36, 0.5);
          }
          50% {
            text-shadow: 0 0 30px rgba(251, 191, 36, 1),
                         0 0 60px rgba(251, 191, 36, 0.8),
                         0 0 80px rgba(251, 191, 36, 0.5);
          }
        }

        @keyframes flash {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(20px, -20px) rotate(5deg); }
          66% { transform: translate(-20px, 20px) rotate(-5deg); }
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes bounce-subtle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes pulse-fast {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.98); }
        }

        @keyframes winning-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(251, 191, 36, 0.8);
            opacity: 0.3;
          }
          50% {
            box-shadow: 0 0 40px rgba(251, 191, 36, 1);
            opacity: 0.6;
          }
        }

        @keyframes line-pulse {
          0%, 100% {
            opacity: 0.8;
            stroke-width: 8;
          }
          50% {
            opacity: 1;
            stroke-width: 10;
          }
        }

        .symbol.spinning {
          animation: spin-blur 0.05s linear infinite;
        }

        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }

        .animate-flash {
          animation: flash 0.5s ease-in-out infinite;
        }

        .animate-float {
          animation: float 8s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 1s ease-in-out infinite;
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 0.6s ease-in-out infinite;
        }

        .animate-pulse-fast {
          animation: pulse-fast 0.5s ease-in-out infinite;
        }

        .animate-winning-glow {
          animation: winning-glow 0.8s ease-in-out infinite;
        }

        .animate-line-pulse {
          animation: line-pulse 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
