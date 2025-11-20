"use client";

import { getTranslations, type Locale } from "@/lib/i18n";
import { Search, Package, ArrowRight } from "lucide-react";

interface SearchResult {
  id: string;
  name: string;
  category: string;
  quantity: number;
  isPacked: boolean;
  luggageName: string;
  luggageColor: string;
}

interface SearchItemsProps {
  query: string;
  onChange: (query: string) => void;
  results: SearchResult[];
  locale: Locale;
}

export default function SearchItems({ query, onChange, results, locale }: SearchItemsProps) {
  const t = getTranslations(locale);
  
  return (
    <div className="relative w-full">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-zinc-800 transition-colors" />
        <input
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t.searchItemsAcrossLuggage}
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-zinc-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all placeholder:text-zinc-400 text-zinc-900"
        />
        {query && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400 bg-zinc-100 px-2 py-1 rounded-md">
            ESC to clear
          </div>
        )}
      </div>

      {/* Results */}
      {query && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-zinc-100 max-h-96 overflow-y-auto z-20 custom-scrollbar">
          {results.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-zinc-300" />
              </div>
              <p className="text-zinc-900 font-medium">{t.noItemsFound}</p>
              <p className="text-zinc-500 text-sm mt-1">No items match "{query}"</p>
            </div>
          ) : (
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2 mb-1">
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Found {results.length} {results.length === 1 ? t.item : "items"}
                </div>
              </div>
              
              <div className="space-y-1">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="group px-4 py-3 hover:bg-zinc-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-zinc-100"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full shadow-sm`}
                          style={{
                            backgroundColor: 
                              result.luggageColor === "black" ? "#18181b" : 
                              result.luggageColor === "white" ? "#ffffff" :
                              `var(--color-${result.luggageColor}-500, #71717a)` 
                          }}
                        />
                        
                        <div>
                          <div className={`font-medium text-sm flex items-center gap-2 ${result.isPacked ? "text-zinc-400 line-through" : "text-zinc-900"}`}>
                            {result.name}
                            {result.quantity > 1 && (
                              <span className="text-xs text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded no-underline">
                                ×{result.quantity}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                            <span className="capitalize">{result.category}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-300" />
                            <span>{result.luggageName}</span>
                          </div>
                        </div>
                      </div>
                      
                      <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
