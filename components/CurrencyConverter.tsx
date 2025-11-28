"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowRightLeft, Search, ChevronDown, Check, TrendingUp, RefreshCw } from "lucide-react";

interface ExchangeRates {
  [key: string]: number;
}

const currencies = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr", flag: "🇨🇭" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", flag: "🇰🇷" },
  { code: "THB", name: "Thai Baht", symbol: "฿", flag: "🇹🇭" },
  { code: "MXN", name: "Mexican Peso", symbol: "Mex$", flag: "🇲🇽" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫", flag: "🇻🇳" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", flag: "🇲🇾" },
];

const popularCurrencies = ["USD", "EUR", "JPY", "GBP", "CNY", "THB"];

// Fallback rates
const fallbackRates: ExchangeRates = {
  EUR: 0.92, GBP: 0.79, JPY: 150.3, CNY: 7.18, AUD: 1.51, CAD: 1.36,
  CHF: 0.91, HKD: 7.82, SGD: 1.35, KRW: 1340.2, THB: 36.1, MXN: 17.1,
  INR: 83.2, IDR: 15600, VND: 24500, MYR: 4.75
};

export default function CurrencyConverter() {
  const [amount, setAmount] = useState<string>("1000");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [rates, setRates] = useState<ExchangeRates>(fallbackRates);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  
  // Custom Select State
  const [isFromOpen, setIsFromOpen] = useState(false);
  const [isToOpen, setIsToOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFromOpen(false);
        setIsToOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch exchange rates
  useEffect(() => {
    const fetchRates = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://api.exchangerate-api.com/v4/latest/${fromCurrency}?t=${Date.now()}`,
          { cache: 'no-store' }
        );
        if (response.ok) {
          const data = await response.json();
          setRates(data.rates);
          setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } else {
          setRates(fallbackRates);
          setLastUpdated("Offline");
        }
      } catch (error) {
        console.error("Failed to fetch rates:", error);
        setRates(fallbackRates);
        setLastUpdated("Offline");
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, [fromCurrency]);

  useEffect(() => {
    const numAmount = parseFloat(amount) || 0;
    const rate = rates[toCurrency] || 1;
    setConvertedAmount(numAmount * rate);
  }, [amount, toCurrency, rates]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const filteredCurrencies = currencies.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const CurrencySelector = ({ code, isOpen, onToggle, onSelect }: { code: string, isOpen: boolean, onToggle: () => void, onSelect: (c: string) => void }) => {
    const currency = currencies.find(c => c.code === code);
    return (
      <div className="relative">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-600 transition-all min-w-[120px]"
        >
          <span className="text-2xl">{currency?.flag}</span>
          <div className="text-left flex-1">
            <div className="font-bold text-zinc-900 dark:text-white leading-none">{code}</div>
          </div>
          <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-left">
            <div className="p-3 border-b border-zinc-50 dark:border-zinc-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search currency..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-sm font-medium text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto p-1">
              {filteredCurrencies.map(c => (
                <button
                  key={c.code}
                  onClick={() => {
                    onSelect(c.code);
                    setSearchQuery("");
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors ${c.code === code ? "bg-zinc-50 dark:bg-zinc-700" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.flag}</span>
                    <div className="text-left">
                      <div className="font-bold text-zinc-900 dark:text-white text-sm">{c.code}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{c.name}</div>
                    </div>
                  </div>
                  {c.code === code && <Check className="w-4 h-4 text-emerald-500" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto" ref={dropdownRef}>
      <div className="bg-white dark:bg-zinc-900 rounded-[32px] shadow-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-zinc-900 text-white p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  Currency
                </h2>
                <div className="flex items-center gap-2 mt-2 text-zinc-400 text-xs">
                  <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-500'}`} />
                  {loading ? "Updating rates..." : `Updated ${lastUpdated}`}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            {/* Main Input Display */}
            <div className="mb-4">
              <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 block">Amount</label>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl text-zinc-500 font-medium">
                  {currencies.find(c => c.code === fromCurrency)?.symbol}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setAmount(val);
                    }
                  }}
                  className="w-full bg-transparent text-5xl font-bold text-white placeholder-zinc-700 outline-none"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Converter Controls */}
        <div className="p-6 -mt-6 relative z-20 bg-white dark:bg-zinc-900 rounded-t-[32px]">
          <div className="space-y-4">
            
            {/* From Currency Row */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
              <div className="flex-1">
                <div className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase mb-1">From</div>
                <div className="text-zinc-900 dark:text-white font-medium text-sm">
                  1 {fromCurrency} = {(rates[toCurrency] || 0).toFixed(4)} {toCurrency}
                </div>
              </div>
              <CurrencySelector
                code={fromCurrency}
                isOpen={isFromOpen}
                onToggle={() => { setIsFromOpen(!isFromOpen); setIsToOpen(false); }}
                onSelect={(c) => { setFromCurrency(c); setIsFromOpen(false); }}
              />
            </div>

            {/* Swap & Divider */}
            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-100 dark:border-zinc-700"></div>
              </div>
              <button
                onClick={handleSwap}
                className="relative z-10 w-10 h-10 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* To Currency Row */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
              <div className="flex-1">
                <div className="text-xs text-emerald-600/60 dark:text-emerald-400/60 font-bold uppercase mb-1">To</div>
                <div className="text-emerald-900 dark:text-emerald-400 font-bold text-2xl">
                  {currencies.find(c => c.code === toCurrency)?.symbol}
                  {convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <CurrencySelector
                code={toCurrency}
                isOpen={isToOpen}
                onToggle={() => { setIsToOpen(!isToOpen); setIsFromOpen(false); }}
                onSelect={(c) => { setToCurrency(c); setIsToOpen(false); }}
              />
            </div>
          </div>

          {/* Quick Currencies */}
          <div className="mt-8">
            <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Popular</div>
            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
              {popularCurrencies.map((curr) => (
                <button
                  key={curr}
                  onClick={() => {
                    // Smart switch: if current "from" is clicked, swap; else set "to"
                    if (fromCurrency === curr) {
                      handleSwap();
                    } else {
                      setToCurrency(curr);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${
                    toCurrency === curr
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-lg"
                      : fromCurrency === curr 
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-700"
                        : "bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                  }`}
                >
                  <span className="text-lg">{currencies.find(c => c.code === curr)?.flag}</span>
                  {curr}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
