"use client";

import { useState, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from "react-simple-maps";

interface Destination {
  id: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  isFuture: boolean;
}

interface WorldMapProps {
  destinations: Destination[];
}

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Tourism popularity tiers by country (ISO 3166-1 alpha-3 codes)
const TOURISM_TIERS = {
  // Tier 1: Extremely Popular (80M+ tourists) - Bright colors
  tier1: new Set([
    "FRA", // France
    "ESP", // Spain
    "USA", // United States
    "CHN", // China
    "ITA", // Italy
    "TUR", // Turkey
    "MEX", // Mexico
  ]),

  // Tier 2: Very Popular (40-80M tourists) - Medium-bright colors
  tier2: new Set([
    "DEU", // Germany
    "THA", // Thailand
    "GBR", // United Kingdom
    "JPN", // Japan
    "AUT", // Austria
    "GRC", // Greece
    "MYS", // Malaysia
    "RUS", // Russia
    "CAN", // Canada
    "SAU", // Saudi Arabia
  ]),

  // Tier 3: Popular (20-40M tourists) - Medium colors
  tier3: new Set([
    "POL", // Poland
    "NLD", // Netherlands
    "ARE", // UAE
    "IND", // India
    "SGP", // Singapore
    "KOR", // South Korea
    "IDN", // Indonesia
    "PRT", // Portugal
    "AUS", // Australia
    "CHE", // Switzerland
    "VNM", // Vietnam
    "BRA", // Brazil
    "EGY", // Egypt
    "HUN", // Hungary
    "HRV", // Croatia
    "MAR", // Morocco
    "CZE", // Czech Republic
    "DNK", // Denmark
  ]),

  // Tier 4: Moderately Popular (10-20M tourists) - Lighter colors
  tier4: new Set([
    "ZAF", // South Africa
    "NOR", // Norway
    "SWE", // Sweden
    "BEL", // Belgium
    "ARG", // Argentina
    "PHL", // Philippines
    "TUN", // Tunisia
    "ROM", // Romania
    "IRL", // Ireland
    "JOR", // Jordan
    "FIN", // Finland
    "PER", // Peru
    "NZL", // New Zealand
  ]),
};

export default function WorldMap({ destinations }: WorldMapProps) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const visitedDestinations = destinations.filter((d) => !d.isFuture);
  const futureDestinations = destinations.filter((d) => d.isFuture);

  // Get visited country names (exact match from destinations)
  const visitedCountryNames = useMemo(() => {
    const names = new Set<string>();
    visitedDestinations.forEach((dest) => {
      names.add(dest.country.toLowerCase());
    });
    console.log("Visited countries:", Array.from(names));
    return names;
  }, [visitedDestinations]);

  // Function to determine country color based on popularity and visited status
  const getCountryColor = (geo: any) => {
    const countryName = geo.properties.name;
    const countryCode = geo.id; // ISO 3166-1 alpha-3 code

    // Check if country is visited (match by name, case-insensitive)
    const isVisited = visitedCountryNames.has(countryName.toLowerCase());

    if (isVisited) {
      return "#10B981"; // Emerald green for visited countries
    }

    // Color based on tourism popularity tier
    if (TOURISM_TIERS.tier1.has(countryCode)) {
      return "#F59E0B"; // Bright orange for extremely popular
    }
    if (TOURISM_TIERS.tier2.has(countryCode)) {
      return "#FBBF24"; // Yellow for very popular
    }
    if (TOURISM_TIERS.tier3.has(countryCode)) {
      return "#FCD34D"; // Light yellow for popular
    }
    if (TOURISM_TIERS.tier4.has(countryCode)) {
      return "#FDE68A"; // Very light yellow for moderately popular
    }

    // Default color for other countries
    return "#E5E7EB"; // Light gray
  };

  // Get hover color
  const getHoverColor = (geo: any) => {
    const countryCode = geo.id;
    const countryName = geo.properties.name;

    const isVisited = visitedCountryNames.has(countryName.toLowerCase());

    if (isVisited) {
      return "#059669"; // Darker green for visited
    }

    if (TOURISM_TIERS.tier1.has(countryCode)) {
      return "#DC2626"; // Red for tier 1
    }
    if (TOURISM_TIERS.tier2.has(countryCode)) {
      return "#EA580C"; // Dark orange for tier 2
    }
    if (TOURISM_TIERS.tier3.has(countryCode)) {
      return "#F59E0B"; // Orange for tier 3
    }
    if (TOURISM_TIERS.tier4.has(countryCode)) {
      return "#FBBF24"; // Yellow for tier 4
    }

    return "#D1D5DB"; // Gray
  };

  return (
    <div className="relative w-full bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 rounded-3xl p-2 sm:p-4 border-2 border-purple-200 shadow-2xl overflow-hidden">
      <ComposableMap
        projectionConfig={{
          rotate: [-10, 0, 0],
          scale: 180,
        }}
        width={980}
        height={551}
        style={{
          width: "100%",
          height: "auto",
        }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const fillColor = getCountryColor(geo);
              const hoverColor = getHoverColor(geo);
              const isVisited = visitedCountryNames.has(geo.properties.name.toLowerCase());

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fillColor}
                  stroke={isVisited ? "#047857" : "#6B7280"}
                  strokeWidth={isVisited ? 1.2 : 0.5}
                  style={{
                    default: { outline: "none" },
                    hover: {
                      outline: "none",
                      fill: hoverColor,
                      cursor: "pointer",
                    },
                    pressed: { outline: "none" },
                  }}
                  onMouseEnter={() => {
                    setHoveredCountry(geo.properties.name);
                    console.log("Country:", geo.properties.name, "Code:", geo.id);
                  }}
                  onMouseLeave={() => setHoveredCountry(null)}
                />
              );
            })
          }
        </Geographies>

        {/* Connection Lines for visited destinations */}
        {visitedDestinations.length >= 2 &&
          visitedDestinations.map((dest, index) => {
            if (index === 0) return null;
            const prev = visitedDestinations[index - 1];

            return (
              <Line
                key={`line-${dest.id}`}
                from={[prev.longitude, prev.latitude]}
                to={[dest.longitude, dest.latitude]}
                stroke="#6366F1"
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray="5,5"
                opacity={0.4}
              />
            );
          })}

        {/* Visited Destination Markers */}
        {visitedDestinations.map((dest) => (
          <Marker
            key={dest.id}
            coordinates={[dest.longitude, dest.latitude]}
            onMouseEnter={() => setHoveredCity(dest.id)}
            onMouseLeave={() => setHoveredCity(null)}
          >
            <g className="cursor-pointer">
              {/* Outer ring */}
              <circle
                r={10}
                fill="none"
                stroke="#10B981"
                strokeWidth={2}
                opacity={0.3}
              />
              {/* Main pin */}
              <circle r={7} fill="#10B981" stroke="white" strokeWidth={2.5} />
              {/* Inner shine */}
              <circle cx={-2} cy={-2} r={2} fill="white" opacity={0.6} />
              {/* Checkmark */}
              <text
                textAnchor="middle"
                y={1}
                fontSize={8}
                fontWeight="bold"
                fill="white"
              >
                ✓
              </text>

              {/* Tooltip */}
              {hoveredCity === dest.id && (
                <g>
                  <rect
                    x={-45}
                    y={-45}
                    width={90}
                    height={32}
                    fill="#10B981"
                    rx={8}
                  />
                  <path d="M -5,-13 L 0,-8 L 5,-13 Z" fill="#10B981" />
                  <text
                    textAnchor="middle"
                    y={-25}
                    fontSize={12}
                    fontWeight="bold"
                    fill="white"
                  >
                    {dest.city}
                  </text>
                </g>
              )}
            </g>
          </Marker>
        ))}

        {/* Future Destination Markers */}
        {futureDestinations.map((dest) => (
          <Marker
            key={dest.id}
            coordinates={[dest.longitude, dest.latitude]}
            onMouseEnter={() => setHoveredCity(dest.id)}
            onMouseLeave={() => setHoveredCity(null)}
          >
            <g className="cursor-pointer">
              {/* Outer ring */}
              <circle
                r={10}
                fill="none"
                stroke="#F59E0B"
                strokeWidth={2}
                opacity={0.3}
              />
              {/* Main pin - hollow */}
              <circle r={7} fill="white" stroke="#F59E0B" strokeWidth={3} />
              {/* Inner shine */}
              <circle cx={-2} cy={-2} r={2} fill="#FEF3C7" opacity={0.8} />
              {/* Star */}
              <text
                textAnchor="middle"
                y={1}
                fontSize={8}
                fontWeight="bold"
                fill="#F59E0B"
              >
                ★
              </text>

              {/* Tooltip */}
              {hoveredCity === dest.id && (
                <g>
                  <rect
                    x={-45}
                    y={-45}
                    width={90}
                    height={32}
                    fill="#F59E0B"
                    rx={8}
                  />
                  <path d="M -5,-13 L 0,-8 L 5,-13 Z" fill="#F59E0B" />
                  <text
                    textAnchor="middle"
                    y={-25}
                    fontSize={12}
                    fontWeight="bold"
                    fill="white"
                  >
                    {dest.city}
                  </text>
                </g>
              )}
            </g>
          </Marker>
        ))}
      </ComposableMap>

      {/* Enhanced Legend */}
      <div className="mt-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border-2 border-purple-200">
        <h3 className="text-sm font-bold text-gray-700 mb-3 text-center">Map Legend</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Country popularity */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 bg-orange-500 rounded-sm border border-orange-700"></div>
            <span className="text-xs font-semibold text-gray-700">Most Popular</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 bg-yellow-400 rounded-sm border border-yellow-600"></div>
            <span className="text-xs font-semibold text-gray-700">Very Popular</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 bg-yellow-300 rounded-sm border border-yellow-500"></div>
            <span className="text-xs font-semibold text-gray-700">Popular</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 bg-yellow-200 rounded-sm border border-yellow-400"></div>
            <span className="text-xs font-semibold text-gray-700">Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 bg-gray-300 rounded-sm border border-gray-400"></div>
            <span className="text-xs font-semibold text-gray-700">Less Visited</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 bg-emerald-500 rounded-sm border border-emerald-700"></div>
            <span className="text-xs font-semibold text-emerald-700">✓ You Visited</span>
          </div>
        </div>

        <div className="h-px bg-gray-300 my-3"></div>

        {/* City markers */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-md"></div>
              <span className="absolute -top-1 -right-1 text-xs">✓</span>
            </div>
            <span className="text-xs font-bold text-green-700">Visited City</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-5 h-5 bg-white rounded-full border-2 border-orange-500 shadow-md" style={{ borderWidth: "3px" }}></div>
              <span className="absolute -top-1 -right-1 text-xs">★</span>
            </div>
            <span className="text-xs font-bold text-orange-700">Future Trip</span>
          </div>
        </div>
      </div>

    </div>
  );
}
