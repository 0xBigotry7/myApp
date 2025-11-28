"use client";

import { Card, getCardDisplay } from "@/lib/poker";

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  small?: boolean;
  className?: string;
}

export default function PlayingCard({ card, faceDown = false, small = false, className = "" }: PlayingCardProps) {
  const width = small ? "w-14" : "w-24";
  const height = small ? "h-20" : "h-36";
  const textSize = small ? "text-sm" : "text-2xl";
  const iconSize = small ? "text-base" : "text-3xl";
  const centerIconSize = small ? "text-2xl" : "text-6xl";

  if (!card || faceDown) {
    return (
      <div
        className={`${width} ${height} ${className} relative bg-gradient-to-br from-indigo-900 to-blue-900 rounded-xl border-2 border-indigo-300/20 shadow-xl flex items-center justify-center overflow-hidden transform transition-transform`}
      >
        {/* Card Back Pattern */}
        <div className="absolute inset-1 border border-indigo-400/30 rounded-lg" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-400 to-transparent" />
        <div className="absolute inset-0 flex flex-wrap justify-center items-center gap-1 opacity-10 p-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="text-indigo-300 text-xs">♦</div>
          ))}
        </div>
        <div className="relative z-10 w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-400/30">
          <div className="text-indigo-200 text-sm">♠</div>
        </div>
      </div>
    );
  }

  const { symbol, color, displayRank } = getCardDisplay(card);
  const isRed = color.includes("red");
  const suitColor = isRed ? "text-rose-600" : "text-slate-900";

  return (
    <div
      className={`${width} ${height} ${className} bg-white rounded-xl shadow-xl flex flex-col justify-between p-1.5 relative overflow-hidden transform transition-transform hover:scale-105`}
    >
      {/* Top Corner */}
      <div className={`flex flex-col items-center ${suitColor} leading-none`}>
        <div className={`font-bold font-mono ${textSize}`}>{displayRank}</div>
        <div className={iconSize}>{symbol}</div>
      </div>

      {/* Center Suit */}
      <div className={`absolute inset-0 flex items-center justify-center ${suitColor} opacity-20`}>
        <div className={centerIconSize}>{symbol}</div>
      </div>

      {/* Bottom Corner (Rotated) */}
      <div className={`flex flex-col items-center ${suitColor} leading-none rotate-180`}>
        <div className={`font-bold font-mono ${textSize}`}>{displayRank}</div>
        <div className={iconSize}>{symbol}</div>
      </div>
    </div>
  );
}
