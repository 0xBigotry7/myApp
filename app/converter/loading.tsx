"use client";

import NavbarClient from "@/components/NavbarClient";

// Converter page skeleton matching CurrencyConverter layout
export default function ConverterLoading() {
  return (
    <>
      <NavbarClient user={{ name: "Loading..." }} />
      <div className="min-h-screen bg-zinc-50">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Converter Card - matches CurrencyConverter component */}
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-3xl shadow-xl border border-zinc-100 overflow-hidden relative">
              {/* Decorative blob */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl -z-10 opacity-50 translate-x-1/3 -translate-y-1/3" />
              
              {/* Header */}
              <div className="p-8 pb-0">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-6 w-6 bg-zinc-200 rounded animate-pulse" />
                      <div className="h-7 w-24 bg-zinc-200 rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-36 bg-zinc-100 rounded animate-pulse" />
                  </div>
                  <div className="h-7 w-24 bg-zinc-50 rounded-full border border-zinc-100 animate-pulse" />
                </div>

                {/* Amount Input */}
                <div className="space-y-1">
                  <div className="h-3 w-16 bg-zinc-100 rounded animate-pulse ml-1" />
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-4 bg-zinc-200 rounded animate-pulse" />
                    <div className="h-16 w-full border-b-2 border-zinc-100 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Converter Body */}
              <div className="p-6 space-y-4">
                {/* From Currency */}
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                  <div className="flex justify-between items-center mb-3">
                    <div className="h-3 w-10 bg-zinc-200 rounded animate-pulse" />
                    <div className="h-3 w-32 bg-zinc-200 rounded animate-pulse" />
                  </div>
                  {/* Currency buttons */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {['USD', 'CNY', 'THB', 'JPY', 'EUR'].map((curr) => (
                      <div key={curr} className="h-10 w-16 bg-zinc-100 rounded-xl animate-pulse flex-shrink-0" />
                    ))}
                  </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                  <div className="h-12 w-12 bg-zinc-100 rounded-full animate-pulse" />
                </div>

                {/* To Currency */}
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                  <div className="flex justify-between items-center mb-3">
                    <div className="h-3 w-8 bg-zinc-200 rounded animate-pulse" />
                  </div>
                  {/* Currency buttons */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {['USD', 'CNY', 'THB', 'JPY', 'EUR'].map((curr) => (
                      <div key={curr} className="h-10 w-16 bg-zinc-100 rounded-xl animate-pulse flex-shrink-0" />
                    ))}
                  </div>
                </div>

                {/* Result */}
                <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 p-6 rounded-2xl">
                  <div className="text-center">
                    <div className="h-4 w-24 bg-zinc-700 rounded mx-auto mb-3 animate-pulse" />
                    <div className="h-10 w-40 bg-zinc-700 rounded-lg mx-auto animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
