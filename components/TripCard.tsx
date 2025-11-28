"use client";

import { useState, useCallback, memo, useRef, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import Image from "next/image";
import { Calendar, MapPin, Sparkles } from "lucide-react";

interface TripCardProps {
  trip: {
    id: string;
    name: string;
    destination: string;
    startDate: Date;
    endDate: Date;
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    percentUsed: number;
    destinationImageUrl?: string | null;
  };
}

function TripCard({ trip }: TripCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(
    trip.destinationImageUrl || null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLAnchorElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px", threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Only generate image on explicit user action - NOT on mount
  const generateImage = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isGenerating) return;
    setIsGenerating(true);
    
    try {
      const response = await fetch("/api/ai/generate-destination-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: trip.destination }),
      });

      if (response.ok) {
        const data = await response.json();
        setImageUrl(data.imageUrl);
        // Update in background - don't await
        fetch(`/api/trips/${trip.id}/update-image`, {
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
  }, [trip.destination, trip.id, isGenerating]);

  const daysUntilTrip = Math.ceil(
    (new Date(trip.startDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );
  
  const durationDays = Math.ceil(
    (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <Link
      ref={cardRef}
      href={`/trips/${trip.id}`}
      className="group relative flex flex-col overflow-hidden rounded-[32px] bg-white dark:bg-zinc-900 shadow-lg shadow-zinc-200/50 dark:shadow-zinc-900/50 transition-all duration-300 hover:shadow-2xl hover:shadow-zinc-200/80 dark:hover:shadow-zinc-900/80 hover:-translate-y-1 ring-1 ring-zinc-100 dark:ring-zinc-800 will-change-transform"
    >
      {/* Image Container */}
      <div className="relative h-72 w-full overflow-hidden bg-zinc-900">
        {isGenerating ? (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
            <div className="text-center">
              <div className="mb-3 text-4xl animate-pulse">✨</div>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Generating view...</p>
            </div>
          </div>
        ) : imageUrl && isVisible ? (
          <Image
            src={imageUrl}
            alt={trip.destination}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAQMEAQUAAAAAAAAAAAAAAQACAwQFERIGITFBUWH/xAAVAQEBAAAAAAAAAAAAAAAAAAADBP/EABkRAAIDAQAAAAAAAAAAAAAAAAECAAMRIf/aAAwDAQACEQMRAD8AzGx8ap7hQwVMsz2Pkja9zQ3oCSNhQREqpI1CZJcUuqyxP//Z"
          />
        ) : !imageUrl ? (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 flex flex-col items-center justify-center gap-3">
            <span className="text-6xl opacity-30">✈️</span>
            <button
              onClick={generateImage}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/20 transition-colors"
            >
              <Sparkles size={14} className="text-yellow-300" />
              Generate Image
            </button>
          </div>
        ) : (
          <div className="absolute inset-0 bg-zinc-900 animate-pulse" />
        )}
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent opacity-60" />

        {/* Status Badge */}
        <div className="absolute top-5 right-5">
          {daysUntilTrip > 0 ? (
            <div className="rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-md border border-white/20 shadow-lg">
              {daysUntilTrip} days away
            </div>
          ) : daysUntilTrip <= 0 && Math.abs(daysUntilTrip) <= durationDays ? (
            <div className="rounded-full bg-emerald-500/90 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-md shadow-lg shadow-emerald-900/20">
              Active Trip
            </div>
          ) : (
            <div className="rounded-full bg-zinc-800/80 px-4 py-1.5 text-xs font-bold text-zinc-300 backdrop-blur-md border border-white/10">
              Completed
            </div>
          )}
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <h2 className="text-3xl font-black text-white tracking-tight mb-2 drop-shadow-sm">
            {trip.destination}
          </h2>
          
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-zinc-200 mb-6">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-zinc-400" />
              {format(new Date(trip.startDate), "MMM d")} - {format(new Date(trip.endDate), "MMM d")}
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-zinc-400" />
              {durationDays} days
            </div>
          </div>

          {/* Budget Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold tracking-wide uppercase">
              <span className="text-zinc-400">Budget Used</span>
              <span className={trip.percentUsed > 100 ? "text-rose-400" : "text-white"}>
                {trip.percentUsed.toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden backdrop-blur-sm">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  trip.percentUsed > 100 ? "bg-rose-500" : "bg-white"
                }`}
                style={{ width: `${Math.min(trip.percentUsed, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs pt-1">
              <span className="text-zinc-400 font-medium">${trip.totalSpent.toLocaleString()} spent</span>
              <span className="text-zinc-300 font-bold">${Math.abs(trip.remaining).toLocaleString()} left</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(TripCard);
