"use client";

import { Card, getCardDisplay } from "@/lib/poker";

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  small?: boolean;
}

export default function PlayingCard({ card, faceDown = false, small = false }: PlayingCardProps) {
  if (!card || faceDown) {
    return (
      <div
        className={`${
          small ? "w-12 h-16" : "w-16 h-24"
        } bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg border-2 border-gray-300 shadow-lg flex items-center justify-center`}
      >
        <div className="text-white text-2xl opacity-30">🂠</div>
      </div>
    );
  }

  const { symbol, color, displayRank } = getCardDisplay(card);

  return (
    <div
      className={`${
        small ? "w-12 h-16" : "w-16 h-24"
      } bg-white rounded-lg border-2 border-gray-300 shadow-lg p-1 flex flex-col justify-between`}
    >
      <div className={`${color} font-bold ${small ? "text-xs" : "text-sm"}`}>
        <div>{displayRank}</div>
        <div className="text-lg leading-none">{symbol}</div>
      </div>
      <div className={`${color} font-bold ${small ? "text-xs" : "text-sm"} text-right rotate-180`}>
        <div>{displayRank}</div>
        <div className="text-lg leading-none">{symbol}</div>
      </div>
    </div>
  );
}
