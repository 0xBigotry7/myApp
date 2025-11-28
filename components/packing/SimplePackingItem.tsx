"use client";

import { useState, useRef, useEffect } from "react";
import { Check, X, Trash2, ChevronRight, AlertCircle, Minus, Plus } from "lucide-react";

interface PackingItem {
  id: string;
  category: string;
  name: string;
  quantity: number;
  isPacked: boolean;
  belongsTo: string;
  importance: string;
}

interface SimplePackingItemProps {
  item: PackingItem;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<PackingItem>) => void;
}

export default function SimplePackingItem({
  item,
  onToggle,
  onDelete,
  onUpdate,
}: SimplePackingItemProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.name);
  const [editQuantity, setEditQuantity] = useState(item.quantity);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 50;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Handle touch events for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const currentTouch = e.targetTouches[0].clientX;
    const diff = touchStart - currentTouch;
    
    // Only allow left swipe (negative offset means swiping right, which we don't want)
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 120)); // Cap at 120px
    }
    setTouchEnd(currentTouch);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    
    if (distance > minSwipeDistance) {
      // Swiped left enough - show actions
      setShowActions(true);
      setSwipeOffset(100);
    } else {
      // Not enough swipe - reset
      setShowActions(false);
      setSwipeOffset(0);
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Click outside to close swipe
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (itemRef.current && !itemRef.current.contains(e.target as Node)) {
        setShowActions(false);
        setSwipeOffset(0);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSave = () => {
    if (editValue.trim() && (editValue !== item.name || editQuantity !== item.quantity)) {
      onUpdate({ name: editValue.trim(), quantity: editQuantity });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(item.name);
      setEditQuantity(item.quantity);
      setIsEditing(false);
    }
  };

  const getOwnerColor = () => {
    if (item.belongsTo === "baber") return "border-l-pink-400";
    if (item.belongsTo === "BABER") return "border-l-blue-400";
    return "border-l-transparent";
  };

  return (
    <div 
      ref={itemRef}
      className="relative overflow-hidden rounded-xl"
    >
      {/* Background actions (revealed on swipe) */}
      <div className="absolute inset-y-0 right-0 flex items-stretch">
        <button
          onClick={() => {
            onToggle();
            setShowActions(false);
            setSwipeOffset(0);
          }}
          className={`w-[50px] flex items-center justify-center transition-colors ${
            item.isPacked 
              ? "bg-amber-500 hover:bg-amber-600" 
              : "bg-emerald-500 hover:bg-emerald-600"
          }`}
        >
          {item.isPacked ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <Check className="w-5 h-5 text-white" />
          )}
        </button>
        <button
          onClick={() => {
            onDelete();
            setShowActions(false);
            setSwipeOffset(0);
          }}
          className="w-[50px] bg-red-500 hover:bg-red-600 flex items-center justify-center"
        >
          <Trash2 className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Main item content */}
      <div
        className={`relative bg-white dark:bg-zinc-900 border-l-4 ${getOwnerColor()} transition-transform duration-200 ease-out`}
        style={{ transform: `translateX(-${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={`flex items-center gap-3 p-3 sm:p-4 ${
          item.isPacked ? "bg-zinc-50 dark:bg-zinc-800/50" : "bg-white dark:bg-zinc-900"
        }`}>
          {/* Big tap target for toggle */}
          <button
            onClick={onToggle}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
              item.isPacked
                ? "bg-emerald-500 border-emerald-500"
                : "border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500"
            }`}
          >
            {item.isPacked && <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={3} />}
          </button>

          {/* Item content */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 px-2 py-1.5 text-sm border-2 border-zinc-900 dark:border-white rounded-lg focus:outline-none bg-white dark:bg-zinc-800 dark:text-white min-w-0"
                />
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditQuantity(Math.max(1, editQuantity - 1))}
                    className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-l-lg"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold dark:text-white">{editQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setEditQuantity(editQuantity + 1)}
                    className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-r-lg"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={handleSave}
                  className="p-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditValue(item.name);
                  setEditQuantity(item.quantity);
                  setIsEditing(true);
                }}
                className="w-full text-left group"
              >
                <div className="flex items-center gap-2">
                  <span className={`text-sm sm:text-base font-medium truncate ${
                    item.isPacked ? "text-zinc-400 dark:text-zinc-500 line-through" : "text-zinc-900 dark:text-white"
                  }`}>
                    {item.name}
                  </span>
                  {item.quantity > 1 && (
                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded shrink-0">
                      ×{item.quantity}
                    </span>
                  )}
                  {item.importance === "essential" && (
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  )}
                </div>
              </button>
            )}
          </div>

          {/* Desktop actions */}
          {!isEditing && (
            <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={onToggle}
                className={`p-2 rounded-lg transition-colors ${
                  item.isPacked 
                    ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20" 
                    : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                }`}
              >
                {item.isPacked ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              </button>
              <button
                onClick={onDelete}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Swipe indicator on mobile */}
          {!showActions && !isEditing && (
            <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 sm:hidden shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
}

