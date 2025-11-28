import React from "react";
import { SymbolType } from "@/hooks/buffalo/useBuffaloGame";

interface SymbolCardProps {
  symbol: SymbolType;
  customImage: string | null;
  isWinning?: boolean;
  multiplier?: number;
}

export const SymbolCard: React.FC<SymbolCardProps> = ({ symbol, customImage, isWinning, multiplier }) => {
  const isBerffalo = symbol === "BUFFALO";
  const isWild = symbol === "SUNSET";
  
  return (
    <div
      className={`
        w-full h-full flex items-center justify-center relative rounded-lg overflow-hidden
        transition-transform duration-200
        ${isWinning ? "scale-110 z-10" : "scale-100"}
        ${isWild ? "bg-gradient-to-b from-orange-400 to-red-600" : "bg-white/90"}
        border-2 border-amber-900/20
      `}
    >
      {isWinning && (
        <div className="absolute inset-0 bg-yellow-400/30 animate-pulse z-0" />
      )}
      
      <div className="relative z-10 flex flex-col items-center justify-center">
        {isBerffalo && customImage ? (
          <img 
            src={customImage} 
            alt="Berffalo" 
            className="w-full h-full object-cover absolute inset-0"
          />
        ) : (
          <span className="text-4xl sm:text-6xl select-none">
            {getSymbolEmoji(symbol)}
          </span>
        )}
        
        {/* Wild Multiplier Badge */}
        {isWild && multiplier && multiplier > 1 && (
          <div className="absolute -top-2 -right-2 bg-red-600 text-white font-black text-xs sm:text-sm rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
            {multiplier}x
          </div>
        )}
      </div>
      
      {/* Symbol Name Label (for Berffalo) */}
      {isBerffalo && (
        <div className="absolute bottom-0 w-full bg-black/60 text-white text-[10px] sm:text-xs font-bold text-center py-0.5 uppercase tracking-wider truncate px-1">
          {customImage ? "BERFFALO" : "BUFFALO"}
        </div>
      )}
    </div>
  );
};

function getSymbolEmoji(symbol: SymbolType): string {
  switch (symbol) {
    case "BUFFALO": return "🦬";
    case "EAGLE": return "🦅";
    case "WOLF": return "🐺";
    case "COUGAR": return "🐆";
    case "DEER": return "🦌";
    case "SUNSET": return "🌅";
    case "COIN": return "💰";
    default: return symbol;
  }
}

