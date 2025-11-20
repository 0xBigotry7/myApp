"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import Image from "next/image";

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

export default function TripCard({ trip }: TripCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(
    trip.destinationImageUrl || null
  );
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Generate image if not already generated
    if (!imageUrl && !isGenerating) {
      generateImage();
    }
  }, []);

  const generateImage = async () => {
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

        // Save image URL to database
        await fetch(`/api/trips/${trip.id}/update-image`, {
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
  };

  const daysUntilTrip = Math.ceil(
    (new Date(trip.startDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const daysOfTrip = Math.ceil(
    (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white border border-zinc-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-zinc-200"
    >
      {/* Image Section */}
      <div className="relative h-56 w-full overflow-hidden bg-zinc-100">
        {isGenerating ? (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-50">
            <div className="text-center">
              <div className="mb-2 text-3xl animate-pulse">✨</div>
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Generating view...</p>
            </div>
          </div>
        ) : imageUrl ? (
          <Image
            src={imageUrl}
            alt={trip.destination}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-100 flex items-center justify-center">
            <span className="text-5xl opacity-10 grayscale">✈️</span>
          </div>
        )}
        
        {/* Overlay Gradient - Enhanced */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

        {/* Days Badge */}
        {daysUntilTrip > 0 && (
          <div className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-zinc-900 backdrop-blur-sm shadow-sm">
            {daysUntilTrip} days left
          </div>
        )}
        
        {/* Destination Overlay Title (Optional visual style) */}
        <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
          <p className="text-xs font-medium text-zinc-200 uppercase tracking-wider">Explore</p>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight group-hover:text-zinc-700 transition-colors line-clamp-1 mb-1">
            {trip.destination}
          </h2>
          {trip.name && trip.name !== trip.destination && (
            <p className="text-sm text-zinc-500 line-clamp-1 font-medium">{trip.name}</p>
          )}
          <div className="mt-3 flex items-center gap-3 text-sm text-zinc-500">
            <span className="bg-zinc-50 px-2 py-1 rounded-md border border-zinc-100">
              {format(new Date(trip.startDate), "MMM d")} - {format(new Date(trip.endDate), "MMM d")}
            </span>
            <span className="text-zinc-300">•</span>
            <span>{daysOfTrip} days</span>
          </div>
        </div>

        <div className="mt-auto space-y-4 border-t border-zinc-50 pt-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-zinc-500">Budget Usage</span>
              <span className={`${trip.percentUsed > 100 ? "text-red-600" : "text-zinc-900"}`}>
                {trip.percentUsed.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  trip.percentUsed > 100 ? "bg-red-500" : "bg-zinc-900"
                }`}
                style={{ width: `${Math.min(trip.percentUsed, 100)}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <p className="text-xs text-zinc-400 mb-0.5 uppercase tracking-wider">Spent</p>
              <p className="font-bold text-zinc-900 text-lg">
                ${trip.totalSpent.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-400 mb-0.5 uppercase tracking-wider">Remaining</p>
              <p className={`font-bold text-lg ${trip.remaining < 0 ? "text-red-600" : "text-zinc-900"}`}>
                ${Math.abs(trip.remaining).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
