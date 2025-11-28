"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Users, Sparkles, ChevronUp, ChevronDown } from "lucide-react";
import { getTranslations, type Locale } from "@/lib/i18n";

interface FastAddProps {
  onAdd: (item: { 
    name: string; 
    category: string; 
    quantity: number; 
    belongsTo: string; 
    importance: string 
  }) => void;
  locale: Locale;
  placeholder?: string;
  luggageName?: string;
}

// Extensive item database with categories auto-detected
const ITEM_DATABASE: { name: string; category: string; aliases?: string[] }[] = [
  // Documents
  { name: "Passport", category: "documents", aliases: ["护照"] },
  { name: "ID Card", category: "documents", aliases: ["身份证", "id"] },
  { name: "Visa", category: "documents" },
  { name: "Travel Insurance", category: "documents" },
  { name: "Flight Tickets", category: "documents", aliases: ["boarding pass", "机票"] },
  { name: "Hotel Reservation", category: "documents", aliases: ["booking"] },
  { name: "Driver's License", category: "documents", aliases: ["驾照"] },
  { name: "Credit Cards", category: "documents", aliases: ["信用卡"] },
  { name: "Cash", category: "documents", aliases: ["现金", "money"] },
  
  // Electronics
  { name: "Phone", category: "electronics", aliases: ["手机", "iphone", "smartphone"] },
  { name: "Laptop", category: "electronics", aliases: ["电脑", "macbook", "computer"] },
  { name: "iPad", category: "electronics", aliases: ["tablet", "平板"] },
  { name: "Kindle", category: "electronics", aliases: ["e-reader"] },
  { name: "Camera", category: "electronics", aliases: ["相机"] },
  { name: "Headphones", category: "electronics", aliases: ["耳机", "earphones", "airpods"] },
  { name: "AirPods", category: "electronics" },
  { name: "Apple Watch", category: "electronics", aliases: ["smartwatch", "watch charger"] },
  { name: "Nintendo Switch", category: "electronics", aliases: ["游戏机", "switch"] },
  
  // Charging
  { name: "Phone Charger", category: "charging", aliases: ["充电器"] },
  { name: "Laptop Charger", category: "charging" },
  { name: "Apple Watch Charger", category: "charging" },
  { name: "Power Bank", category: "charging", aliases: ["充电宝", "portable charger"] },
  { name: "USB-C Cable", category: "charging", aliases: ["cable", "usb cable"] },
  { name: "Lightning Cable", category: "charging" },
  { name: "Travel Adapter", category: "charging", aliases: ["power adapter", "转换插头"] },
  { name: "Extension Cord", category: "charging", aliases: ["power strip"] },
  
  // Clothing
  { name: "T-Shirts", category: "clothing", aliases: ["tshirt", "t shirt", "短袖"] },
  { name: "Shirts", category: "clothing", aliases: ["衬衫"] },
  { name: "Pants", category: "clothing", aliases: ["裤子", "trousers", "jeans"] },
  { name: "Shorts", category: "clothing", aliases: ["短裤"] },
  { name: "Underwear", category: "clothing", aliases: ["内裤"] },
  { name: "Socks", category: "clothing", aliases: ["袜子"] },
  { name: "Jacket", category: "clothing", aliases: ["外套", "coat"] },
  { name: "Sweater", category: "clothing", aliases: ["毛衣", "hoodie"] },
  { name: "Dress", category: "clothing", aliases: ["裙子", "连衣裙"] },
  { name: "Skirt", category: "clothing", aliases: ["短裙"] },
  { name: "Pajamas", category: "clothing", aliases: ["睡衣", "pjs"] },
  { name: "Swimwear", category: "clothing", aliases: ["泳衣", "bikini", "swimming trunks"] },
  { name: "Workout Clothes", category: "clothing", aliases: ["gym clothes", "运动服"] },
  { name: "Belt", category: "clothing" },
  { name: "Tie", category: "clothing", aliases: ["领带"] },
  
  // Shoes
  { name: "Sneakers", category: "shoes", aliases: ["运动鞋", "trainers"] },
  { name: "Sandals", category: "shoes", aliases: ["凉鞋", "flip flops"] },
  { name: "Dress Shoes", category: "shoes", aliases: ["皮鞋", "formal shoes"] },
  { name: "Slippers", category: "shoes", aliases: ["拖鞋"] },
  { name: "Hiking Boots", category: "shoes", aliases: ["登山鞋"] },
  { name: "Rain Boots", category: "shoes" },
  
  // Toiletries
  { name: "Toothbrush", category: "toiletries", aliases: ["牙刷"] },
  { name: "Toothpaste", category: "toiletries", aliases: ["牙膏"] },
  { name: "Shampoo", category: "toiletries", aliases: ["洗发水"] },
  { name: "Conditioner", category: "toiletries", aliases: ["护发素"] },
  { name: "Body Wash", category: "toiletries", aliases: ["沐浴露", "shower gel"] },
  { name: "Deodorant", category: "toiletries" },
  { name: "Razor", category: "toiletries", aliases: ["剃须刀", "shaver"] },
  { name: "Sunscreen", category: "toiletries", aliases: ["防晒霜", "spf"] },
  { name: "Floss", category: "toiletries", aliases: ["dental floss", "牙线"] },
  { name: "Hairbrush", category: "toiletries", aliases: ["comb", "梳子"] },
  { name: "Hair Dryer", category: "toiletries", aliases: ["吹风机"] },
  { name: "Contact Lens", category: "toiletries", aliases: ["contacts", "隐形眼镜"] },
  { name: "Contact Solution", category: "toiletries" },
  
  // Cosmetics
  { name: "Moisturizer", category: "cosmetics", aliases: ["面霜", "lotion"] },
  { name: "Makeup", category: "cosmetics", aliases: ["化妆品"] },
  { name: "Lip Balm", category: "cosmetics", aliases: ["润唇膏"] },
  { name: "Lipstick", category: "cosmetics", aliases: ["口红"] },
  { name: "Foundation", category: "cosmetics", aliases: ["粉底"] },
  { name: "Mascara", category: "cosmetics" },
  { name: "Perfume", category: "cosmetics", aliases: ["香水", "cologne"] },
  { name: "Skincare", category: "cosmetics", aliases: ["护肤品"] },
  { name: "Face Wash", category: "cosmetics", aliases: ["洗面奶"] },
  { name: "Eye Cream", category: "cosmetics" },
  
  // Accessories
  { name: "Sunglasses", category: "accessories", aliases: ["太阳镜", "shades"] },
  { name: "Glasses", category: "accessories", aliases: ["眼镜"] },
  { name: "Watch", category: "accessories", aliases: ["手表"] },
  { name: "Jewelry", category: "accessories", aliases: ["首饰"] },
  { name: "Hat", category: "accessories", aliases: ["帽子", "cap"] },
  { name: "Umbrella", category: "accessories", aliases: ["雨伞"] },
  { name: "Scarf", category: "accessories", aliases: ["围巾"] },
  { name: "Gloves", category: "accessories", aliases: ["手套"] },
  { name: "Bag", category: "accessories", aliases: ["包", "purse"] },
  { name: "Backpack", category: "accessories", aliases: ["背包", "daypack"] },
  { name: "Wallet", category: "accessories", aliases: ["钱包"] },
  { name: "Keys", category: "accessories", aliases: ["钥匙"] },
  
  // Medications
  { name: "Pain Relief", category: "medications", aliases: ["tylenol", "ibuprofen", "止痛药"] },
  { name: "Vitamins", category: "medications", aliases: ["维生素"] },
  { name: "First Aid Kit", category: "medications" },
  { name: "Prescription Meds", category: "medications", aliases: ["处方药", "medication"] },
  { name: "Hand Sanitizer", category: "medications", aliases: ["洗手液"] },
  { name: "Band-Aids", category: "medications", aliases: ["创可贴", "bandages"] },
  { name: "Allergy Medicine", category: "medications", aliases: ["antihistamine", "过敏药"] },
  { name: "Motion Sickness Pills", category: "medications", aliases: ["dramamine", "晕车药"] },
  { name: "Melatonin", category: "medications", aliases: ["sleep aid", "褪黑素"] },
  
  // Other
  { name: "Book", category: "other", aliases: ["书", "reading"] },
  { name: "Snacks", category: "food", aliases: ["零食", "food"] },
  { name: "Water Bottle", category: "other", aliases: ["水杯", "bottle"] },
  { name: "Travel Pillow", category: "other", aliases: ["颈枕", "neck pillow"] },
  { name: "Eye Mask", category: "other", aliases: ["眼罩", "sleep mask"] },
  { name: "Earplugs", category: "other", aliases: ["耳塞"] },
  { name: "Towel", category: "other", aliases: ["毛巾"] },
  { name: "Laundry Bag", category: "other", aliases: ["脏衣袋"] },
  { name: "Packing Cubes", category: "other" },
  { name: "Luggage Lock", category: "other", aliases: ["行李锁"] },
  { name: "Luggage Tag", category: "other" },
];

export default function FastAdd({ onAdd, locale, placeholder, luggageName }: FastAddProps) {
  const t = getTranslations(locale);
  const [value, setValue] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedOwner, setSelectedOwner] = useState<"shared" | "baber" | "BABER">("shared");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Find matching items
  const getMatches = useCallback(() => {
    const searchTerm = value.toLowerCase().trim();
    if (!searchTerm) {
      // Show popular items when empty
      return ITEM_DATABASE.slice(0, 8);
    }
    
    return ITEM_DATABASE.filter(item => {
      if (item.name.toLowerCase().includes(searchTerm)) return true;
      if (item.aliases?.some(alias => alias.toLowerCase().includes(searchTerm))) return true;
      return false;
    }).slice(0, 8);
  }, [value]);

  const matches = getMatches();

  // Parse quantity from input (e.g., "3 t-shirts" or "socks x5")
  const parseInput = (input: string): { name: string; quantity: number } => {
    // Check for "3 items" pattern
    const prefixMatch = input.match(/^(\d+)\s+(.+)$/);
    if (prefixMatch) {
      return { name: prefixMatch[2], quantity: parseInt(prefixMatch[1]) };
    }
    
    // Check for "items x3" or "items ×3" pattern
    const suffixMatch = input.match(/^(.+?)\s*[x×](\d+)$/i);
    if (suffixMatch) {
      return { name: suffixMatch[1], quantity: parseInt(suffixMatch[2]) };
    }
    
    return { name: input, quantity: 1 };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    const { name, quantity: parsedQuantity } = parseInput(value.trim());
    const finalQuantity = parsedQuantity > 1 ? parsedQuantity : quantity;
    
    // Try to match with database for category
    const match = ITEM_DATABASE.find(
      item => item.name.toLowerCase() === name.toLowerCase() ||
              item.aliases?.some(alias => alias.toLowerCase() === name.toLowerCase())
    );

    onAdd({
      name: match?.name || name,
      category: match?.category || "other",
      quantity: finalQuantity,
      belongsTo: selectedOwner,
      importance: "normal",
    });

    setValue("");
    setQuantity(1);
    setSelectedIndex(0);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (item: typeof ITEM_DATABASE[0]) => {
    onAdd({
      name: item.name,
      category: item.category,
      quantity,
      belongsTo: selectedOwner,
      importance: "normal",
    });
    setValue("");
    setQuantity(1);
    setSelectedIndex(0);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Tab" && matches.length > 0 && showSuggestions) {
      e.preventDefault();
      setValue(matches[selectedIndex].name);
      setShowSuggestions(false);
    } else if (e.key === "Enter" && matches.length > 0 && showSuggestions && selectedIndex >= 0) {
      // If there's an exact match or user pressed enter with suggestion highlighted
      const exactMatch = matches.find(m => m.name.toLowerCase() === value.toLowerCase());
      if (exactMatch || value.length > 0) {
        e.preventDefault();
        if (!exactMatch && matches[selectedIndex]) {
          handleSuggestionClick(matches[selectedIndex]);
        }
      }
    }
  };

  // Reset selected index when matches change
  useEffect(() => {
    setSelectedIndex(0);
  }, [value]);

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 focus-within:border-zinc-900 dark:focus-within:border-white focus-within:shadow-lg transition-all">
          <Plus className="w-5 h-5 text-zinc-400 dark:text-zinc-500 shrink-0" />
          
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Add item... (press Enter)"}
            className="flex-1 outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 bg-transparent text-sm sm:text-base min-w-0"
          />

          {/* Quantity stepper */}
          <div className="flex items-center gap-0.5 border-l border-zinc-200 dark:border-zinc-700 pl-2 sm:pl-3 shrink-0">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors text-lg font-medium"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <span className="w-5 sm:w-6 text-center text-sm font-bold text-zinc-700 dark:text-zinc-200">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors text-lg font-medium"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          {/* Owner Toggle */}
          <div className="flex items-center gap-0.5 border-l border-zinc-200 dark:border-zinc-700 pl-2 sm:pl-3 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedOwner("shared")}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all ${
                selectedOwner === "shared" 
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" 
                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              }`}
              title="Shared"
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedOwner("baber")}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all text-xs sm:text-sm font-bold ${
                selectedOwner === "baber" 
                  ? "bg-pink-500 text-white" 
                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              }`}
              title={t.baber}
            >
              她
            </button>
            <button
              type="button"
              onClick={() => setSelectedOwner("BABER")}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all text-xs sm:text-sm font-bold ${
                selectedOwner === "BABER" 
                  ? "bg-blue-500 text-white" 
                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              }`}
              title={t.BABER}
            >
              他
            </button>
          </div>

          <button
            type="submit"
            disabled={!value.trim()}
            className="shrink-0 w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5 sm:hidden" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </form>

      {/* Smart Suggestions */}
      {showSuggestions && matches.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-xl z-30 overflow-hidden">
          <div className="p-2.5 border-b border-zinc-100 dark:border-zinc-700 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {value ? "Suggestions" : "Popular items"} • Tab to autocomplete
            </span>
          </div>
          <div className="p-2 max-h-64 overflow-y-auto">
            {matches.map((item, index) => (
              <button
                key={item.name}
                type="button"
                onClick={() => handleSuggestionClick(item)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
                  index === selectedIndex 
                    ? "bg-zinc-100 dark:bg-zinc-700" 
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                }`}
              >
                <span className="text-lg">
                  {getCategoryIcon(item.category)}
                </span>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">{item.name}</span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 capitalize ml-auto">{item.category}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    documents: "📄",
    electronics: "📱",
    charging: "🔌",
    clothing: "👕",
    toiletries: "🧴",
    cosmetics: "💄",
    shoes: "👟",
    accessories: "👓",
    medications: "💊",
    food: "🍎",
    other: "📦",
  };
  return icons[category] || "📦";
}

