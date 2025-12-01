import { useState, useEffect, useRef, useCallback } from "react";

// Types
export type SymbolType = "BUFFALO" | "EAGLE" | "WOLF" | "COUGAR" | "DEER" | "SUNSET" | "COIN" | "A" | "K" | "Q" | "J" | "10" | "9";

export const SYMBOLS: SymbolType[] = ["BUFFALO", "EAGLE", "WOLF", "COUGAR", "DEER", "SUNSET", "COIN", "A", "K", "Q", "J", "10", "9"];

export const SYMBOL_MAP: Record<SymbolType, string> = {
  BUFFALO: "🦬", // Will be replaced by image
  EAGLE: "🦅",
  WOLF: "🐺",
  COUGAR: "🐆",
  DEER: "🦌",
  SUNSET: "🌅", // Wild
  COIN: "💰",   // Scatter
  A: "A",
  K: "K",
  Q: "Q",
  J: "J",
  10: "10",
  9: "9",
};

// Payout multipliers (per winning way)
const SYMBOL_VALUES: Record<SymbolType, number[]> = {
  BUFFALO: [0, 10, 50, 100, 300], // 2, 3, 4, 5
  EAGLE:   [0, 0, 50, 100, 150],
  COUGAR:  [0, 0, 50, 100, 150],
  WOLF:    [0, 0, 20, 80, 120],
  DEER:    [0, 0, 20, 80, 120],
  A:       [0, 0, 10, 50, 100],
  K:       [0, 0, 10, 50, 100],
  Q:       [0, 0, 5, 20, 100],
  J:       [0, 0, 5, 20, 100],
  10:      [0, 0, 5, 10, 100],
  9:       [0, 2, 5, 10, 100],
  SUNSET:  [0, 0, 0, 0, 0],
  COIN:    [0, 0, 2, 10, 20], // Multiplies total bet
};

export interface WinningLine {
  symbol: SymbolType;
  positions: Array<{ reel: number; row: number }>;
  amount: number;
  multiplier?: number;
}

export interface GameState {
  credits: number;
  bet: number;
  spinning: boolean;
  winAmount: number;
  message: string;
  freeSpins: number;
  winningLines: WinningLine[];
  reels: SymbolType[][];
  berffaloImage: string | null; // Data URL for the custom image
}

export const useBuffaloGame = () => {
  const [credits, setCredits] = useState(1000);
  const [bet, setBet] = useState(40); // Standard bet step
  const [spinning, setSpinning] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [message, setMessage] = useState("");
  const [freeSpins, setFreeSpins] = useState(0);
  const [winningLines, setWinningLines] = useState<WinningLine[]>([]);
  const [reels, setReels] = useState<SymbolType[][]>([]);
  const [berffaloImage, setBerffaloImage] = useState<string | null>(null);
  const [wildMultipliers, setWildMultipliers] = useState<number[][]>([]); // To track multipliers for each position

  // Initialize reels
  useEffect(() => {
    const initialReels = Array(5).fill(null).map(() =>
      Array(4).fill(null).map(() => getRandomSymbol())
    );
    setReels(initialReels);
    
    // Load image from local storage
    const savedImage = localStorage.getItem("berffaloImage");
    if (savedImage) setBerffaloImage(savedImage);
  }, []);

  const saveBerffaloImage = (image: string) => {
    setBerffaloImage(image);
    localStorage.setItem("berffaloImage", image);
  };

  const getRandomSymbol = (reelIdx = 0): SymbolType => {
    // Weighted probabilities
    const rand = Math.random();
    
    // Wilds only on reels 2, 3, 4 (indices 1, 2, 3)
    if (reelIdx >= 1 && reelIdx <= 3) {
      if (Math.random() < 0.05) return "SUNSET";
    }
    
    // Scatters
    if (Math.random() < 0.02) return "COIN";

    if (rand < 0.45) return ["9", "10", "J", "Q"].map(s => s as SymbolType)[Math.floor(Math.random() * 4)];
    if (rand < 0.75) return ["K", "A"].map(s => s as SymbolType)[Math.floor(Math.random() * 2)];
    if (rand < 0.90) return ["DEER", "WOLF"].map(s => s as SymbolType)[Math.floor(Math.random() * 2)];
    if (rand < 0.96) return ["COUGAR", "EAGLE"].map(s => s as SymbolType)[Math.floor(Math.random() * 2)];
    return "BUFFALO";
  };

  const spin = useCallback(async () => {
    if (spinning) return;
    if (credits < bet && freeSpins === 0) {
      setMessage("Not enough credits!");
      return;
    }

    setSpinning(true);
    setWinAmount(0);
    setWinningLines([]);
    setMessage("");

    if (freeSpins === 0) {
      setCredits(prev => prev - bet);
    } else {
      setFreeSpins(prev => prev - 1);
    }

    // Generate results
    const newReels: SymbolType[][] = [];
    const newMultipliers: number[][] = Array(5).fill(null).map(() => Array(4).fill(1));

    for (let i = 0; i < 5; i++) {
      const reel: SymbolType[] = [];
      for (let j = 0; j < 4; j++) {
        const symbol = getRandomSymbol(i);
        reel.push(symbol);
        
        // Generate wild multipliers for Free Spins (2x or 3x)
        if (symbol === "SUNSET" && freeSpins > 0) {
          newMultipliers[i][j] = Math.random() < 0.5 ? 2 : 3;
        }
      }
      newReels.push(reel);
    }

    // Simulate delay for animation hook
    // We return the promise so the UI can await it
    return new Promise<{ reels: SymbolType[][], multipliers: number[][] }>((resolve) => {
      setTimeout(() => {
        setReels(newReels);
        setWildMultipliers(newMultipliers);
        setSpinning(false);
        checkWins(newReels, newMultipliers);
        resolve({ reels: newReels, multipliers: newMultipliers });
      }, 2000); // UI handles the visual reel stopping, this is the logical end
    });
  }, [credits, bet, freeSpins, spinning]);

  const checkWins = (currentReels: SymbolType[][], multipliers: number[][]) => {
    let totalWin = 0;
    const lines: WinningLine[] = [];

    // 1. Check Scatters (Left to Right not required, just count)
    // Actually Buffalo scatters usually pay anywhere
    let scatterCount = 0;
    const scatterPositions: { reel: number; row: number }[] = [];
    
    currentReels.forEach((reel, rIdx) => {
      reel.forEach((sym, rowIdx) => {
        if (sym === "COIN") {
          scatterCount++;
          scatterPositions.push({ reel: rIdx, row: rowIdx });
        }
      });
    });

    if (scatterCount >= 3) {
      // Free spins trigger
      const spinsWon = scatterCount === 3 ? 8 : scatterCount === 4 ? 15 : 20;
      setFreeSpins(prev => prev + spinsWon);
      setMessage(`WON ${spinsWon} FREE SPINS!`);
      
      const scatterPay = bet * (SYMBOL_VALUES["COIN"][scatterCount - 1] || 0);
      totalWin += scatterPay;
      lines.push({ symbol: "COIN", positions: scatterPositions, amount: scatterPay });
    }

    // 2. Check Way Wins (Left to Right)
    const uniqueSymbols = new Set<SymbolType>(SYMBOLS.filter(s => s !== "SUNSET" && s !== "COIN"));
    
    uniqueSymbols.forEach(targetSym => {
      // Find consecutive reels containing symbol OR wild
      let consecutiveReels = 0;
      const reelsWithSymbol: number[][] = []; // stores row indices for each reel

      for (let i = 0; i < 5; i++) {
        const matchingRows: number[] = [];
        currentReels[i].forEach((s, rowIdx) => {
          if (s === targetSym || (s === "SUNSET" && i > 0 && i < 4)) { // Wilds only on 2,3,4
            matchingRows.push(rowIdx);
          }
        });

        if (matchingRows.length > 0) {
          reelsWithSymbol.push(matchingRows);
          consecutiveReels++;
        } else {
          break; // Stop at first missing reel
        }
      }

      // Check minimum length
      const minLength = (targetSym === "BUFFALO" || targetSym === "9") ? 2 : 3;
      
      if (consecutiveReels >= minLength) {
        // Calculate ways
        let ways = 1;
        let totalMultiplier = 1;
        const positions: { reel: number; row: number }[] = [];

        // For visualization, we just take all matching positions
        for (let i = 0; i < consecutiveReels; i++) {
          ways *= reelsWithSymbol[i].length;
          reelsWithSymbol[i].forEach(rowIdx => {
            positions.push({ reel: i, row: rowIdx });
            // If it's a wild, apply its multiplier (during free spins)
            if (currentReels[i][rowIdx] === "SUNSET") {
               // In Buffalo, wild multipliers MULTIPLY together (e.g., 2x * 3x = 6x)
               totalMultiplier *= multipliers[i][rowIdx];
            }
          });
        }

        const basePay = SYMBOL_VALUES[targetSym][consecutiveReels - 1] || 0;
        // The bet per way concept is tricky in Xtra Reel Power. 
        // Usually 40 credits covers all 1024 ways. 
        // So we calculate win based on bet multiplier.
        // Let's assume bet is 40 units. 1 unit = bet / 40.
        const unitBet = bet / 40;
        const win = basePay * unitBet * ways * totalMultiplier;

        if (win > 0) {
          totalWin += win;
          lines.push({ 
            symbol: targetSym, 
            positions, 
            amount: win,
            multiplier: totalMultiplier > 1 ? totalMultiplier : undefined
          });
        }
      }
    });

    if (totalWin > 0) {
      setWinAmount(Math.floor(totalWin));
      setCredits(prev => prev + Math.floor(totalWin));
      setWinningLines(lines);
    }
  };

  return {
    credits,
    bet,
    setBet,
    spinning,
    spin,
    winAmount,
    message,
    freeSpins,
    winningLines,
    reels,
    berffaloImage,
    saveBerffaloImage,
    wildMultipliers
  };
};



