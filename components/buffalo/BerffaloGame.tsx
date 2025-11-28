import React, { useState, useRef } from "react";
import { useBuffaloGame } from "@/hooks/buffalo/useBuffaloGame";
import { ReelStrip } from "./ReelStrip";
import Link from "next/link";

export const BerffaloGame = () => {
  const {
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
  } = useBuffaloGame();

  const [showSetup, setShowSetup] = useState(!berffaloImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        saveBerffaloImage(reader.result as string);
        setShowSetup(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const currentWinningPositions = (reelIdx: number) => {
    const positions = new Set<number>();
    // If not spinning, collect all winning positions for this reel
    if (!spinning && winningLines.length > 0) {
        winningLines.forEach(line => {
            line.positions.forEach(pos => {
                if (pos.reel === reelIdx) positions.add(pos.row);
            });
        });
    }
    return positions;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-amber-900 to-black text-amber-100 font-sans p-2 sm:p-4 select-none overflow-hidden relative">
       {/* Background Effects */}
       <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('/bg-pattern.png')] bg-repeat" />
       
       {/* Header */}
       <div className="relative z-10 flex flex-col items-center mb-4 sm:mb-8">
         <div className="w-full max-w-7xl flex justify-between items-center mb-2">
            <Link href="/" className="px-3 py-1 bg-amber-950/50 hover:bg-amber-800 rounded text-sm border border-amber-700">
                ← Exit
            </Link>
            <button 
                onClick={() => setShowSetup(true)}
                className="px-3 py-1 bg-amber-950/50 hover:bg-amber-800 rounded text-sm border border-amber-700"
            >
                ⚙️ Setup
            </button>
         </div>
         
         <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-600 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] tracking-tighter">
            BERFFALO
         </h1>
         <p className="text-yellow-400 font-bold tracking-[0.2em] text-xs sm:text-base">
            GRAND WIFE EDITION • 1024 WAYS
         </p>
       </div>

       {/* Game Container */}
       <div className="max-w-7xl mx-auto relative z-10">
         {/* Main Slot Area */}
         <div className="bg-gradient-to-b from-amber-700 to-amber-900 p-2 sm:p-4 rounded-xl shadow-2xl border-4 border-yellow-600 relative">
            
            {/* Message Bar */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none w-full text-center">
                {message && (
                    <div className="inline-block bg-black/80 backdrop-blur-md px-8 py-4 rounded-2xl border-2 border-yellow-400 animate-bounce shadow-[0_0_30px_rgba(251,191,36,0.6)]">
                        <span className="text-2xl sm:text-4xl font-black text-yellow-300">{message}</span>
                        {winAmount > 0 && (
                            <div className="text-4xl sm:text-6xl font-black text-green-400 mt-1">
                                +{winAmount}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Reels Container */}
            <div className="flex gap-1 sm:gap-2 bg-black/80 p-1 sm:p-2 rounded-lg border border-amber-900/50 relative">
                {/* Paylines Canvas could go here */}
                {reels.map((column, i) => (
                    <ReelStrip 
                        key={i} 
                        reelIndex={i} 
                        symbols={column} 
                        spinning={spinning} 
                        berffaloImage={berffaloImage}
                        winningPositions={currentWinningPositions(i)}
                        wildMultipliers={wildMultipliers[i]}
                    />
                ))}
            </div>

            {/* Controls Bar */}
            <div className="mt-4 bg-black/60 rounded-lg p-2 sm:p-4 border-t-2 border-yellow-600 flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Info Panel */}
                <div className="flex gap-4 sm:gap-8 w-full sm:w-auto justify-center">
                    <div className="text-center">
                        <div className="text-amber-400 text-xs font-bold uppercase">Credits</div>
                        <div className="text-2xl sm:text-3xl font-mono font-bold text-white">{credits}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-amber-400 text-xs font-bold uppercase">Bet</div>
                        <div className="text-2xl sm:text-3xl font-mono font-bold text-white">{bet}</div>
                    </div>
                     <div className="text-center">
                        <div className="text-amber-400 text-xs font-bold uppercase">Win</div>
                        <div className="text-2xl sm:text-3xl font-mono font-bold text-green-400">{winAmount}</div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center">
                    <div className="flex flex-col gap-1">
                        <button 
                            disabled={spinning}
                            onClick={() => setBet(Math.min(200, bet + 10))}
                            className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-3 py-1 rounded text-sm font-bold"
                        >
                            + Bet
                        </button>
                         <button 
                            disabled={spinning}
                            onClick={() => setBet(Math.max(10, bet - 10))}
                            className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-3 py-1 rounded text-sm font-bold"
                        >
                            - Bet
                        </button>
                    </div>

                    <button
                        onClick={spin}
                        disabled={spinning || (credits < bet && freeSpins === 0)}
                        className={`
                            px-8 py-4 sm:px-12 sm:py-6 rounded-xl font-black text-xl sm:text-3xl shadow-xl transition-all transform active:scale-95
                            ${freeSpins > 0 
                                ? "bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-blue-500/50 animate-pulse" 
                                : "bg-gradient-to-b from-green-500 to-green-700 text-white shadow-green-500/50 hover:brightness-110"
                            }
                            disabled:grayscale disabled:cursor-not-allowed
                        `}
                    >
                        {spinning ? "..." : freeSpins > 0 ? `FREE SPIN (${freeSpins})` : "SPIN"}
                    </button>
                </div>
            </div>
         </div>
       </div>

       {/* Setup Modal */}
       {showSetup && (
         <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="bg-amber-900 border-4 border-yellow-500 rounded-2xl p-6 sm:p-10 max-w-lg w-full text-center relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-3xl font-black text-yellow-400 mb-4">SETUP BERFFALO</h2>
                    <p className="text-amber-100 mb-6 text-lg">
                        To activate the "Berffalo" edition, please upload a photo of your wife (or any photo) to replace the Buffalo symbol.
                    </p>
                    
                    <div className="mb-6">
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-32 h-32 sm:w-48 sm:h-48 mx-auto bg-black/50 border-2 border-dashed border-yellow-400/50 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/70 hover:border-yellow-400 transition-all overflow-hidden"
                        >
                            {berffaloImage ? (
                                <img src={berffaloImage} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl">📸</span>
                            )}
                        </div>
                        <p className="text-sm text-amber-300/70 mt-2">Tap to upload</p>
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageUpload}
                        />
                    </div>

                    <button 
                        onClick={() => setShowSetup(false)}
                        disabled={!berffaloImage}
                        className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black text-xl py-4 rounded-xl shadow-lg transition-transform active:scale-95"
                    >
                        START GAME
                    </button>
                    
                    <button 
                        onClick={() => setShowSetup(false)}
                        className="mt-4 text-amber-400 underline text-sm"
                    >
                        Play with Classic Buffalo
                    </button>
                </div>
            </div>
         </div>
       )}

        <style jsx global>{`
            @keyframes spin-blur {
                0% { filter: blur(0); transform: translateY(0); }
                50% { filter: blur(4px); transform: translateY(-20px); }
                100% { filter: blur(0); transform: translateY(0); }
            }
            .animate-spin-blur {
                animation: spin-blur 0.1s linear infinite;
            }
        `}</style>
    </div>
  );
};

