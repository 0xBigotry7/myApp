"use client";

import { useState, useEffect } from "react";

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
          setLastUpdated(new Date().toLocaleTimeString());
        } else {
          setRates(fallbackRates);
          setLastUpdated("Offline rates");
        }
      } catch (error) {
        console.error("Failed to fetch rates:", error);
        setRates(fallbackRates);
        setLastUpdated("Offline rates");
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
    <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-200 p-2.5 md:p-6">
      {/* Header */}
      <div className="mb-2 md:mb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-2xl font-bold text-gray-900">
            💱 Converter
          </h2>
          {lastUpdated && (
            <span className="text-[9px] md:text-xs text-gray-500">
              {lastUpdated}
            </span>
          )}
        </div>
      </div>

      {/* Amount Input */}
      <div className="mb-2 md:mb-3">
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 md:py-2.5 text-base md:text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="1000"
        />
      </div>

      {/* From Currency - Quick Select */}
      <div className="mb-1.5 md:mb-2">
        <label className="block text-[10px] md:text-xs font-semibold text-gray-600 mb-1">From</label>
        <div className="grid grid-cols-5 gap-1 md:gap-1.5 mb-1.5 md:mb-2">
          {popularCurrencies.map((curr) => (
            <button
              key={curr}
              onClick={() => setFromCurrency(curr)}
              className={`py-1.5 md:py-2 rounded-md text-[11px] md:text-xs font-bold transition-all active:scale-95 ${
                fromCurrency === curr
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 active:bg-gray-200"
              }`}
            >
              {curr}
            </button>
          ))}
        </div>
        <select
          value={fromCurrency}
          onChange={(e) => setFromCurrency(e.target.value)}
          className="w-full px-2 md:px-2.5 py-1.5 md:py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
        >
          {currencies.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.code} - {currency.name}
            </option>
          ))}
        </select>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center my-1.5 md:my-2">
        <button
          onClick={handleSwap}
          className="p-1.5 rounded-full bg-blue-100 active:bg-blue-300 transition-colors"
          title="Swap currencies"
        >
          <svg
            className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
            />
          </svg>
        </button>
      </div>

      {/* To Currency - Quick Select */}
      <div className="mb-2 md:mb-3">
        <label className="block text-[10px] md:text-xs font-semibold text-gray-600 mb-1">To</label>
        <div className="grid grid-cols-5 gap-1 md:gap-1.5 mb-1.5 md:mb-2">
          {popularCurrencies.map((curr) => (
            <button
              key={curr}
              onClick={() => setToCurrency(curr)}
              className={`py-1.5 md:py-2 rounded-md text-[11px] md:text-xs font-bold transition-all active:scale-95 ${
                toCurrency === curr
                  ? "bg-green-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 active:bg-gray-200"
              }`}
            >
              {curr}
            </button>
          ))}
        </div>
        <select
          value={toCurrency}
          onChange={(e) => setToCurrency(e.target.value)}
          className="w-full px-2 md:px-2.5 py-1.5 md:py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
        >
          {currencies.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.code} - {currency.name}
            </option>
          ))}
        </select>
      </div>

      {/* Result */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-2.5 md:p-4 border-2 border-blue-200">
        <div className="text-[10px] md:text-xs text-gray-600 mb-0.5">Result</div>
        <div className="text-xl md:text-3xl font-bold text-blue-600 break-all">
          {loading ? (
            <span className="text-base md:text-lg">Loading...</span>
          ) : (
            <>
              {currencies.find((c) => c.code === toCurrency)?.symbol}
              {convertedAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </>
          )}
        </div>
        <div className="text-[10px] md:text-xs text-gray-600 mt-0.5 md:mt-1">
          1 {fromCurrency} = {(rates[toCurrency] || 0).toFixed(4)} {toCurrency}
        </div>
      </div>
    </div>
  );
}
