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
      className="group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105"
    >
      {/* Background Image with Overlay */}
      <div className="relative h-72 overflow-hidden">
        {isGenerating ? (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 animate-pulse flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-5xl mb-3 animate-bounce">✨</div>
              <p className="font-semibold">Generating anime art...</p>
            </div>
          </div>
        ) : imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={trip.destination}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
        )}

        {/* Days Until Trip Badge */}
        {daysUntilTrip > 0 && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
            <p className="text-xs font-semibold text-gray-600">In {daysUntilTrip} days</p>
          </div>
        )}

        {/* Content Overlay */}
        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          <div className="space-y-3">
            <div>
              <h2 className="text-3xl font-bold text-white drop-shadow-lg mb-1 group-hover:text-yellow-300 transition-colors">
                {trip.destination}
              </h2>
              {trip.name && trip.name !== trip.destination && (
                <p className="text-white/90 text-sm font-medium drop-shadow">
                  {trip.name}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 text-white/90 text-sm drop-shadow">
              <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <span>📅</span>
                <span className="font-medium">
                  {format(new Date(trip.startDate), "MMM d")} - {format(new Date(trip.endDate), "MMM d")}
                </span>
              </span>
              <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <span>⏱️</span>
                <span className="font-medium">{daysOfTrip} days</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Info Card */}
      <div className="bg-white p-5">
        <div className="space-y-4">
          {/* Budget Overview */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Total Budget</span>
            <span className="text-xl font-bold bg-gradient-sunset-pink bg-clip-text text-transparent">
              ${trip.totalBudget.toLocaleString()}
            </span>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">Budget Used</span>
              <span className={`text-sm font-bold ${
                trip.percentUsed > 100 ? "text-red-600" : "text-gray-900"
              }`}>
                {trip.percentUsed.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className={`h-3 rounded-full transition-all duration-700 ${
                  trip.percentUsed > 100
                    ? "bg-gradient-to-r from-red-500 to-red-600"
                    : trip.percentUsed > 80
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                    : "bg-gradient-sunset-pink"
                }`}
                style={{
                  width: `${Math.min(trip.percentUsed, 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Spent and Remaining */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3">
              <p className="text-xs text-blue-600 font-medium mb-1">Spent</p>
              <p className={`font-bold text-lg ${
                trip.percentUsed > 100 ? "text-red-600" : "text-blue-900"
              }`}>
                ${trip.totalSpent.toLocaleString()}
              </p>
            </div>
            <div className={`rounded-xl p-3 ${
              trip.remaining < 0
                ? "bg-gradient-to-br from-red-50 to-red-100"
                : "bg-gradient-to-br from-green-50 to-green-100"
            }`}>
              <p className={`text-xs font-medium mb-1 ${
                trip.remaining < 0 ? "text-red-600" : "text-green-600"
              }`}>
                {trip.remaining < 0 ? "Over" : "Remaining"}
              </p>
              <p className={`font-bold text-lg ${
                trip.remaining < 0 ? "text-red-600" : "text-green-900"
              }`}>
                ${Math.abs(trip.remaining).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hover Effect Indicator */}
      <div className="absolute inset-0 border-4 border-transparent group-hover:border-yellow-400 rounded-3xl transition-all duration-300 pointer-events-none" />
    </Link>
  );
}
