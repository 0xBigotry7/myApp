"use client";

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
}

export default function SearchItems({ query, onChange, results }: SearchItemsProps) {
  return (
    <div className="relative">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">
          🔍
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search items across all luggage..."
          className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
        />
      </div>

      {/* Results */}
      {query && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-10">
          {results.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              No items found for "{query}"
            </div>
          ) : (
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 px-3 py-2">
                Found {results.length} item{results.length !== 1 ? "s" : ""}
              </div>
              {results.map((result) => (
                <div
                  key={result.id}
                  className="px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full bg-${result.luggageColor}-500`}
                        style={{
                          backgroundColor: result.luggageColor === "black" ? "#1f2937" : undefined
                        }}
                      />
                      <span className={`font-semibold text-sm ${result.isPacked ? "line-through text-gray-400" : "text-gray-900"}`}>
                        {result.name}
                      </span>
                      {result.quantity > 1 && (
                        <span className="text-xs text-gray-500">
                          ×{result.quantity}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 capitalize">
                        {result.category}
                      </span>
                      <span className="text-xs text-violet-600">
                        {result.luggageName}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
