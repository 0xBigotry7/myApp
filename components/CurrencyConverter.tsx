"use client";

import { useState, useEffect } from "react";
import { ArrowRightLeft, RefreshCw, TrendingUp, Wallet } from "lucide-react";

interface ExchangeRates {
  [key: string]: number;
}

const currencies = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "MXN", name: "Mexican Peso", symbol: "Mex$" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
];

const popularCurrencies = ["USD", "CNY", "THB", "JPY", "EUR"];

// Fallback rates in case API fails
const fallbackRates: ExchangeRates = {
  EUR: 0.92,
  GBP: 0.79,
  JPY: 150.3,
  CNY: 7.18,
  AUD: 1.51,
  CAD: 1.36,
  CHF: 0.91,
  HKD: 7.82,
  SGD: 1.35,
  KRW: 1340.2,
  THB: 36.1,
  MXN: 17.1,
  INR: 83.2,
};

export default function CurrencyConverter() {
  const [amount, setAmount] = useState<string>("1000");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [rates, setRates] = useState<ExchangeRates>(fallbackRates);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [convertedAmount, setConvertedAmount] = useState<number>(0);

  // Fetch exchange rates - always fetch fresh on mount or when fromCurrency changes
  useEffect(() => {
    const fetchRates = async () => {
      setLoading(true);
      try {
        // Add timestamp to prevent caching
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

  // Calculate conversion
  useEffect(() => {
    const numAmount = parseFloat(amount) || 0;
    const rate = rates[toCurrency] || 1;
    setConvertedAmount(numAmount * rate);
  }, [amount, toCurrency, rates]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-zinc-100 overflow-hidden relative">
        {/* Decorative background blob */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl -z-10 opacity-50 translate-x-1/3 -translate-y-1/3" />
        
        {/* Header */}
        <div className="p-8 pb-0">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                <Wallet className="w-6 h-6 text-zinc-900" />
                Currency
              </h2>
              <p className="text-sm text-zinc-500 mt-1">Real-time exchange rates</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-full border border-zinc-100">
              <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`} />
              <span className="text-xs font-medium text-zinc-500">
                {loading ? "Updating..." : lastUpdated}
              </span>
            </div>
          </div>

          {/* Input Section */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">Amount</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-medium text-xl">
                {currencies.find(c => c.code === fromCurrency)?.symbol}
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-4 text-4xl font-bold text-zinc-900 bg-transparent border-b-2 border-zinc-100 focus:border-zinc-900 outline-none transition-all placeholder:text-zinc-200"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Converter Body */}
        <div className="p-6 space-y-4">
          {/* From Currency */}
          <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 transition-colors hover:border-zinc-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-zinc-400 uppercase">From</span>
              <span className="text-xs font-bold text-zinc-900">1 {fromCurrency} = {(rates[toCurrency] || 0).toFixed(4)} {toCurrency}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
              {popularCurrencies.map((curr) => (
                <button
                  key={curr}
                  onClick={() => setFromCurrency(curr)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                    fromCurrency === curr
                      ? "bg-zinc-900 text-white shadow-md"
                      : "bg-white text-zinc-500 border border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full mt-2 p-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 appearance-none cursor-pointer"
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="relative h-4">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <button
                onClick={handleSwap}
                className="p-3 rounded-full bg-zinc-900 text-white shadow-lg hover:scale-110 active:scale-95 transition-all"
              >
                <ArrowRightLeft className="w-5 h-5" />
              </button>
            </div>
            <div className="absolute top-1/2 w-full h-px bg-zinc-100 -translate-y-1/2" />
          </div>

          {/* To Currency */}
          <div className="bg-zinc-900 p-5 rounded-2xl text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-zinc-400 uppercase">To</span>
                <div className="flex gap-2">
                  {popularCurrencies.slice(0, 3).map((curr) => (
                    <button
                      key={curr}
                      onClick={() => setToCurrency(curr)}
                      className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                        toCurrency === curr
                          ? "bg-white text-zinc-900"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-medium text-zinc-400">
                  {currencies.find(c => c.code === toCurrency)?.symbol}
                </span>
                <span className="text-5xl font-bold tracking-tight">
                  {convertedAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none cursor-pointer hover:bg-zinc-700 transition-colors"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
