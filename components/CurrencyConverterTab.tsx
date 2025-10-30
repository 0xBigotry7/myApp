"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "./LanguageSwitcher";
import { getTranslations } from "@/lib/i18n";

interface CurrencyConverterTabProps {
  baseCurrency?: string | null;
  destination?: string | null;
}

interface RateHistoryPoint {
  date: string;
  rate: number;
}

const FALLBACK_RATES: Record<string, Record<string, number>> = {
  USD: {
    EUR: 0.92,
    GBP: 0.79,
    JPY: 150.3,
    AUD: 1.51,
    CAD: 1.36,
    CNY: 7.18,
    SGD: 1.35,
    KRW: 1340.2,
    THB: 36.1,
    MXN: 17.1,
  },
  EUR: {
    USD: 1.09,
    GBP: 0.86,
    JPY: 163.7,
    AUD: 1.64,
    CAD: 1.48,
    CNY: 7.83,
    SGD: 1.47,
    KRW: 1477.6,
    THB: 39.8,
    MXN: 18.8,
  },
  GBP: {
    USD: 1.26,
    EUR: 1.16,
    JPY: 191.4,
    AUD: 1.90,
    CAD: 1.71,
    CNY: 9.05,
    SGD: 1.70,
    KRW: 1700.4,
    THB: 45.8,
    MXN: 21.5,
  },
};

const currencyCatalog: Array<{ code: string; name: string }> = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "KRW", name: "South Korean Won" },
  { code: "THB", name: "Thai Baht" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "ZAR", name: "South African Rand" },
  { code: "AED", name: "UAE Dirham" },
  { code: "IDR", name: "Indonesian Rupiah" },
  { code: "INR", name: "Indian Rupee" },
  { code: "PHP", name: "Philippine Peso" },
  { code: "VND", name: "Vietnamese Dong" },
];

const popularCurrencies = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CNY", "SGD", "KRW", "THB"];

const destinationCurrencyHints: Array<{ code: string; keywords: string[] }> = [
  { code: "JPY", keywords: ["japan", "tokyo", "kyoto"] },
  { code: "EUR", keywords: ["france", "italy", "spain", "germany", "paris", "rome", "madrid", "berlin", "europe"] },
  { code: "GBP", keywords: ["london", "uk", "united kingdom", "england", "scotland"] },
  { code: "AUD", keywords: ["australia", "sydney", "melbourne"] },
  { code: "NZD", keywords: ["new zealand", "auckland", "wellington"] },
  { code: "THB", keywords: ["thailand", "bangkok", "phuket"] },
  { code: "SGD", keywords: ["singapore"] },
  { code: "KRW", keywords: ["korea", "seoul", "busan"] },
  { code: "CNY", keywords: ["china", "beijing", "shanghai"] },
  { code: "MXN", keywords: ["mexico", "cancun", "cdmx"] },
  { code: "AED", keywords: ["dubai", "uae", "abu dhabi"] },
  { code: "IDR", keywords: ["bali", "indonesia", "jakarta"] },
  { code: "CHF", keywords: ["switzerland", "zurich", "geneva"] },
  { code: "CAD", keywords: ["canada", "toronto", "vancouver"] },
];

const LOCAL_STORAGE_KEY = "travelmate.currency-favorites";

const numberFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const rateFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 4,
  maximumFractionDigits: 6,
});

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const formatDate = (date: Date) => date.toISOString().split("T")[0];

function buildSparklinePath(points: RateHistoryPoint[]) {
  if (points.length === 0) return "";
  const width = Math.max((points.length - 1) * 18, 1);
  const height = 36;
  const values = points.map((point) => point.rate);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const denominator = max === min ? 1 : max - min;

  return points
    .map((point, index) => {
      const x = (width / Math.max(points.length - 1, 1)) * index;
      const y = height - ((point.rate - min) / denominator) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function getDestinationCurrencySuggestions(destination?: string | null) {
  if (!destination) return [];
  const normalized = destination.toLowerCase();
  const matches = destinationCurrencyHints
    .filter((hint) => hint.keywords.some((keyword) => normalized.includes(keyword)))
    .map((hint) => hint.code);
  return matches;
}

export default function CurrencyConverterTab({
  baseCurrency: initialBaseCurrency,
  destination,
}: CurrencyConverterTabProps) {
  const locale = useLocale();
  const t = getTranslations(locale);
  const [baseCurrency, setBaseCurrency] = useState((initialBaseCurrency || "USD").toUpperCase());
  const [amount, setAmount] = useState(1000);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [usingFallbackRates, setUsingFallbackRates] = useState(false);
  const [focusedCurrency, setFocusedCurrency] = useState<string | null>(null);
  const [history, setHistory] = useState<RateHistoryPoint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [alertDirection, setAlertDirection] = useState<"above" | "below">("above");
  const [alertRateInput, setAlertRateInput] = useState("");
  const [markupPercent, setMarkupPercent] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavorites(parsed.filter((code) => typeof code === "string"));
        }
      }
    } catch (error) {
      console.warn("Unable to load currency favorites", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.warn("Unable to persist currency favorites", error);
    }
  }, [favorites]);

  const destinationSuggestions = useMemo(
    () => getDestinationCurrencySuggestions(destination),
    [destination],
  );

  useEffect(() => {
    setSelectedTargets((prev) => {
      const baseFiltered = prev.filter((code) => code !== baseCurrency);
      const seeded = [
        ...favorites,
        ...destinationSuggestions,
        ...popularCurrencies,
        ...baseFiltered,
      ]
        .filter((code) => code !== baseCurrency)
        .filter((code, index, array) => array.indexOf(code) === index)
        .slice(0, 6);

      if (seeded.length === 0) {
        const fallback = Object.keys(FALLBACK_RATES[baseCurrency] ?? FALLBACK_RATES.USD ?? {});
        return fallback.slice(0, 4);
      }
      return seeded;
    });
  }, [baseCurrency, destinationSuggestions, favorites]);

  useEffect(() => {
    setFocusedCurrency((current) => {
      if (current && current !== baseCurrency && selectedTargets.includes(current)) {
        return current;
      }
      return selectedTargets[0] ?? null;
    });
  }, [baseCurrency, selectedTargets]);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    const fetchRates = async () => {
      setLoadingRates(true);
      setRatesError(null);
      setUsingFallbackRates(false);
      try {
        const response = await fetch(
          `https://api.exchangerate.host/latest?base=${baseCurrency}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (!ignore && data && data.rates) {
          setRates(data.rates as Record<string, number>);
          setLastUpdated(data.date ?? new Date().toISOString());
        }
      } catch (error) {
        if (ignore) return;
        console.warn("Unable to fetch live rates", error);
        const fallback = FALLBACK_RATES[baseCurrency] ?? FALLBACK_RATES.USD;
        setUsingFallbackRates(true);
        if (fallback) {
          setRates(fallback);
          setLastUpdated(new Date().toISOString());
        } else {
          setRatesError("Unable to load rates right now");
        }
      } finally {
        if (!ignore) {
          setLoadingRates(false);
        }
      }
    };

    fetchRates();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [baseCurrency]);

  useEffect(() => {
    const symbol = focusedCurrency;
    if (!symbol) {
      setHistory([]);
      return;
    }

    let ignore = false;
    const controller = new AbortController();

    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);
        const response = await fetch(
          `https://api.exchangerate.host/timeseries?base=${baseCurrency}&symbols=${symbol}&start_date=${formatDate(
            start,
          )}&end_date=${formatDate(end)}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (!ignore && data && data.rates) {
          const points = Object.entries(data.rates)
            .sort(([dateA], [dateB]) => (dateA > dateB ? 1 : -1))
            .map(([date, value]) => ({ date, rate: (value as Record<string, number>)[symbol] }));
          setHistory(points);
          return;
        }
      } catch (error) {
        if (ignore) return;
        console.warn("Unable to fetch historical rates", error);
        const currentRate = rates[symbol] ?? 1;
        const generated: RateHistoryPoint[] = Array.from({ length: 7 }, (_, index) => {
          const day = new Date();
          day.setDate(day.getDate() - (6 - index));
          const variance = (Math.sin(index) + index / 10) / 50;
          return {
            date: formatDate(day),
            rate: Number((currentRate * (1 + variance)).toFixed(4)),
          };
        });
        setHistory(generated);
      } finally {
        if (!ignore) {
          setLoadingHistory(false);
        }
      }
    };

    fetchHistory();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [baseCurrency, focusedCurrency, rates]);

  const conversions = useMemo(() => {
    return selectedTargets
      .map((code) => {
        const rate = rates[code];
        if (!rate || code === baseCurrency) return null;
        const convertedAmount = amount * rate;
        const effectiveRate = rate * (1 - clamp(markupPercent, 0, 99.9) / 100);
        const bankAmount = amount * effectiveRate;
        const difference = convertedAmount - bankAmount;
        return {
          code,
          rate,
          convertedAmount,
          effectiveRate,
          bankAmount,
          difference,
        };
      })
      .filter(Boolean) as Array<{
      code: string;
      rate: number;
      convertedAmount: number;
      effectiveRate: number;
      bankAmount: number;
      difference: number;
    }>;
  }, [amount, baseCurrency, markupPercent, rates, selectedTargets]);

  const alertRateValue = useMemo(() => {
    const parsed = parseFloat(alertRateInput.replace(/,/g, "."));
    return Number.isFinite(parsed) ? parsed : null;
  }, [alertRateInput]);

  const focusedConversion = conversions.find((conversion) => conversion.code === focusedCurrency);

  const alertTriggered = useMemo(() => {
    if (!focusedConversion || !alertRateValue) return false;
    if (alertDirection === "above") {
      return focusedConversion.rate >= alertRateValue;
    }
    return focusedConversion.rate <= alertRateValue;
  }, [alertDirection, alertRateValue, focusedConversion]);

  const toggleFavorite = useCallback(
    (code: string) => {
      setFavorites((current) => {
        if (current.includes(code)) {
          return current.filter((item) => item !== code);
        }
        return [...current, code].slice(-8);
      });
    },
    [setFavorites],
  );

  const addCurrencyToWatchlist = (code: string) => {
    setSelectedTargets((current) => {
      if (current.includes(code) || code === baseCurrency) {
        return current;
      }
      return [...current, code].slice(-8);
    });
  };

  const removeCurrencyFromWatchlist = (code: string) => {
    setSelectedTargets((current) => current.filter((item) => item !== code));
  };

  const availableCurrencies = useMemo(() => {
    return currencyCatalog
      .filter((currency) => !selectedTargets.includes(currency.code) && currency.code !== baseCurrency)
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [baseCurrency, selectedTargets]);

  const liveRateStamp = useMemo(() => {
    if (!lastUpdated) return null;
    const timestamp = new Date(lastUpdated);
    if (Number.isNaN(timestamp.getTime())) return lastUpdated;
    return timestamp.toLocaleString();
  }, [lastUpdated]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              💱 {t.currencyConverter ?? "Currency Converter"}
            </h2>
            <p className="text-sm text-gray-600">
              {t.currencyConverterDescription ??
                "Live mid-market rates with pinned favorites, markup insights, and historical context inspired by top travel money apps."}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {t.lastUpdated ?? "Last updated"}: {liveRateStamp ?? t.loading ?? "Loading"}
            {usingFallbackRates && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                ⚠️ {t.offlineRates ?? "Offline-ready fallback rates"}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">{t.amountToConvert ?? "Amount to convert"}</span>
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value) || 0)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-base font-semibold text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">{t.baseCurrency ?? "Base currency"}</span>
            <select
              value={baseCurrency}
              onChange={(event) => setBaseCurrency(event.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base font-semibold text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {currencyCatalog.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} — {currency.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{t.popularCurrencies ?? "Popular picks"}:</span>
          {popularCurrencies
            .filter((code) => code !== baseCurrency)
            .map((code) => (
              <button
                key={code}
                onClick={() => addCurrencyToWatchlist(code)}
                className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
                  selectedTargets.includes(code)
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                }`}
              >
                {code}
              </button>
            ))}
        </div>

        {destinationSuggestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-indigo-50/60 px-4 py-3 text-sm text-indigo-600">
            <span className="font-semibold">
              📍 {t.destinationSpotlight ?? "Destination spotlight"}
            </span>
            <span className="text-indigo-500">
              {t.destinationSpotlightHelper ?? "We added currencies popular at your destination"}
            </span>
            <div className="flex flex-wrap gap-2">
              {destinationSuggestions.map((code) => (
                <button
                  key={code}
                  onClick={() => addCurrencyToWatchlist(code)}
                  className="rounded-full bg-white px-3 py-1 font-semibold text-indigo-600 shadow-sm"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              ⭐ {t.favorites ?? "Pinned currencies"}
            </h3>
            <p className="text-sm text-gray-500">
              {t.favoritesHelper ?? "Pin your go-to currencies for lightning quick conversions."}
            </p>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <span>{t.markupLabel ?? "Card/ATM markup (%)"}:</span>
              <input
                type="number"
                min={0}
                max={99.9}
                step={0.1}
                value={markupPercent}
                onChange={(event) => setMarkupPercent(clamp(Number(event.target.value) || 0, 0, 99.9))}
                className="w-20 rounded-full border border-gray-200 px-3 py-1 text-center text-sm font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
        </div>

        {loadingRates && conversions.length === 0 ? (
          <div className="flex items-center justify-center rounded-2xl bg-gray-50 py-10 text-sm text-gray-500">
            {t.loading ?? "Loading"}…
          </div>
        ) : ratesError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-600">
            {ratesError}
          </div>
        ) : conversions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
            {t.addCurrency ?? "Add currencies to start tracking conversions."}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {conversions.map((conversion) => {
              const isFocused = conversion.code === focusedCurrency;
              const isFavorite = favorites.includes(conversion.code);
              return (
                <button
                  key={conversion.code}
                  onClick={() => setFocusedCurrency(conversion.code)}
                  className={`group flex flex-col gap-4 rounded-3xl border px-5 py-4 text-left shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                    isFocused
                      ? "border-blue-500 bg-gradient-to-br from-blue-50 to-white"
                      : "border-gray-200 bg-white hover:border-blue-200 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-500">1 {baseCurrency}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {rateFormatter.format(conversion.rate)} <span className="text-base font-semibold">{conversion.code}</span>
                      </p>
                      <p className="text-xs uppercase tracking-wide text-blue-500">
                        {t.midMarketRate ?? "Mid-market rate"} · {t.tapToFocus ?? "Tap to focus chart"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleFavorite(conversion.code);
                        }}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                          isFavorite
                            ? "border-yellow-400 bg-yellow-100 text-yellow-700"
                            : "border-gray-200 bg-gray-50 text-gray-500 hover:border-yellow-300 hover:bg-yellow-50 hover:text-yellow-600"
                        }`}
                      >
                        {isFavorite ? t.unpin ?? "Unpin" : t.pin ?? "Pin"}
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeCurrencyFromWatchlist(conversion.code);
                        }}
                        className="text-xs font-medium text-gray-400 hover:text-red-500"
                      >
                        {t.remove ?? "Remove"}
                      </button>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                    <div className="flex items-center justify-between font-semibold text-gray-900">
                      <span>{t.youReceive ?? "You receive"}</span>
                      <span>
                        {numberFormatter.format(conversion.convertedAmount)} {conversion.code}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-gray-500">
                      <div className="flex items-center justify-between">
                        <span>{t.effectiveRate ?? "Effective rate after markup"}</span>
                        <span>
                          {rateFormatter.format(conversion.effectiveRate)} {conversion.code}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{t.withMarkup ?? "Provider sends"}</span>
                        <span>
                          {numberFormatter.format(conversion.bankAmount)} {conversion.code}
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-semibold text-emerald-600">
                        <span>{t.difference ?? "Saved vs. bank"}</span>
                        <span>+{numberFormatter.format(conversion.difference)} {conversion.code}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{t.addMoreCurrencies ?? "Add more currencies"}:</span>
            <select
              onChange={(event) => {
                const value = event.target.value;
                if (!value) return;
                addCurrencyToWatchlist(value);
                event.currentTarget.selectedIndex = 0;
              }}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm font-semibold text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              defaultValue=""
            >
              <option value="" disabled>
                {t.selectCurrency ?? "Select currency"}
              </option>
              {availableCurrencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} — {currency.name}
                </option>
              ))}
            </select>
          </div>
          {favorites.length > 0 && (
            <div className="text-xs uppercase tracking-wide text-gray-400">
              {t.favoritesCount ?? "Pinned"}: {favorites.length}
            </div>
          )}
        </div>
      </div>

      {focusedConversion && (
        <div className="grid gap-6 rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-sm lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  📈 {t.historicalTrend ?? "7-day trend"}
                </h3>
                <p className="text-sm text-gray-500">
                  {t.historicalTrendHelper ??
                    "We mirror XE-style rate history so you know if it's a good moment to exchange."}
                </p>
              </div>
              <div className="text-right text-sm text-gray-500">
                {focusedConversion.code} {t.liveRate ?? "live rate"}: {rateFormatter.format(focusedConversion.rate)}
              </div>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
              {loadingHistory ? (
                <div className="flex h-40 items-center justify-center text-sm text-blue-500">
                  {t.loading ?? "Loading"}…
                </div>
              ) : history.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-blue-500">
                  {t.historicalTrendEmpty ?? "Add this currency to view history."}
                </div>
              ) : (
                <div>
                  <svg
                    viewBox={`0 0 ${Math.max((history.length - 1) * 18, 1)} 36`}
                    className="h-32 w-full text-blue-500"
                    preserveAspectRatio="none"
                  >
                    <path d={buildSparklinePath(history)} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
                  </svg>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-blue-600">
                    <div>
                      {t.bestRate ?? "Best"}: {rateFormatter.format(Math.max(...history.map((point) => point.rate)))}
                    </div>
                    <div>
                      {t.worstRate ?? "Worst"}: {rateFormatter.format(Math.min(...history.map((point) => point.rate)))}
                    </div>
                    <div className="col-span-2 text-gray-500">
                      {t.range ?? "Range"}: {rateFormatter.format(history[0]?.rate ?? 0)} →
                      {" "}
                      {rateFormatter.format(history[history.length - 1]?.rate ?? 0)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
              <h4 className="text-sm font-semibold text-gray-900">
                🔔 {t.alertTitle ?? "Smart rate alert"}
              </h4>
              <p className="mt-1 text-xs text-gray-500">
                {t.alertHelper ??
                  "Set a target inspired by Wise/XE and we'll flag the pair once the live rate crosses it while you're planning."}
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="alert-direction"
                      value="above"
                      checked={alertDirection === "above"}
                      onChange={() => setAlertDirection("above")}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {t.alertDirectionAbove ?? "Alert me when rate is above"}
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="alert-direction"
                      value="below"
                      checked={alertDirection === "below"}
                      onChange={() => setAlertDirection("below")}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {t.alertDirectionBelow ?? "Alert me when rate is below"}
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step={0.0001}
                    min={0}
                    value={alertRateInput}
                    onChange={(event) => setAlertRateInput(event.target.value)}
                    className="flex-1 rounded-2xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder={`${rateFormatter.format(focusedConversion.rate)}`}
                  />
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                    {focusedConversion.code}
                  </span>
                </div>
                {alertRateValue && (
                  <p className="text-xs text-gray-500">
                    {alertDirection === "above"
                      ? (t.alertActiveAbove ?? "We'll highlight once the rate moves above")
                      : (t.alertActiveBelow ?? "We'll highlight once the rate dips below")}{" "}
                    <span className="font-semibold text-gray-700">
                      {rateFormatter.format(alertRateValue)} {focusedConversion.code}
                    </span>
                  </p>
                )}
                {alertTriggered && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-600">
                    ✅ {t.alertTriggered ?? "Heads up! Your target has just been met."}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
              <h4 className="text-sm font-semibold text-gray-900">
                🧠 {t.converterTips ?? "Traveler intel"}
              </h4>
              <ul className="mt-3 space-y-2 text-xs text-gray-600">
                <li>
                  • {t.converterTipFavorites ?? "Pin currencies to sync across sessions for offline-friendly access."}
                </li>
                <li>
                  • {t.converterTipMarkup ?? "Model FX fees like Revolut or Wise by adjusting markup and spotting the savings."}
                </li>
                <li>
                  • {t.converterTipHistory ?? "Check the 7-day chart before you swipe so you lock in a friendly rate."}
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-gray-200 bg-white/90 p-6 text-sm text-gray-500 shadow-sm">
        <p>
          {t.converterFooter ??
            "Data sourced from exchangerate.host with graceful degradation to cached mid-market snapshots so the converter stays useful even offline."}
        </p>
      </div>
    </div>
  );
}
