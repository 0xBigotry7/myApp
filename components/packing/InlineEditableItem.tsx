"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Check, 
  Circle, 
  GripVertical, 
  Trash2, 
  Copy, 
  MoreHorizontal,
  ChevronDown,
  User,
  Users,
  X,
  AlertCircle
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getTranslations, type Locale } from "@/lib/i18n";

interface PackingItem {
  id: string;
  category: string;
  name: string;
  quantity: number;
  weight: number | null;
  isPacked: boolean;
  notes: string | null;
  belongsTo: string;
  colorCode: string | null;
  importance: string;
}

interface InlineEditableItemProps {
  item: PackingItem;
  onToggle: () => void;
  onUpdate: (updates: Partial<PackingItem>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove?: (luggageId: string | null) => void;
  luggages?: { id: string; name: string }[];
  locale: Locale;
  compact?: boolean;
}

export default function InlineEditableItem({
  item,
  onToggle,
  onUpdate,
  onDelete,
  onDuplicate,
  onMove,
  luggages = [],
  locale,
  compact = false,
}: InlineEditableItemProps) {
  const t = getTranslations(locale);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editQuantity, setEditQuantity] = useState(item.quantity);
  const [showMenu, setShowMenu] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowMoveMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSave = () => {
    if (editName.trim() && (editName !== item.name || editQuantity !== item.quantity)) {
      onUpdate({ name: editName.trim(), quantity: editQuantity });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditName(item.name);
      setEditQuantity(item.quantity);
      setIsEditing(false);
    }
  };

  const getOwnerStyle = () => {
    if (item.belongsTo === "baber") return "bg-pink-50 border-pink-100";
    if (item.belongsTo === "BABER") return "bg-blue-50 border-blue-100";
    return "bg-white border-zinc-100";
  };

  const getOwnerBadgeStyle = () => {
    if (item.belongsTo === "baber") return "bg-pink-100 text-pink-700";
    if (item.belongsTo === "BABER") return "bg-blue-100 text-blue-700";
    return "bg-zinc-100 text-zinc-600";
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border transition-all ${
        item.isPacked
          ? "bg-zinc-50/80 border-zinc-100/50 opacity-60"
          : getOwnerStyle()
      } ${isDragging ? "shadow-lg ring-2 ring-zinc-900" : "hover:shadow-sm"}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="text-zinc-300 hover:text-zinc-500 cursor-grab active:cursor-grabbing shrink-0 touch-none"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Checkbox */}
      <button 
        onClick={onToggle} 
        className="shrink-0 transition-transform active:scale-90 touch-manipulation"
      >
        {item.isPacked ? (
          <Check className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
        ) : (
          <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-300 hover:text-zinc-400" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="flex-1 px-2 py-1 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
            />
            <div className="flex items-center border border-zinc-200 rounded-lg">
              <button
                type="button"
                onClick={() => setEditQuantity(Math.max(1, editQuantity - 1))}
                className="px-2 py-1 text-zinc-500 hover:bg-zinc-100 rounded-l-lg"
              >
                −
              </button>
              <span className="px-2 text-sm font-medium text-zinc-700">{editQuantity}</span>
              <button
                type="button"
                onClick={() => setEditQuantity(editQuantity + 1)}
                className="px-2 py-1 text-zinc-500 hover:bg-zinc-100 rounded-r-lg"
              >
                +
              </button>
            </div>
            <button
              onClick={handleSave}
              className="p-1 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setEditName(item.name);
                setEditQuantity(item.quantity);
                setIsEditing(false);
              }}
              className="p-1 text-zinc-500 hover:bg-zinc-100 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full text-left group/name"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-sm font-medium transition-colors ${
                  item.isPacked 
                    ? "text-zinc-400 line-through" 
                    : "text-zinc-900 group-hover/name:text-zinc-600"
                }`}
              >
                {item.name}
              </span>
              
              {item.quantity > 1 && (
                <span className="text-xs font-bold text-zinc-500 bg-zinc-100/80 px-1.5 py-0.5 rounded-md">
                  ×{item.quantity}
                </span>
              )}

              {item.importance === "essential" && (
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              )}
            </div>

            {/* Tags Row */}
            {!compact && (
              <div className="flex items-center gap-1.5 mt-1">
                {item.belongsTo !== "shared" && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide ${getOwnerBadgeStyle()}`}>
                    {item.belongsTo === "baber" ? t.baber : t.BABER}
                  </span>
                )}
              </div>
            )}
          </button>
        )}
      </div>

      {/* Quick Actions - Always visible on mobile, hover on desktop */}
      {!isEditing && (
        <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" ref={menuRef}>
          {/* Quick duplicate */}
          <button
            onClick={onDuplicate}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors hidden sm:block"
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 py-1 w-44 overflow-hidden">
                {/* Owner toggle */}
                <div className="px-3 py-2 border-b border-zinc-100">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Owner
                  </div>
                  <div className="flex gap-1">
                    {[
                      { value: "shared", label: "Shared", icon: Users, style: "bg-zinc-100 text-zinc-700" },
                      { value: "baber", label: t.baber, icon: User, style: "bg-pink-100 text-pink-700" },
                      { value: "BABER", label: t.BABER, icon: User, style: "bg-blue-100 text-blue-700" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          onUpdate({ belongsTo: opt.value });
                          setShowMenu(false);
                        }}
                        className={`flex-1 p-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                          item.belongsTo === opt.value 
                            ? opt.style 
                            : "bg-zinc-50 text-zinc-400 hover:bg-zinc-100"
                        }`}
                      >
                        {opt.value === "shared" ? "All" : opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Importance toggle */}
                <div className="px-3 py-2 border-b border-zinc-100">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Importance
                  </div>
                  <div className="flex gap-1">
                    {[
                      { value: "essential", label: "Essential", style: "bg-red-100 text-red-700" },
                      { value: "normal", label: "Normal", style: "bg-zinc-100 text-zinc-700" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          onUpdate({ importance: opt.value });
                          setShowMenu(false);
                        }}
                        className={`flex-1 p-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                          item.importance === opt.value 
                            ? opt.style 
                            : "bg-zinc-50 text-zinc-400 hover:bg-zinc-100"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Move to luggage */}
                {onMove && luggages.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMoveMenu(!showMoveMenu)}
                      className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 flex items-center justify-between"
                    >
                      Move to...
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMoveMenu ? "rotate-180" : ""}`} />
                    </button>
                    
                    {showMoveMenu && (
                      <div className="border-t border-zinc-100 max-h-32 overflow-y-auto">
                        <button
                          onClick={() => {
                            onMove(null);
                            setShowMenu(false);
                            setShowMoveMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-50"
                        >
                          📦 Unorganized
                        </button>
                        {luggages.map((l) => (
                          <button
                            key={l.id}
                            onClick={() => {
                              onMove(l.id);
                              setShowMenu(false);
                              setShowMoveMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-50"
                          >
                            🧳 {l.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Duplicate (mobile) */}
                <button
                  onClick={() => {
                    onDuplicate();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 sm:hidden"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Duplicate
                </button>

                {/* Delete */}
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

