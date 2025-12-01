import React, { useRef, useEffect } from "react";
import { SymbolType } from "@/hooks/buffalo/useBuffaloGame";
import { SymbolCard } from "./SymbolCard";

interface ReelStripProps {
  symbols: SymbolType[];
  reelIndex: number;
  spinning: boolean;
  berffaloImage: string | null;
  winningPositions: Set<number>; // Set of row indices
  wildMultipliers: number[];
}

export const ReelStrip: React.FC<ReelStripProps> = ({ 
  symbols, 
  reelIndex, 
  spinning, 
  berffaloImage,
  winningPositions,
  wildMultipliers
}) => {
  const reelRef = useRef<HTMLDivElement>(null);

  // Animation effect for spinning
  useEffect(() => {
    if (spinning && reelRef.current) {
      // Add blur effect and vertical movement simulation via CSS class
      reelRef.current.classList.add("animate-spin-blur");
    } else if (reelRef.current) {
      reelRef.current.classList.remove("animate-spin-blur");
      
      // Stop animation staggered by reel index
      // The logical state handles the data, this is just visual sync
    }
  }, [spinning, reelIndex]);

  return (
    <div className="flex-1 bg-black/40 border-x border-amber-900/50 relative overflow-hidden h-[300px] sm:h-[400px] md:h-[500px]">
      <div 
        ref={reelRef}
        className={`flex flex-col h-full transition-transform duration-500 ease-out`}
        style={{
          transform: spinning ? `translateY(0)` : `translateY(0)` // Placeholder for actual sliding animation if we had strip
        }}
      >
        {symbols.map((symbol, rowIdx) => (
          <div 
            key={`${reelIndex}-${rowIdx}`} 
            className="flex-1 p-1 sm:p-2 border-b border-amber-900/30"
            style={{ height: "25%" }}
          >
            <SymbolCard 
              symbol={symbol} 
              customImage={berffaloImage} 
              isWinning={winningPositions.has(rowIdx)}
              multiplier={wildMultipliers[rowIdx]}
            />
          </div>
        ))}
      </div>
      
      {/* Spinning Blur Overlay */}
      {spinning && (
        <div 
          className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20 backdrop-blur-[2px] z-20"
          style={{ animationDelay: `${reelIndex * 0.1}s` }}
        />
      )}
    </div>
  );
};



