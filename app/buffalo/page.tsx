"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const SYMBOLS = ["🦬", "🦅", "🐺", "🐆", "🦌", "🌅", "💰", "A", "K", "Q", "J", "10", "9"];

// RTP (Return to Player) - Controls game difficulty and balance
// Lower = harder to win (more house edge), Higher = easier to win (less house edge)
// Casino typical: 85-96%
// Recommended settings:
//   0.75 = Very hard (25% house edge) - Quick losses, rare big wins
//   0.80 = Hard (20% house edge) - Challenging gameplay
//   0.85 = Medium (15% house edge) - Balanced challenge
//   0.90 = Easy (10% house edge) - Frequent small wins
const RTP = 0.75;

// Payout multipliers (per winning way, not total)
// These are VERY small because 1024 ways can create hundreds of simultaneous wins
// Format: [2 symbols, 3 symbols, 4 symbols, 5 symbols]
const SYMBOL_VALUES: Record<string, number[]> = {
  "🦬": [0, 0.02, 0.05, 0.10, 0.25], // Buffalo: 2, 3, 4, 5 symbols
  "🦅": [0, 0.01, 0.03, 0.07, 0.15], // Eagle: 2, 3, 4, 5
  "🐆": [0, 0.01, 0.03, 0.07, 0.15], // Puma: 2, 3, 4, 5
  "🐺": [0, 0.008, 0.02, 0.05, 0.12], // Wolf: 2, 3, 4, 5
  "🦌": [0, 0.008, 0.02, 0.05, 0.12], // Deer: 2, 3, 4, 5
  "A": [0, 0, 0.01, 0.03, 0.08],     // Ace: 3, 4, 5 only
  "K": [0, 0, 0.01, 0.03, 0.08],     // King: 3, 4, 5 only
  "Q": [0, 0, 0.008, 0.02, 0.06],    // Queen: 3, 4, 5 only
  "J": [0, 0, 0.008, 0.02, 0.06],    // Jack: 3, 4, 5 only
  "10": [0, 0, 0.008, 0.02, 0.06],   // 10: 3, 4, 5 only
  "9": [0, 0, 0.008, 0.02, 0.06],    // 9: 3, 4, 5 only
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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const reelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [finalSymbols, setFinalSymbols] = useState<string[][]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize Audio Context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Create background music (looping ambient casino sound)
    backgroundMusicRef.current = new Audio();
    backgroundMusicRef.current.loop = true;
    backgroundMusicRef.current.volume = 0.3;

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
      }
    };
  }, []);

  // Control background music
  useEffect(() => {
    if (backgroundMusicRef.current) {
      if (musicEnabled) {
        // Generate simple background music using oscillators
        playBackgroundMusic();
      } else {
        backgroundMusicRef.current.pause();
      }
    }
  }, [musicEnabled]);

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
      setCurrentLineIndex((prev) => {
        playSound('click', 0.3);
        return (prev + 1) % winningLines.length;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [winningLines]);

  // Sound Effects using Web Audio API
  const playSound = (type: string, volume = 0.5) => {
    if (!soundEnabled || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    switch (type) {
      case 'spin':
        // Reel spinning sound - mechanical whoosh
        for (let i = 0; i < 5; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(100 + i * 20, now);
          osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);

          gain.gain.setValueAtTime(volume * 0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

          osc.start(now + i * 0.05);
          osc.stop(now + 0.3 + i * 0.05);
        }
        break;

      case 'reelStop':
        // Reel stop sound - thud
        const stopOsc = ctx.createOscillator();
        const stopGain = ctx.createGain();
        stopOsc.connect(stopGain);
        stopGain.connect(ctx.destination);

        stopOsc.type = 'sine';
        stopOsc.frequency.setValueAtTime(80, now);
        stopOsc.frequency.exponentialRampToValueAtTime(40, now + 0.1);

        stopGain.gain.setValueAtTime(volume, now);
        stopGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        stopOsc.start(now);
        stopOsc.stop(now + 0.1);
        break;

      case 'win':
        // Win sound - ascending chimes
        for (let i = 0; i < 8; i++) {
          const winOsc = ctx.createOscillator();
          const winGain = ctx.createGain();
          winOsc.connect(winGain);
          winGain.connect(ctx.destination);

          winOsc.type = 'sine';
          winOsc.frequency.setValueAtTime(400 + i * 100, now + i * 0.05);

          winGain.gain.setValueAtTime(volume * 0.4, now + i * 0.05);
          winGain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.3);

          winOsc.start(now + i * 0.05);
          winOsc.stop(now + i * 0.05 + 0.3);
        }
        break;

      case 'bigWin':
        // Big win sound - triumphant fanfare
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.15);

          gain.gain.setValueAtTime(volume * 0.5, now + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.4);

          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 0.4);
        });
        break;

      case 'scatter':
        // Scatter bonus sound - magical sparkle
        for (let i = 0; i < 12; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(1000 + Math.random() * 1000, now + i * 0.03);

          gain.gain.setValueAtTime(volume * 0.2, now + i * 0.03);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.03 + 0.2);

          osc.start(now + i * 0.03);
          osc.stop(now + i * 0.03 + 0.2);
        }
        break;

      case 'click':
        // Button click sound
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.connect(clickGain);
        clickGain.connect(ctx.destination);

        clickOsc.type = 'square';
        clickOsc.frequency.setValueAtTime(800, now);

        clickGain.gain.setValueAtTime(volume * 0.2, now);
        clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        clickOsc.start(now);
        clickOsc.stop(now + 0.05);
        break;

      case 'coins':
        // Coin sound - metallic clinks
        for (let i = 0; i < 15; i++) {
          const coinOsc = ctx.createOscillator();
          const coinGain = ctx.createGain();
          coinOsc.connect(coinGain);
          coinGain.connect(ctx.destination);

          coinOsc.type = 'square';
          coinOsc.frequency.setValueAtTime(800 + Math.random() * 400, now + i * 0.02);

          coinGain.gain.setValueAtTime(volume * 0.15, now + i * 0.02);
          coinGain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.02 + 0.1);

          coinOsc.start(now + i * 0.02);
          coinOsc.stop(now + i * 0.02 + 0.1);
        }
        break;
    }
  };

  // Vibration (haptic feedback)
  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  // Background music
  const playBackgroundMusic = () => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const playMelody = () => {
      const notes = [262, 294, 330, 349, 392]; // C, D, E, F, G
      let time = ctx.currentTime;

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.05, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.8);

        osc.start(time);
        osc.stop(time + 0.8);

        time += 0.5;
      });

      // Schedule next iteration
      setTimeout(playMelody, 3000);
    };

    if (musicEnabled) {
      playMelody();
    }
  };

  const spin = async () => {
    if (spinning) return;
    if (credits < bet && freeSpins === 0) {
      setMessage("⚠️ Not enough credits!");
      setTimeout(() => setMessage(""), 2000);
      return;
    }

    playSound('spin');
    vibrate(50);

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
        // Wild only on reels 2, 3, 4 - RARE (2% chance)
        if (reelIdx >= 1 && reelIdx <= 3 && Math.random() < 0.02) return "🌅";
        // Scatter - VERY RARE (1.5% chance)
        if (Math.random() < 0.015) return "💰";
        // Regular symbols - weighted towards low-paying cards
        // SYMBOLS = ["🦬", "🦅", "🐺", "🐆", "🦌", "🌅", "💰", "A", "K", "Q", "J", "10", "9"]
        // Indices:    0     1     2     3     4     5     6     7    8    9    10   11   12
        const rand = Math.random();
        if (rand < 0.5) {
          // 50% chance: low cards (9, 10, J, Q, K, A)
          return SYMBOLS[7 + Math.floor(Math.random() * 6)]; // Indices 7-12
        } else if (rand < 0.75) {
          // 25% chance: medium animals (Wolf, Deer)
          return SYMBOLS[2 + Math.floor(Math.random() * 3)]; // Indices 2-4 (🐺, 🐆, 🦌)
        } else if (rand < 0.92) {
          // 17% chance: high animals (Eagle)
          return SYMBOLS[1]; // 🦅
        } else {
          // 8% chance: Buffalo
          return SYMBOLS[0]; // 🦬
        }
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

      // Play stop sound and vibrate for each reel
      playSound('reelStop', 0.4);
      vibrate(100);
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
      playSound('scatter');
      vibrate([200, 100, 200]);
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 3000);

      // Reduce free spins - they're very powerful
      const bonusSpins = scatterPositions.length === 3 ? 5 : scatterPositions.length === 4 ? 10 : 15;
      setFreeSpins((prev) => prev + bonusSpins);
      setMessage(`🎉 ${bonusSpins} FREE SPINS! 🎉`);

      // Scatter pays (very small immediate payout, main value is free spins)
      const scatterMultiplier = scatterPositions.length === 5 ? 1.0 :
                                scatterPositions.length === 4 ? 0.5 :
                                0.25;
      const scatterPay = Math.floor(bet * scatterMultiplier * RTP);
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

          // Calculate payout
          // coinPayout is a small multiplier per way (e.g., 0.30x bet)
          // Multiply by total ways, then apply RTP
          const totalWays = paths.length;
          const baseWinPerWay = coinPayout * bet;
          const totalBaseWin = baseWinPerWay * totalWays;
          const totalWinForSymbol = Math.floor(totalBaseWin * RTP);
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

      // Play win sounds based on win amount
      if (totalWin >= bet * 5) {
        playSound('bigWin');
        vibrate([200, 100, 200, 100, 200]);
        setShowParticles(true);
        setTimeout(() => setShowParticles(false), 3000);
      } else {
        playSound('win');
        vibrate([100, 50, 100]);
      }

      // Coin sound for credits update
      setTimeout(() => playSound('coins'), 300);

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
    <div className="min-h-screen bg-gradient-to-b from-amber-900 via-amber-800 to-black flex items-center justify-center p-2 sm:p-4 relative overflow-hidden">
      {/* Animated buffalo silhouettes */}
      <div className="absolute inset-0 opacity-5 pointer-events-none hidden sm:block">
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

      {/* Particle Effects for Big Wins */}
      {showParticles && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute text-4xl sm:text-5xl md:text-6xl animate-coin-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random()}s`,
              }}
            >
              💰
            </div>
          ))}
          {[...Array(30)].map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute text-3xl sm:text-4xl animate-sparkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.3}s`,
              }}
            >
              ✨
            </div>
          ))}
        </div>
      )}

      <Link href="/" className="absolute top-2 left-2 sm:top-4 sm:left-4 px-3 py-1.5 sm:px-4 sm:py-2 bg-amber-700 hover:bg-amber-600 text-white text-sm sm:text-base font-bold rounded-lg shadow-lg z-50">
        ← Back
      </Link>

      {/* Sound and Music Controls */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex gap-2 z-50">
        <button
          onClick={() => {
            playSound('click', 0.3);
            setSoundEnabled(!soundEnabled);
          }}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-amber-700 hover:bg-amber-600 text-white text-lg sm:text-2xl font-bold rounded-lg shadow-lg transition-all active:scale-95"
          title={soundEnabled ? "Sound On" : "Sound Off"}
        >
          {soundEnabled ? "🔊" : "🔇"}
        </button>
        <button
          onClick={() => {
            playSound('click', 0.3);
            setMusicEnabled(!musicEnabled);
            if (!musicEnabled) {
              playBackgroundMusic();
            }
          }}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-amber-700 hover:bg-amber-600 text-white text-lg sm:text-2xl font-bold rounded-lg shadow-lg transition-all active:scale-95"
          title={musicEnabled ? "Music On" : "Music Off"}
        >
          {musicEnabled ? "🎵" : "🎶"}
        </button>
      </div>

      <div className="relative z-10 w-full max-w-7xl">
        {/* Title */}
        <div className="text-center mb-3 sm:mb-6">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 drop-shadow-[0_0_40px_rgba(251,191,36,1)] animate-glow mb-2 sm:mb-3">
            🦬 BUFFALO 🦬
          </h1>
          <p className="text-sm sm:text-2xl md:text-4xl font-black text-yellow-300 tracking-widest drop-shadow-lg">
            XTRA REEL POWER™ • 1024 WAYS
          </p>
        </div>

        {/* Slot Machine */}
        <div className="bg-gradient-to-b from-yellow-600 via-amber-700 to-amber-900 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] p-3 sm:p-6 md:p-8 border-4 sm:border-8 md:border-[16px] border-yellow-500">
          {/* Credits Bar */}
          <div className="bg-black rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6 grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 border-2 sm:border-4 border-yellow-600">
            <div className="text-center">
              <div className="text-yellow-400 text-xs sm:text-sm md:text-xl font-black mb-1 sm:mb-2">CREDITS</div>
              <div className="text-2xl sm:text-4xl md:text-6xl font-black text-white">{credits}</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-400 text-xs sm:text-sm md:text-xl font-black mb-1 sm:mb-2">BET</div>
              <div className="text-2xl sm:text-4xl md:text-6xl font-black text-white">{bet}</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-400 text-xs sm:text-sm md:text-xl font-black mb-1 sm:mb-2">FREE SPINS</div>
              <div className="text-2xl sm:text-4xl md:text-6xl font-black text-green-400 animate-pulse">{freeSpins}</div>
            </div>
          </div>

          {/* Reels */}
          <div className="bg-gradient-to-b from-gray-900 via-black to-gray-900 rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6 border-4 sm:border-6 md:border-8 border-amber-900 relative overflow-visible">
            {winAmount > 0 && (
              <div className="absolute inset-0 bg-yellow-400/20 animate-flash z-10 pointer-events-none rounded-lg sm:rounded-xl md:rounded-2xl" />
            )}

            <div className="grid grid-cols-5 gap-1 sm:gap-2 md:gap-4 relative">
              {finalSymbols.map((reel, reelIdx) => (
                <div
                  key={reelIdx}
                  ref={(el) => {
                    reelRefs.current[reelIdx] = el;
                  }}
                  className="bg-gradient-to-b from-amber-950 to-black rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden relative h-[280px] sm:h-[400px] md:h-[500px] lg:h-[540px]"
                >
                  {reel.map((symbol, rowIdx) => {
                    const isWinning = isInWinningLine(reelIdx, rowIdx);

                    return (
                      <div
                        key={rowIdx}
                        className="symbol flex items-center justify-center border-y border-amber-800/50 relative h-[25%]"
                      >
                        {/* Winning highlight glow */}
                        {isWinning && (
                          <div className="absolute inset-0 bg-yellow-400/40 animate-winning-glow z-0 rounded-md sm:rounded-lg" />
                        )}

                        <div
                          className={`
                            rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center w-full h-full transition-all duration-200 relative z-10
                            ${symbol === "🌅" ? "bg-gradient-to-br from-orange-600 via-red-600 to-orange-700 shadow-[0_0_15px_rgba(234,88,12,0.8)] sm:shadow-[0_0_30px_rgba(234,88,12,0.8)]" : ""}
                            ${symbol === "💰" ? "bg-gradient-to-br from-yellow-500 via-yellow-400 to-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.8)] sm:shadow-[0_0_30px_rgba(234,179,8,0.8)] animate-pulse" : ""}
                            ${!["🌅", "💰"].includes(symbol) ? "bg-gradient-to-br from-amber-200 to-amber-300" : ""}
                            ${isWinning ? "scale-110 shadow-[0_0_20px_rgba(251,191,36,1)] sm:shadow-[0_0_40px_rgba(251,191,36,1)]" : ""}
                          `}
                        >
                          <span
                            className={`
                              ${["🦬", "🦅", "🐺", "🐆", "🦌", "🌅", "💰"].includes(symbol) ? "text-3xl sm:text-5xl md:text-7xl lg:text-8xl" : "text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-amber-900"}
                              drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] sm:drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]
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

                    // Calculate row height based on screen size (4 rows total)
                    // Mobile: 280px / 4 = 70px, Desktop: 540px / 4 = 135px
                    const containerHeight = isMobile ? 280 : 540;
                    const rowHeight = containerHeight / 4;

                    const x1 = (prevPos.reel + 0.5) * reelWidth;
                    const y1 = prevPos.row * rowHeight + rowHeight / 2;
                    const x2 = (pos.reel + 0.5) * reelWidth;
                    const y2 = pos.row * rowHeight + rowHeight / 2;

                    const strokeWidth = isMobile ? 4 : 8;
                    const innerStrokeWidth = isMobile ? 2 : 3;

                    return (
                      <g key={`${pos.reel}-${pos.row}`}>
                        <line
                          x1={`${x1}%`}
                          y1={y1}
                          x2={`${x2}%`}
                          y2={y2}
                          stroke="rgba(251, 191, 36, 0.9)"
                          strokeWidth={strokeWidth}
                          filter="url(#glow)"
                          className="animate-line-pulse"
                        />
                        <line
                          x1={`${x1}%`}
                          y1={y1}
                          x2={`${x2}%`}
                          y2={y2}
                          stroke="rgba(255, 255, 255, 0.6)"
                          strokeWidth={innerStrokeWidth}
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
              <div className="mt-2 sm:mt-4 text-center">
                <div className="inline-block bg-black/80 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl border-2 border-yellow-500">
                  <p className="text-yellow-400 font-black text-base sm:text-xl">
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
                  <p className="text-white text-xs sm:text-sm mt-1">
                    Win {currentLineIndex + 1} of {winningLines.length}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Win Message */}
          {message && (
            <div className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6 text-center border-2 sm:border-4 border-yellow-500 shadow-2xl animate-bounce-slow">
              <p className="text-2xl sm:text-4xl md:text-5xl font-black text-amber-900">{message}</p>
              {winAmount > 0 && (
                <p className="text-4xl sm:text-6xl md:text-7xl font-black text-green-700 mt-2 sm:mt-3 animate-pulse">
                  +${winAmount}
                </p>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 md:gap-6">
            {/* Bet Controls - Full width on mobile */}
            <div className="bg-black/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border-2 sm:border-4 border-yellow-600">
              <p className="text-yellow-400 text-sm sm:text-xl md:text-2xl font-black mb-2 sm:mb-3 md:mb-4 text-center">BET AMOUNT</p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                <button
                  onClick={() => {
                    playSound('click', 0.3);
                    vibrate(30);
                    setBet(Math.max(10, bet - 10));
                  }}
                  disabled={spinning}
                  className="bg-gradient-to-b from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 active:from-red-700 active:to-red-900 disabled:from-gray-700 disabled:to-gray-900 text-white font-black text-xl sm:text-2xl md:text-3xl py-4 sm:py-4 md:py-6 rounded-lg sm:rounded-xl shadow-xl transform active:scale-95 transition-all touch-manipulation"
                >
                  −10
                </button>
                <button
                  onClick={() => {
                    playSound('click', 0.3);
                    vibrate(30);
                    setBet(Math.min(200, bet + 10));
                  }}
                  disabled={spinning}
                  className="bg-gradient-to-b from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 active:from-green-700 active:to-green-900 disabled:from-gray-700 disabled:to-gray-900 text-white font-black text-xl sm:text-2xl md:text-3xl py-4 sm:py-4 md:py-6 rounded-lg sm:rounded-xl shadow-xl transform active:scale-95 transition-all touch-manipulation"
                >
                  +10
                </button>
              </div>
            </div>

            {/* Spin Button - Full width on mobile, larger touch target */}
            <button
              onClick={spin}
              disabled={spinning || (credits < bet && freeSpins === 0)}
              className={`
                bg-gradient-to-b from-green-400 via-green-600 to-green-800
                hover:from-green-500 hover:via-green-700 hover:to-green-900
                active:from-green-600 active:via-green-800 active:to-green-950
                disabled:from-gray-700 disabled:via-gray-800 disabled:to-gray-900
                text-white font-black text-2xl sm:text-5xl md:text-6xl py-6 sm:py-10 md:py-12
                rounded-xl sm:rounded-2xl
                shadow-2xl border-4 sm:border-6 md:border-8 border-green-600
                hover:border-green-500 disabled:border-gray-700
                transform active:scale-95 transition-all
                disabled:cursor-not-allowed
                touch-manipulation
                min-h-[80px] sm:min-h-0
                ${spinning ? "animate-pulse-fast" : ""}
              `}
            >
              {spinning ? "SPINNING..." : freeSpins > 0 ? "FREE SPIN" : "SPIN"}
            </button>
          </div>
        </div>

        {/* Add Credits Button */}
        <div className="text-center mt-3 sm:mt-4 md:mt-6">
          <button
            onClick={() => {
              playSound('coins');
              vibrate([50, 30, 50]);
              setCredits(1000);
            }}
            className="px-4 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-black text-base sm:text-xl md:text-2xl rounded-lg sm:rounded-xl shadow-2xl transform hover:scale-105 transition-all border-2 sm:border-4 border-purple-500 touch-manipulation active:scale-95"
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

        @keyframes coin-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0.3;
          }
        }

        @keyframes sparkle {
          0%, 100% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.5) rotate(180deg);
            opacity: 1;
          }
        }

        .animate-coin-fall {
          animation: coin-fall 2s ease-in forwards;
        }

        .animate-sparkle {
          animation: sparkle 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
