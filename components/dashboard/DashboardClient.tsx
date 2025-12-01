"use client";

import dynamic from "next/dynamic";
import { motion, AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";
import {
  Plane,
  Wallet,
  Map as MapIcon,
  Heart,
  Plus,
  CreditCard,
  Luggage,
  Calendar,
  ArrowRight,
  Sparkles,
  Loader2,
  Globe,
  Spade,
  RefreshCw,
  Activity,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import SpotlightCard from "@/components/ui/SpotlightCard";
import Counter from "@/components/ui/Counter";
import LiveClock from "@/components/dashboard/LiveClock";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { handleSignOut } from "@/app/actions";
import { useState, useCallback, memo } from "react";

interface DashboardProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  stats: {
    activeTrip: any;
    upcomingTrip: any;
    lastTrip: any;
    tripStatus: 'active' | 'upcoming' | 'past' | null;
    totalNetWorth: number;
    visitedCount: number;
    recentExpenses: any[];
    recentMemory: any;
    greeting: string;
    destinations?: Array<{
      latitude: number;
      longitude: number;
      city: string;
      country: string;
    }>;
  };
  t: any;
}

// Optimized animation variants - faster, simpler transitions
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // Faster stagger
      delayChildren: 0.1,
    },
  },
};

const item = {
  hidden: { y: 16, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: {
      type: "tween" as const,
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1] as const, // CSS ease-out equivalent
    }
  },
};

function DashboardClient({ user, stats, t }: DashboardProps) {
  const { activeTrip, upcomingTrip, lastTrip, tripStatus, totalNetWorth, visitedCount, recentExpenses = [], recentMemory, greeting } = stats;
  const featuredTrip = activeTrip || upcomingTrip || lastTrip;
  const firstName = user.name?.split(' ')[0] || "Traveler";
  const userInitial = user?.name?.charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase() ?? "U";
  const userDisplayName = user?.name ?? user?.email ?? "User";

  // State for AI Image Generation
  const [tripImage, setTripImage] = useState<string | null>(
    featuredTrip?.imageUrl || featuredTrip?.destinationImageUrl || null
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateImage = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!featuredTrip || isGenerating) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-destination-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: featuredTrip.destination }),
      });

      if (response.ok) {
        const data = await response.json();
        setTripImage(data.imageUrl);

        // Save to DB in background - don't await
        fetch(`/api/trips/${featuredTrip.id}/update-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: data.imageUrl }),
        });
      }
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [featuredTrip, isGenerating]);

  return (
    <div className="relative min-h-screen bg-[#F5F5F7] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-x-hidden selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100 transition-colors duration-300">

      {/* Subtler Static Background instead of 3D Globe */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-blue-100/40 dark:bg-blue-900/20 blur-3xl" />
        <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-purple-100/40 dark:bg-purple-900/20 blur-3xl" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 dark:opacity-10 mix-blend-overlay" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-4"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-zinc-500 dark:text-zinc-400 font-medium text-lg">{format(new Date(), 'EEEE, MMMM d')}</h2>
              <LiveClock />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-zinc-900 dark:text-white drop-shadow-sm">
              {greeting}, <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 animate-gradient-x">
                {firstName}
              </span>
            </h1>
          </div>

          <div className="flex gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/expenses/add" className="group relative flex items-center gap-2 px-6 py-3 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md rounded-full shadow-lg hover:shadow-blue-500/20 transition-all duration-300 text-zinc-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 border border-white/60 dark:border-zinc-700/60">
                <div className="p-1 bg-blue-100 dark:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-400 group-hover:rotate-90 transition-transform duration-500">
                  <Plus size={18} />
                </div>
                <span className="font-semibold text-sm">New Transaction</span>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]"
        >

          {/* Hero Card: Featured Trip */}
          <motion.div variants={item} className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 h-full">
            <SpotlightCard className="h-full border-0 bg-transparent shadow-2xl overflow-hidden group">
              {featuredTrip ? (
                <Link href={`/trips/${featuredTrip.id}`} className="block h-full w-full relative">
                  <AnimatePresence>
                    {tripImage ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 h-full w-full"
                      >
                        <motion.img
                          src={tripImage}
                          alt={featuredTrip.name}
                          className="w-full h-full object-cover"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      </motion.div>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700">
                        {/* Abstract Pattern */}
                        <div className="absolute inset-0 opacity-20 bg-[url('/noise.png')] mix-blend-overlay" />
                      </div>
                    )}
                  </AnimatePresence>

                  {/* Status & Action Buttons */}
                  <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10 pointer-events-none">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-md uppercase tracking-wider shadow-lg ring-1",
                      tripStatus === 'active' ? 'bg-green-500/80 text-white ring-green-400/50' :
                        tripStatus === 'upcoming' ? 'bg-blue-500/80 text-white ring-blue-400/50' :
                          'bg-white/20 text-white ring-white/30'
                    )}>
                      {tripStatus === 'active' ? 'Current Trip' : tripStatus === 'upcoming' ? 'Up Next' : 'Last Adventure'}
                    </span>

                    <div className="flex items-center gap-3 pointer-events-auto">
                      {!tripImage && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleGenerateImage}
                          disabled={isGenerating}
                          className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/20 hover:bg-white/30 transition-colors shadow-lg"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>Creating Magic...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={14} className="text-yellow-300" />
                              <span>Generate Theme</span>
                            </>
                          )}
                        </motion.button>
                      )}

                      <motion.div
                        className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors shadow-lg border border-white/20"
                        whileHover={{ rotate: 45 }}
                      >
                        <ArrowRight size={20} className="-rotate-45" />
                      </motion.div>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 p-8 w-full text-white z-10">
                    <motion.h3
                      className="text-4xl lg:text-5xl font-bold mb-4 leading-tight drop-shadow-md"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      {featuredTrip.name}
                    </motion.h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-white/90 font-medium">
                      <div className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-full backdrop-blur-md border border-white/10 hover:bg-black/40 transition-colors">
                        <Calendar size={16} className="text-blue-300" />
                        {format(new Date(featuredTrip.startDate), 'MMM d')} - {format(new Date(featuredTrip.endDate), 'MMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-full backdrop-blur-md border border-white/10 hover:bg-black/40 transition-colors">
                        <MapIcon size={16} className="text-pink-300" />
                        {featuredTrip.destination}
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <Link href="/trips/new" className="h-full w-full flex flex-col items-center justify-center p-8 text-center bg-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50" />
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    className="relative w-24 h-24 bg-blue-100/80 text-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl border border-blue-200"
                  >
                    <Plane size={48} />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-2 relative">Plan your first trip</h3>
                  <p className="text-zinc-500 max-w-xs mx-auto relative">The world is waiting. Start your adventure today.</p>
                </Link>
              )}
            </SpotlightCard>
          </motion.div>

          {/* Finance Summary */}
          <motion.div variants={item} className="col-span-1 h-full">
            <Link href="/finance" className="block h-full">
              <SpotlightCard className="h-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl group cursor-pointer hover:border-green-200/50 dark:hover:border-green-800/50 transition-colors">
                <div className="absolute top-0 right-0 w-40 h-40 bg-green-400/10 dark:bg-green-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-green-400/20 dark:group-hover:bg-green-500/20 transition-all duration-500" />

                <div className="p-6 h-full flex flex-col justify-between relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="p-3.5 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm ring-4 ring-green-50 dark:ring-green-900/30">
                      <Wallet size={24} />
                    </div>
                    <ArrowRight size={20} className="text-zinc-300 dark:text-zinc-600 group-hover:text-green-600 dark:group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm mb-1">Net Worth</p>
                    <h3 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                      <Counter value={totalNetWorth} prefix="$" />
                    </h3>
                  </div>
                </div>
              </SpotlightCard>
            </Link>
          </motion.div>

          {/* Map Stats */}
          <motion.div variants={item} className="col-span-1 h-full">
            <Link href="/map" className="block h-full">
              <SpotlightCard className="h-full bg-zinc-900 border-zinc-800 hover:border-zinc-700">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                  className="absolute -right-12 -top-12 opacity-10 text-blue-400 pointer-events-none"
                >
                  <Globe size={200} strokeWidth={0.5} />
                </motion.div>

                <div className="p-6 h-full flex flex-col justify-between relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="p-3.5 bg-white/10 text-white rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform duration-300 border border-white/10 ring-4 ring-white/5">
                      <MapIcon size={24} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-4xl font-bold text-white mb-1">
                      <Counter value={visitedCount} />
                    </h3>
                    <p className="text-zinc-400 font-medium text-sm">Countries Visited</p>
                  </div>
                </div>
              </SpotlightCard>
            </Link>
          </motion.div>

          {/* Recent Expenses */}
          <motion.div variants={item} className="col-span-1 md:row-span-2 h-full">
            <SpotlightCard className="h-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl flex flex-col">
              <div className="p-6 pb-2 flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                  <div className="p-1.5 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-lg">
                    <CreditCard size={16} />
                  </div>
                  Recent
                </h3>
                <Link href="/expenses" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">See All</Link>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar mask-gradient-b">
                {recentExpenses.length > 0 ? (
                  recentExpenses.map((expense, i) => (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + (i * 0.1) }}
                      className="flex items-center justify-between gap-3 group/item p-3 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/80 rounded-2xl transition-all hover:scale-[1.02] cursor-default border border-transparent hover:border-zinc-100 dark:hover:border-zinc-700 hover:shadow-sm"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg flex-shrink-0 group-hover/item:bg-white dark:group-hover/item:bg-zinc-700 group-hover/item:shadow-inner transition-all">
                        {expense.category === 'Food' || expense.category === 'Food & Dining' ? '🍔' :
                          expense.category === 'Transportation' || expense.category === 'Transport' ? '🚕' :
                            expense.category === 'Shopping' ? '🛍️' :
                              expense.category === 'Accommodation' ? '🏨' :
                                expense.category === 'Entertainment' || expense.category === 'Activities' ? '🎭' :
                                  expense.category === 'Groceries' ? '🛒' : '💸'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">{expense.note || expense.category}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{format(new Date(expense.date), 'MMM d')}</p>
                      </div>
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 tabular-nums">-${expense.amount.toFixed(0)}</span>
                    </motion.div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 py-10">
                    <p className="text-sm">No recent expenses</p>
                  </div>
                )}
              </div>

              <div className="p-4 pt-2 border-t border-zinc-100/50 dark:border-zinc-800/50">
                <Link href="/expenses/add" className="w-full py-3 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-95 group/btn">
                  <Plus size={16} className="group-hover/btn:rotate-90 transition-transform" /> Add Expense
                </Link>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Timeline / Memory */}
          <motion.div variants={item} className="col-span-1 h-full">
            <Link href="/timeline" className="block h-full">
              <SpotlightCard className="h-full bg-gradient-to-br from-rose-50/50 to-orange-50/50 dark:from-rose-950/30 dark:to-orange-950/30 backdrop-blur-xl border-rose-100/50 dark:border-rose-900/30 hover:border-rose-200 dark:hover:border-rose-800">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 dark:bg-rose-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-rose-500/20 dark:group-hover:bg-rose-500/30 transition-all duration-500" />

                <div className="p-6 h-full flex flex-col justify-between relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="p-3.5 bg-white dark:bg-zinc-800 text-rose-500 dark:text-rose-400 rounded-2xl shadow-sm group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300 ring-4 ring-rose-50 dark:ring-rose-900/30">
                      <Heart size={24} className="fill-rose-500 dark:fill-rose-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-rose-600/70 dark:text-rose-400/70 font-bold text-xs mb-1 uppercase tracking-wider">Latest Memory</p>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight line-clamp-2 group-hover:text-rose-900 dark:group-hover:text-rose-300 transition-colors">
                      {recentMemory ? recentMemory.title : "Start your timeline"}
                    </h3>
                  </div>
                </div>
              </SpotlightCard>
            </Link>
          </motion.div>

          {/* Packing */}
          <motion.div variants={item} className="col-span-1 h-full">
            <Link href="/packing" className="block h-full">
              <SpotlightCard className="h-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl hover:border-blue-200/50 dark:hover:border-blue-800/50">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-blue-500/20 dark:group-hover:bg-blue-500/30 transition-all duration-500" />

                <div className="p-6 h-full flex flex-col justify-between relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="p-3.5 bg-blue-50 dark:bg-blue-900/50 text-blue-500 dark:text-blue-400 rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 ring-4 ring-blue-50/50 dark:ring-blue-900/30">
                      <Luggage size={24} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-blue-900 dark:group-hover:text-blue-300 transition-colors">Packing List</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Organize your gear</p>
                  </div>
                </div>
              </SpotlightCard>
            </Link>
          </motion.div>

          {/* My Trips */}
          <motion.div variants={item} className="col-span-1 h-full">
            <Link href="/trips" className="block h-full">
              <SpotlightCard className="h-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl hover:border-indigo-200/50 dark:hover:border-indigo-800/50">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-indigo-500/20 dark:group-hover:bg-indigo-500/30 transition-all duration-500" />
                <div className="p-6 h-full flex flex-col justify-between relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="p-3.5 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-500 dark:text-indigo-400 rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 ring-4 ring-indigo-50/50 dark:ring-indigo-900/30">
                      <Plane size={24} />
                    </div>
                    <ArrowRight size={20} className="text-zinc-300 dark:text-zinc-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-indigo-900 dark:group-hover:text-indigo-300 transition-colors">My Trips</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">View all adventures</p>
                  </div>
                </div>
              </SpotlightCard>
            </Link>
          </motion.div>

          {/* Poker */}
          <motion.div variants={item} className="col-span-1 h-full">
            <Link href="/poker" className="block h-full">
              <SpotlightCard className="h-full bg-gradient-to-br from-emerald-900 to-emerald-950 border-emerald-800 hover:border-emerald-700">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                <div className="p-6 h-full flex flex-col justify-between relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="p-3.5 bg-white/10 text-white rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform duration-300 border border-white/10 ring-4 ring-white/5">
                      <Spade size={24} />
                    </div>
                    <ArrowRight size={20} className="text-emerald-400/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Poker Night</h3>
                    <p className="text-emerald-300/70 text-sm">Track games & stats</p>
                  </div>
                </div>
              </SpotlightCard>
            </Link>
          </motion.div>

          {/* Converter */}
          <motion.div variants={item} className="col-span-1 h-full">
            <Link href="/converter" className="block h-full">
              <SpotlightCard className="h-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl hover:border-cyan-200/50 dark:hover:border-cyan-800/50">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-cyan-500/20 dark:group-hover:bg-cyan-500/30 transition-all duration-500" />
                <div className="p-6 h-full flex flex-col justify-between relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="p-3.5 bg-cyan-50 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 rounded-2xl group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300 ring-4 ring-cyan-50/50 dark:ring-cyan-900/30">
                      <RefreshCw size={24} />
                    </div>
                    <ArrowRight size={20} className="text-zinc-300 dark:text-zinc-600 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-cyan-900 dark:group-hover:text-cyan-300 transition-colors">Converter</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Currency exchange</p>
                  </div>
                </div>
              </SpotlightCard>
            </Link>
          </motion.div>

          {/* Health */}
          <motion.div variants={item} className="col-span-1 h-full">
            <Link href="/health" className="block h-full">
              <SpotlightCard className="h-full bg-gradient-to-br from-pink-50/50 to-purple-50/50 dark:from-pink-950/30 dark:to-purple-950/30 backdrop-blur-xl border-pink-100/50 dark:border-pink-900/30 hover:border-pink-200 dark:hover:border-pink-800">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 dark:bg-pink-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-pink-500/20 dark:group-hover:bg-pink-500/30 transition-all duration-500" />
                <div className="p-6 h-full flex flex-col justify-between relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="p-3.5 bg-white dark:bg-zinc-800 text-pink-500 dark:text-pink-400 rounded-2xl shadow-sm group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300 ring-4 ring-pink-50 dark:ring-pink-900/30">
                      <Activity size={24} />
                    </div>
                    <ArrowRight size={20} className="text-zinc-300 dark:text-zinc-600 group-hover:text-pink-600 dark:group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-pink-900 dark:group-hover:text-pink-300 transition-colors">Health</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Track wellness</p>
                  </div>
                </div>
              </SpotlightCard>
            </Link>
          </motion.div>

          {/* New Trip Shortcut */}
          <motion.div variants={item} className="col-span-1 h-full">
            <Link href="/trips/new" className="block h-full">
              <motion.div
                whileHover={{ scale: 0.98 }}
                whileTap={{ scale: 0.95 }}
                className="h-full rounded-[2.5rem] bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-700 p-6 flex flex-col items-center justify-center text-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-300 group cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3 group-hover:bg-white dark:group-hover:bg-zinc-700 group-hover:shadow-md transition-all duration-300 group-hover:scale-110">
                  <Plus size={28} className="text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
                </div>
                <span className="font-semibold text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white">Plan New Trip</span>
              </motion.div>
            </Link>
          </motion.div>

        </motion.div>

        {/* User Profile & Settings Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-8 mb-4"
        >
          <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 p-4 shadow-lg">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg shadow-lg">
                  {userInitial}
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">{userDisplayName}</p>
                  {user?.email && user?.name && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <LanguageSwitcher />
                
                <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700 mx-1" />
                
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Settings size={18} />
                  <span className="hidden sm:inline">Settings</span>
                </Link>
                
                <form action={handleSignOut}>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={18} />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Decorative gradient overlay at bottom for smooth fade */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F5F5F7] dark:from-zinc-950 to-transparent pointer-events-none z-0" />
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(DashboardClient);
