"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CalendarPicker from "@/components/CalendarPicker";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const CATEGORIES = [
  { name: "Accommodation", icon: "🏨", color: "#3b82f6", defaultPercent: 30 },
  { name: "Food & Dining", icon: "🍽️", color: "#10b981", defaultPercent: 20 },
  { name: "Flights", icon: "✈️", color: "#06b6d4", defaultPercent: 25 },
  { name: "Transportation", icon: "🚗", color: "#f59e0b", defaultPercent: 10 },
  { name: "Activities", icon: "🎭", color: "#8b5cf6", defaultPercent: 10 },
  { name: "Shopping", icon: "🛍️", color: "#ec4899", defaultPercent: 2 },
  { name: "Insurance & Health", icon: "🏥", color: "#ef4444", defaultPercent: 1 },
  { name: "Communication", icon: "📱", color: "#14b8a6", defaultPercent: 1 },
  { name: "Fees & Tips", icon: "💳", color: "#a855f7", defaultPercent: 1 },
  { name: "Other", icon: "📌", color: "#6b7280", defaultPercent: 0 },
];

const TRIP_PRESETS = {
  foodie: { Accommodation: 20, "Food & Dining": 40, Flights: 20, Transportation: 8, Activities: 8, Shopping: 2, "Insurance & Health": 1, Communication: 0.5, "Fees & Tips": 0.5, Other: 0 },
  fineDining: { Accommodation: 25, "Food & Dining": 45, Flights: 15, Transportation: 5, Activities: 5, Shopping: 2, "Insurance & Health": 1, Communication: 1, "Fees & Tips": 1, Other: 0 },
  resort: { Accommodation: 40, "Food & Dining": 20, Flights: 20, Transportation: 3, Activities: 12, Shopping: 2, "Insurance & Health": 1, Communication: 1, "Fees & Tips": 1, Other: 0 },
  workTrip: { Accommodation: 30, "Food & Dining": 25, Flights: 25, Transportation: 10, Activities: 3, Shopping: 2, "Insurance & Health": 2, Communication: 2, "Fees & Tips": 1, Other: 0 },
  adventure: { Accommodation: 15, "Food & Dining": 18, Flights: 22, Transportation: 12, Activities: 28, Shopping: 1, "Insurance & Health": 2, Communication: 1, "Fees & Tips": 1, Other: 0 },
  sightseeing: { Accommodation: 25, "Food & Dining": 20, Flights: 20, Transportation: 12, Activities: 18, Shopping: 2, "Insurance & Health": 1, Communication: 1, "Fees & Tips": 1, Other: 0 },
};

const POPULAR_DESTINATIONS = [
  // Americas
  "New York, USA", "Los Angeles, USA", "San Francisco, USA", "Miami, USA", "Las Vegas, USA", "Chicago, USA", "Boston, USA", "Seattle, USA", "New Orleans, USA", "Austin, USA",
  "San Diego, USA", "Honolulu, Hawaii, USA", "Anchorage, Alaska, USA", "Cancun, Mexico", "Mexico City, Mexico", "Playa del Carmen, Mexico", "Cabo San Lucas, Mexico", "Tulum, Mexico",
  "Puerto Vallarta, Mexico", "Guadalajara, Mexico", "San Juan, Puerto Rico", "Ponce, Puerto Rico", "Vieques, Puerto Rico", "Culebra, Puerto Rico", "Rio de Janeiro, Brazil",
  "São Paulo, Brazil", "Buenos Aires, Argentina", "Lima, Peru", "Cusco, Peru", "Machu Picchu, Peru", "Cartagena, Colombia", "Bogotá, Colombia", "Medellín, Colombia",
  "Quito, Ecuador", "Galápagos Islands, Ecuador", "Santiago, Chile", "Valparaíso, Chile", "Patagonia, Argentina", "Havana, Cuba", "Varadero, Cuba", "Nassau, Bahamas",
  "Montego Bay, Jamaica", "Barbados", "Aruba", "St. Lucia", "Turks and Caicos", "Dominican Republic", "Costa Rica", "Panama City, Panama", "Toronto, Canada",
  "Vancouver, Canada", "Montreal, Canada", "Banff, Canada", "Quebec City, Canada",

  // Europe
  "London, UK", "Edinburgh, Scotland", "Dublin, Ireland", "Paris, France", "Nice, France", "Lyon, France", "Bordeaux, France", "French Riviera, France", "Marseille, France",
  "Rome, Italy", "Venice, Italy", "Florence, Italy", "Milan, Italy", "Naples, Italy", "Amalfi Coast, Italy", "Cinque Terre, Italy", "Sicily, Italy", "Barcelona, Spain",
  "Madrid, Spain", "Seville, Spain", "Valencia, Spain", "Granada, Spain", "Ibiza, Spain", "Mallorca, Spain", "San Sebastian, Spain", "Bilbao, Spain", "Lisbon, Portugal",
  "Porto, Portugal", "Algarve, Portugal", "Madeira, Portugal", "Azores, Portugal", "Amsterdam, Netherlands", "Brussels, Belgium", "Bruges, Belgium", "Berlin, Germany",
  "Munich, Germany", "Hamburg, Germany", "Frankfurt, Germany", "Cologne, Germany", "Vienna, Austria", "Salzburg, Austria", "Innsbruck, Austria", "Zurich, Switzerland",
  "Geneva, Switzerland", "Interlaken, Switzerland", "Lucerne, Switzerland", "Zermatt, Switzerland", "Prague, Czech Republic", "Budapest, Hungary", "Krakow, Poland",
  "Warsaw, Poland", "Bucharest, Romania", "Sofia, Bulgaria", "Athens, Greece", "Santorini, Greece", "Mykonos, Greece", "Crete, Greece", "Rhodes, Greece", "Corfu, Greece",
  "Istanbul, Turkey", "Cappadocia, Turkey", "Antalya, Turkey", "Bodrum, Turkey", "Copenhagen, Denmark", "Stockholm, Sweden", "Oslo, Norway", "Bergen, Norway", "Helsinki, Finland",
  "Reykjavik, Iceland", "Tallinn, Estonia", "Riga, Latvia", "Vilnius, Lithuania", "Moscow, Russia", "St. Petersburg, Russia", "Zagreb, Croatia", "Dubrovnik, Croatia",
  "Split, Croatia", "Ljubljana, Slovenia", "Belgrade, Serbia",

  // Asia
  "Tokyo, Japan", "Kyoto, Japan", "Osaka, Japan", "Hiroshima, Japan", "Sapporo, Japan", "Nara, Japan", "Hakone, Japan", "Seoul, South Korea", "Busan, South Korea",
  "Jeju Island, South Korea", "Beijing, China", "Shanghai, China", "Hong Kong", "Macau", "Taipei, Taiwan", "Bangkok, Thailand", "Chiang Mai, Thailand", "Phuket, Thailand",
  "Krabi, Thailand", "Koh Samui, Thailand", "Pattaya, Thailand", "Hanoi, Vietnam", "Ho Chi Minh City, Vietnam", "Hoi An, Vietnam", "Halong Bay, Vietnam", "Da Nang, Vietnam",
  "Singapore", "Kuala Lumpur, Malaysia", "Penang, Malaysia", "Langkawi, Malaysia", "Bali, Indonesia", "Jakarta, Indonesia", "Yogyakarta, Indonesia", "Lombok, Indonesia",
  "Manila, Philippines", "Boracay, Philippines", "Cebu, Philippines", "Palawan, Philippines", "Siem Reap, Cambodia", "Phnom Penh, Cambodia", "Luang Prabang, Laos",
  "Vientiane, Laos", "Yangon, Myanmar", "Bagan, Myanmar", "Kathmandu, Nepal", "Pokhara, Nepal", "New Delhi, India", "Mumbai, India", "Jaipur, India", "Agra, India",
  "Goa, India", "Kerala, India", "Varanasi, India", "Udaipur, India", "Colombo, Sri Lanka", "Kandy, Sri Lanka", "Dhaka, Bangladesh", "Maldives",

  // Middle East
  "Dubai, UAE", "Abu Dhabi, UAE", "Doha, Qatar", "Muscat, Oman", "Tel Aviv, Israel", "Jerusalem, Israel", "Amman, Jordan", "Petra, Jordan", "Dead Sea, Jordan",
  "Beirut, Lebanon", "Marrakech, Morocco", "Casablanca, Morocco", "Fez, Morocco", "Tangier, Morocco", "Cairo, Egypt", "Alexandria, Egypt", "Luxor, Egypt",
  "Sharm El Sheikh, Egypt", "Tunis, Tunisia",

  // Africa
  "Cape Town, South Africa", "Johannesburg, South Africa", "Durban, South Africa", "Kruger National Park, South Africa", "Nairobi, Kenya", "Mombasa, Kenya",
  "Zanzibar, Tanzania", "Dar es Salaam, Tanzania", "Serengeti, Tanzania", "Addis Ababa, Ethiopia", "Accra, Ghana", "Lagos, Nigeria", "Dakar, Senegal", "Marrakesh, Morocco",
  "Victoria Falls, Zimbabwe", "Livingstone, Zambia", "Mauritius", "Seychelles", "Madagascar",

  // Oceania
  "Sydney, Australia", "Melbourne, Australia", "Brisbane, Australia", "Perth, Australia", "Gold Coast, Australia", "Cairns, Australia", "Great Barrier Reef, Australia",
  "Adelaide, Australia", "Hobart, Australia", "Auckland, New Zealand", "Wellington, New Zealand", "Queenstown, New Zealand", "Christchurch, New Zealand",
  "Rotorua, New Zealand", "Fiji", "Tahiti, French Polynesia", "Bora Bora, French Polynesia", "Cook Islands", "Samoa", "Guam",
];

interface DestinationSuggestion {
  destination: string;
  reason: string;
  estimatedBudget: number;
}

interface BudgetOption {
  level: "comfortable" | "balanced" | "luxury";
  totalBudget: number;
  perPersonPerDay: number;
  description: string;
  breakdown: {
    flights: number;
    accommodation: number;
    food: number;
    localTransport: number;
    activities: number;
    shopping: number;
    insurance: number;
    miscellaneous: number;
  };
  detailedBreakdown: {
    flights: { economy: number; bags: number };
    accommodation: { perNight: number; total: number; type: string };
    food: { breakfast: number; lunch: number; dinner: number; snacks: number };
    localTransport: { taxi: number; public: number; rental: number };
    activities: { attractions: number; tours: number; experiences: number };
  };
  savings: {
    amount: number;
    tips: string[];
  };
  splurges: {
    amount: number;
    recommendations: string[];
  };
  currency: {
    usd: number;
    local: { amount: number; code: string };
    cny: number;
  };
  highlights: string[];
  warnings: string[];
}

export default function NewTripPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<DestinationSuggestion[]>([]);
  const [step, setStep] = useState(1);
  const [showDestinations, setShowDestinations] = useState(false);
  const [filteredDestinations, setFilteredDestinations] = useState<string[]>([]);
  const [showStartingFrom, setShowStartingFrom] = useState(false);
  const [filteredStartingFrom, setFilteredStartingFrom] = useState<string[]>([]);
  const [budgetOptions, setBudgetOptions] = useState<BudgetOption[]>([]);
  const [loadingBudgetOptions, setLoadingBudgetOptions] = useState(false);
  const [selectedBudgetOption, setSelectedBudgetOption] = useState<BudgetOption | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    startingFrom: "",
    destination: "",
    startDate: "",
    endDate: "",
    duration: "",
    totalBudget: "",
    currency: "USD",
  });

  const [budgetPercentages, setBudgetPercentages] = useState<Record<string, number>>(
    CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.name]: cat.defaultPercent }), {})
  );

  const totalBudget = parseFloat(formData.totalBudget) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const budgetCategories = CATEGORIES.map((cat) => ({
        category: cat.name,
        budgetAmount: (totalBudget * budgetPercentages[cat.name]) / 100,
      })).filter(bc => bc.budgetAmount > 0);

      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          totalBudget,
          budgetCategories,
        }),
      });

      if (response.ok) {
        const trip = await response.json();
        router.push(`/trips/${trip.id}`);
      } else {
        alert("Failed to create trip");
      }
    } catch (error) {
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGetSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const response = await fetch("/api/ai/suggest-destinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget: totalBudget || undefined,
          interests: ["culture", "food", "adventure"],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion: DestinationSuggestion) => {
    setFormData({
      ...formData,
      destination: suggestion.destination,
      totalBudget: suggestion.estimatedBudget.toString(),
    });
    setShowSuggestions(false);
  };

  const applyPreset = (presetName: keyof typeof TRIP_PRESETS) => {
    setBudgetPercentages(TRIP_PRESETS[presetName]);
  };

  const handlePercentageChange = (category: string, value: number) => {
    const newPercentages = { ...budgetPercentages, [category]: value };
    setBudgetPercentages(newPercentages);
  };

  const handleDestinationChange = (value: string) => {
    setFormData({ ...formData, destination: value });

    if (value.length > 0) {
      const filtered = POPULAR_DESTINATIONS.filter(dest =>
        dest.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8);
      setFilteredDestinations(filtered);
      setShowDestinations(filtered.length > 0);
    } else {
      setShowDestinations(false);
      setFilteredDestinations([]);
    }
  };

  const selectDestination = (dest: string) => {
    setFormData({ ...formData, destination: dest });
    setShowDestinations(false);
  };

  const handleStartingFromChange = (value: string) => {
    setFormData({ ...formData, startingFrom: value });

    if (value.length > 0) {
      const filtered = POPULAR_DESTINATIONS.filter(dest =>
        dest.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8);
      setFilteredStartingFrom(filtered);
      setShowStartingFrom(filtered.length > 0);
    } else {
      setShowStartingFrom(false);
      setFilteredStartingFrom([]);
    }
  };

  const selectStartingFrom = (dest: string) => {
    setFormData({ ...formData, startingFrom: dest });
    setShowStartingFrom(false);
  };

  const handleStartDateChange = (date: string) => {
    setFormData({ ...formData, startDate: date });
    // Auto-calculate end date if duration is set
    if (formData.duration && date) {
      const start = new Date(date);
      const days = parseInt(formData.duration);
      const end = new Date(start);
      end.setDate(start.getDate() + days);
      setFormData({ ...formData, startDate: date, endDate: end.toISOString().split('T')[0] });
    }
  };

  const handleDurationChange = (days: string) => {
    setFormData({ ...formData, duration: days });
    // Auto-calculate end date if start date is set
    if (formData.startDate && days) {
      const start = new Date(formData.startDate);
      const daysNum = parseInt(days);
      const end = new Date(start);
      end.setDate(start.getDate() + daysNum);
      setFormData({ ...formData, duration: days, endDate: end.toISOString().split('T')[0] });
    }
  };

  const generateBudgetOptions = async () => {
    if (!formData.destination || !formData.duration) return;

    setLoadingBudgetOptions(true);
    try {
      const response = await fetch("/api/ai/generate-budget-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startingFrom: formData.startingFrom,
          destination: formData.destination,
          duration: parseInt(formData.duration),
          travelers: 2,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBudgetOptions(data.options);
      }
    } catch (error) {
      console.error("Error generating budget options:", error);
    } finally {
      setLoadingBudgetOptions(false);
    }
  };

  const handleStep1Next = () => {
    generateBudgetOptions();
    setStep(2);
  };

  const selectBudgetOption = (option: BudgetOption) => {
    setSelectedBudgetOption(option);
    setFormData({ ...formData, totalBudget: option.totalBudget.toString() });

    // Set budget percentages based on breakdown
    const total = option.totalBudget;
    const transportTotal = option.breakdown.flights + option.breakdown.localTransport;
    const newPercentages = {
      "Accommodation": (option.breakdown.accommodation / total) * 100,
      "Food & Dining": (option.breakdown.food / total) * 100,
      "Transportation": (transportTotal / total) * 100,
      "Activities": (option.breakdown.activities / total) * 100,
      "Shopping": (option.breakdown.shopping / total) * 100,
      "Other": ((option.breakdown.insurance + option.breakdown.miscellaneous) / total) * 100,
    };
    setBudgetPercentages(newPercentages);
  };

  const totalPercentage = Object.values(budgetPercentages).reduce((sum, val) => sum + (val || 0), 0);
  const remainingPercentage = 100 - totalPercentage;

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-zinc-900 mb-2 tracking-tight">Plan New Trip</h1>
              <p className="text-zinc-500 text-lg">Create your perfect travel budget in 3 easy steps</p>
            </div>
            <button
              type="button"
              onClick={handleGetSuggestions}
              disabled={loadingSuggestions}
              className="hidden md:inline-flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-full hover:bg-zinc-800 transition-all duration-200 font-medium disabled:opacity-50 shadow-sm"
            >
              <span className="text-xl">✨</span>
              {loadingSuggestions ? "Loading..." : "AI Suggestions"}
            </button>
          </div>

          {/* Progress Steps */}
          <div className="grid grid-cols-3 gap-0 mt-8 max-w-2xl mx-auto">
            {[
              { num: 1, label: "Trip Details" },
              { num: 2, label: "Budget" },
              { num: 3, label: "Allocate" }
            ].map((s, idx) => (
              <div key={s.num} className="flex flex-col items-center">
                <div className="flex items-center w-full">
                  {idx > 0 && (
                    <div className={`flex-1 h-0.5 rounded ${
                      step > idx ? 'bg-zinc-900' : 'bg-zinc-200'
                    }`} />
                  )}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all mx-2 border-2 ${
                    step >= s.num
                      ? 'bg-zinc-900 border-zinc-900 text-white'
                      : 'bg-white border-zinc-200 text-zinc-400'
                  }`}>
                    {s.num}
                  </div>
                  {idx < 2 && (
                    <div className={`flex-1 h-0.5 rounded ${
                      step > s.num ? 'bg-zinc-900' : 'bg-zinc-200'
                    }`} />
                  )}
                </div>
                <span className={`mt-2 text-sm font-medium ${
                  step >= s.num ? 'text-zinc-900' : 'text-zinc-400'
                }`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 mb-8 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-zinc-900">✨ AI Destination Suggestions</h2>
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-zinc-500 hover:text-zinc-700 p-2"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="bg-white p-4 rounded-xl border border-zinc-200 hover:border-zinc-400 hover:shadow-md cursor-pointer transition-all group"
                >
                  <h3 className="font-bold text-lg text-zinc-900 group-hover:text-zinc-700 transition-colors">
                    {suggestion.destination}
                  </h3>
                  <p className="text-zinc-500 text-sm mt-1 line-clamp-2">{suggestion.reason}</p>
                  <p className="font-bold text-zinc-900 text-lg mt-2">${suggestion.estimatedBudget.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Trip Details */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 space-y-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    What should we call this trip? <span className="text-zinc-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field text-lg"
                    placeholder="e.g., Summer in Europe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Where are you starting from?
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xl pointer-events-none z-10 opacity-50">✈️</div>
                    <input
                      type="text"
                      required
                      value={formData.startingFrom}
                      onChange={(e) => handleStartingFromChange(e.target.value)}
                      onFocus={() => {
                        if (formData.startingFrom.length > 0) {
                          const filtered = POPULAR_DESTINATIONS.filter(dest =>
                            dest.toLowerCase().includes(formData.startingFrom.toLowerCase())
                          ).slice(0, 8);
                          if (filtered.length > 0) {
                            setFilteredStartingFrom(filtered);
                            setShowStartingFrom(true);
                          }
                        }
                      }}
                      className="input-field pl-12 text-lg"
                      placeholder="e.g., New York, USA"
                      autoComplete="off"
                    />
                    {showStartingFrom && filteredStartingFrom.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-lg max-h-64 overflow-y-auto z-20">
                        {filteredStartingFrom.map((dest, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => selectStartingFrom(dest)}
                            className="w-full text-left px-4 py-3 hover:bg-zinc-50 transition-colors flex items-center gap-3 border-b border-zinc-100 last:border-b-0"
                          >
                            <span className="text-xl opacity-50">✈️</span>
                            <span className="text-zinc-900">{dest}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Where are you heading?
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xl pointer-events-none z-10 opacity-50">📍</div>
                    <input
                      type="text"
                      required
                      value={formData.destination}
                      onChange={(e) => handleDestinationChange(e.target.value)}
                      onFocus={() => {
                        if (formData.destination.length > 0) {
                          const filtered = POPULAR_DESTINATIONS.filter(dest =>
                            dest.toLowerCase().includes(formData.destination.toLowerCase())
                          ).slice(0, 8);
                          if (filtered.length > 0) {
                            setFilteredDestinations(filtered);
                            setShowDestinations(true);
                          }
                        }
                      }}
                      className="input-field pl-12 text-lg"
                      placeholder="e.g., Paris, France"
                      autoComplete="off"
                    />
                    {showDestinations && filteredDestinations.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-lg max-h-64 overflow-y-auto z-20">
                        {filteredDestinations.map((dest, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => selectDestination(dest)}
                            className="w-full text-left px-4 py-3 hover:bg-zinc-50 transition-colors flex items-center gap-3 border-b border-zinc-100 last:border-b-0"
                          >
                            <span className="text-xl opacity-50">📍</span>
                            <span className="text-zinc-900">{dest}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <CalendarPicker
                      label="Start Date"
                      value={formData.startDate}
                      onChange={handleStartDateChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Duration (days)
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xl pointer-events-none z-10 opacity-50">⏱️</div>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.duration}
                        onChange={(e) => handleDurationChange(e.target.value)}
                        className="input-field pl-12"
                        placeholder="e.g., 7"
                      />
                    </div>
                  </div>
                </div>

                {formData.endDate && (
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-900">
                      <span className="text-lg text-green-500">✓</span>
                      <span className="font-medium">
                        Your trip will end on {new Date(formData.endDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleStep1Next}
                  disabled={!formData.startingFrom || !formData.destination || !formData.startDate || !formData.duration || !formData.endDate}
                  className="bg-zinc-900 text-white px-8 py-3 rounded-full hover:bg-zinc-800 transition-all duration-200 font-medium disabled:opacity-50 shadow-sm"
                >
                  Next Step →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Budget Options */}
          {step === 2 && (
            <div className="space-y-6">
              {loadingBudgetOptions ? (
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-16">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin text-4xl">✨</div>
                    <p className="text-lg text-zinc-600">Generating personalized budget options for your trip...</p>
                  </div>
                </div>
              ) : budgetOptions.length > 0 ? (
                <>
                  <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
                    <h3 className="text-xl font-bold text-zinc-900 mb-2">Choose Your Budget Level</h3>
                    <p className="text-zinc-500 text-sm">
                      Based on {formData.destination} for {formData.duration} days (2 travelers)
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {budgetOptions.map((option) => {
                      const pieData = [
                        { name: "Flights", value: option.breakdown.flights, color: "#3b82f6" },
                        { name: "Accommodation", value: option.breakdown.accommodation, color: "#10b981" },
                        { name: "Food", value: option.breakdown.food, color: "#f59e0b" },
                        { name: "Local Transport", value: option.breakdown.localTransport, color: "#8b5cf6" },
                        { name: "Activities", value: option.breakdown.activities, color: "#ec4899" },
                        { name: "Shopping", value: option.breakdown.shopping, color: "#06b6d4" },
                        { name: "Insurance", value: option.breakdown.insurance, color: "#84cc16" },
                        { name: "Misc", value: option.breakdown.miscellaneous, color: "#6b7280" },
                      ].filter(item => item.value > 0);

                      return (
                        <div
                          key={option.level}
                          onClick={() => selectBudgetOption(option)}
                          className={`bg-white rounded-2xl shadow-sm border-2 cursor-pointer transition-all hover:shadow-md overflow-hidden ${
                            selectedBudgetOption?.level === option.level
                              ? 'border-zinc-900 ring-1 ring-zinc-900'
                              : 'border-zinc-200 hover:border-zinc-300'
                          }`}
                        >
                          <div className="p-6 space-y-4">
                            {/* Header */}
                            <div className="text-center">
                              <div className="text-4xl mb-2">
                                {option.level === 'comfortable' && '🌱'}
                                {option.level === 'balanced' && '⭐'}
                                {option.level === 'luxury' && '💎'}
                              </div>
                              <h4 className="text-2xl font-bold text-zinc-900 capitalize">{option.level}</h4>
                              <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{option.description}</p>
                            </div>

                            {/* Price */}
                            <div className="text-center py-4 bg-zinc-50 rounded-xl border border-zinc-100">
                              <div className="text-3xl font-bold text-zinc-900">
                                ${option.totalBudget.toLocaleString()}
                              </div>
                              <div className="text-sm text-zinc-500 mt-1">
                                ${option.perPersonPerDay.toFixed(0)}/person/day
                              </div>
                            </div>

                            {/* Pie Chart */}
                            <div className="h-48">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    paddingAngle={2}
                                    dataKey="value"
                                  >
                                    {pieData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    formatter={(value: number) => `$${value.toLocaleString()}`}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>

                            {/* Detailed Breakdown */}
                            <details className="group">
                              <summary className="cursor-pointer text-sm font-semibold text-zinc-600 hover:text-zinc-900 flex items-center justify-between py-2">
                                <span>📊 Detailed Breakdown</span>
                                <span className="text-zinc-400 group-open:rotate-180 transition-transform">▼</span>
                              </summary>
                              <div className="mt-3 space-y-3 text-xs">
                                {/* Flights */}
                                <div className="bg-zinc-50 rounded-lg p-3">
                                  <div className="font-semibold text-zinc-900 mb-1">✈️ Flights (${option.breakdown.flights.toLocaleString()})</div>
                                  <div className="text-zinc-600 space-y-1">
                                    <div>• Tickets: ${option.detailedBreakdown.flights.economy.toLocaleString()}</div>
                                    <div>• Baggage: ${option.detailedBreakdown.flights.bags.toLocaleString()}</div>
                                  </div>
                                </div>

                                {/* Accommodation */}
                                <div className="bg-zinc-50 rounded-lg p-3">
                                  <div className="font-semibold text-zinc-900 mb-1">🏨 Accommodation (${option.breakdown.accommodation.toLocaleString()})</div>
                                  <div className="text-zinc-600 space-y-1">
                                    <div>• {option.detailedBreakdown.accommodation.type}</div>
                                    <div>• ${option.detailedBreakdown.accommodation.perNight.toLocaleString()}/night</div>
                                  </div>
                                </div>

                                {/* Food */}
                                <div className="bg-zinc-50 rounded-lg p-3">
                                  <div className="font-semibold text-zinc-900 mb-1">🍽️ Food (${option.breakdown.food.toLocaleString()})</div>
                                  <div className="text-zinc-600 space-y-1">
                                    <div>• Breakfast: ${option.detailedBreakdown.food.breakfast.toLocaleString()}</div>
                                    <div>• Lunch: ${option.detailedBreakdown.food.lunch.toLocaleString()}</div>
                                    <div>• Dinner: ${option.detailedBreakdown.food.dinner.toLocaleString()}</div>
                                    <div>• Snacks: ${option.detailedBreakdown.food.snacks.toLocaleString()}</div>
                                  </div>
                                </div>

                                {/* Activities */}
                                <div className="bg-zinc-50 rounded-lg p-3">
                                  <div className="font-semibold text-zinc-900 mb-1">🎭 Activities (${option.breakdown.activities.toLocaleString()})</div>
                                  <div className="text-zinc-600 space-y-1">
                                    <div>• Attractions: ${option.detailedBreakdown.activities.attractions.toLocaleString()}</div>
                                    <div>• Tours: ${option.detailedBreakdown.activities.tours.toLocaleString()}</div>
                                    <div>• Experiences: ${option.detailedBreakdown.activities.experiences.toLocaleString()}</div>
                                  </div>
                                </div>
                              </div>
                            </details>

                            {/* Highlights */}
                            {option.highlights && option.highlights.length > 0 && (
                              <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                                <div className="text-sm font-semibold text-green-900 mb-2">✨ Highlights</div>
                                <ul className="text-xs text-green-700 space-y-1">
                                  {option.highlights.slice(0, 2).map((highlight, idx) => (
                                    <li key={idx}>• {highlight}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Savings Tips */}
                            {option.savings && option.savings.tips.length > 0 && (
                              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                                <div className="text-sm font-semibold text-yellow-900 mb-1">💡 Save ${option.savings.amount}</div>
                                <ul className="text-xs text-yellow-700 space-y-1">
                                  {option.savings.tips.slice(0, 2).map((tip, idx) => (
                                    <li key={idx}>• {tip}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Currency Conversions */}
                            <div className="pt-3 border-t border-zinc-100 grid grid-cols-3 gap-2 text-xs">
                              <div className="text-center">
                                <div className="text-zinc-500">USD</div>
                                <div className="font-bold text-zinc-900">${(option.currency.usd/1000).toFixed(1)}k</div>
                              </div>
                              <div className="text-center">
                                <div className="text-zinc-500">{option.currency.local.code}</div>
                                <div className="font-bold text-zinc-900">{(option.currency.local.amount/1000).toFixed(1)}k</div>
                              </div>
                              <div className="text-center">
                                <div className="text-zinc-500">CNY</div>
                                <div className="font-bold text-zinc-900">¥{(option.currency.cny/1000).toFixed(1)}k</div>
                              </div>
                            </div>

                            {/* Selection indicator */}
                            {selectedBudgetOption?.level === option.level && (
                              <div className="text-center py-2 bg-zinc-900 text-white rounded-lg font-semibold text-sm">
                                ✓ Selected
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 bg-white text-zinc-700 px-6 py-3 rounded-full border border-zinc-300 hover:bg-zinc-50 transition-all font-medium"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        disabled={!selectedBudgetOption}
                        className="flex-1 bg-zinc-900 text-white px-6 py-3 rounded-full hover:bg-zinc-800 transition-all duration-200 font-medium disabled:opacity-50 shadow-sm"
                      >
                        Next Step →
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
                  <p className="text-zinc-600 text-center">Unable to generate budget options. Please go back and try again.</p>
                  <div className="flex justify-center mt-6">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="bg-white text-zinc-700 px-6 py-3 rounded-full border border-zinc-300 hover:bg-zinc-50 transition-all font-medium"
                    >
                      ← Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Budget Allocation with Sliders */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Header Summary */}
              <div className="bg-zinc-900 rounded-2xl p-6 text-white">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Fine-tune Your Budget</h3>
                    <p className="text-sm text-zinc-400">Adjust category allocations with the sliders below</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">
                      ${isNaN(totalBudget) ? 0 : totalBudget.toLocaleString()}
                    </div>
                    <div className="text-sm text-zinc-400">Total Budget</div>
                  </div>
                </div>
              </div>

              {/* Presets */}
              <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
                <h3 className="font-semibold text-zinc-900 mb-4">⚡ Quick Presets - Choose Your Travel Style</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { key: 'foodie', label: 'Foodie', icon: '🍜', desc: '45% food' },
                    { key: 'fineDining', label: 'Fine Dining', icon: '🥂', desc: '50% food' },
                    { key: 'resort', label: 'Resort', icon: '🏖️', desc: '50% accommodation' },
                    { key: 'workTrip', label: 'Work Trip', icon: '💼', desc: 'Business focus' },
                    { key: 'adventure', label: 'Adventure', icon: '🏔️', desc: '35% activities' },
                    { key: 'sightseeing', label: 'Sightseeing', icon: '📸', desc: 'Balanced exploration' },
                  ].map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => applyPreset(preset.key as keyof typeof TRIP_PRESETS)}
                      className="px-3 py-4 rounded-xl border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 transition-all font-medium text-sm flex flex-col items-center gap-2 group"
                    >
                      <span className="text-3xl group-hover:scale-110 transition-transform">{preset.icon}</span>
                      <span className="font-semibold text-zinc-900">{preset.label}</span>
                      <span className="text-xs text-zinc-500">{preset.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Allocation */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left: Sliders */}
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                    <h3 className="font-semibold text-zinc-900 text-lg">📊 Category Breakdown</h3>
                    <div className={`text-sm font-semibold px-4 py-2 rounded-full ${
                      Math.abs(remainingPercentage) < 1 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {remainingPercentage > 0 ? '+' : ''}{isNaN(remainingPercentage) ? 0 : remainingPercentage.toFixed(0)}% {remainingPercentage > 0 ? 'remaining' : 'over'}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {CATEGORIES.map((cat) => {
                      const percentage = budgetPercentages[cat.name] || 0;
                      const amount = (totalBudget * percentage) / 100;
                      return (
                        <div key={cat.name} className="p-4 rounded-xl hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-100">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-zinc-100 text-lg">
                                <span>{cat.icon}</span>
                              </div>
                              <div>
                                <div className="font-semibold text-zinc-900">{cat.name}</div>
                                <div className="text-xs text-zinc-500">{percentage.toFixed(1)}% of budget</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg text-zinc-900">
                                ${isNaN(amount) ? 0 : amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </div>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="0.5"
                            value={percentage}
                            onChange={(e) => handlePercentageChange(cat.name, parseFloat(e.target.value))}
                            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-zinc-200 accent-zinc-900"
                            style={{
                              background: `linear-gradient(to right, ${cat.color} 0%, ${cat.color} ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Visual Preview */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 h-fit sticky top-24">
                  <h3 className="font-semibold text-zinc-900 mb-4 text-lg">💰 Budget Preview</h3>

                  {/* Stacked Bar Chart */}
                  <div className="mb-6">
                    <div className="h-12 rounded-xl overflow-hidden flex w-full bg-zinc-100">
                      {CATEGORIES.map((cat) => {
                        const percentage = budgetPercentages[cat.name] || 0;
                        if (percentage === 0 || isNaN(percentage)) return null;
                        return (
                          <div
                            key={cat.name}
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: cat.color
                            }}
                            className="relative group transition-all hover:opacity-90"
                            title={`${cat.name}: ${percentage.toFixed(1)}%`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm pb-2 border-b border-zinc-100">
                      <span className="text-zinc-500">Total Budget</span>
                      <span className="font-bold text-zinc-900">${isNaN(totalBudget) ? 0 : totalBudget.toLocaleString()}</span>
                    </div>
                    {CATEGORIES.map((cat) => {
                      const percentage = budgetPercentages[cat.name] || 0;
                      const amount = (totalBudget * percentage) / 100;
                      if (amount === 0 || isNaN(amount)) return null;
                      return (
                        <div key={cat.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-zinc-600">{cat.name}</span>
                          </div>
                          <span className="font-medium text-zinc-900">
                            ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 bg-white text-zinc-700 px-6 py-3 rounded-full border border-zinc-300 hover:bg-zinc-50 transition-all font-medium"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || Math.abs(remainingPercentage) > 5}
                    className="flex-1 bg-zinc-900 text-white px-6 py-3 rounded-full hover:bg-zinc-800 transition-all duration-200 font-medium disabled:opacity-50 shadow-sm"
                  >
                    {loading ? "Creating..." : "Create Trip 🎉"}
                  </button>
                </div>
                {Math.abs(remainingPercentage) > 5 && (
                  <p className="text-sm text-yellow-600 mt-3 text-center bg-yellow-50 py-2 rounded-lg">
                    💡 Adjust sliders to reach 100% allocation (currently {(100 - remainingPercentage).toFixed(0)}%)
                  </p>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
