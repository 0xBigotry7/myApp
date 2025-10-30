"use client";

import { useState, useEffect } from "react";

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

export default function WorldMap({ destinations }: WorldMapProps) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  // Convert lat/lng to SVG coordinates (Mercator projection)
  const latLngToXY = (lat: number, lng: number) => {
    // SVG viewBox: 0 0 1000 500
    // Longitude: -180 to 180 -> 0 to 1000
    const x = ((lng + 180) * 1000) / 360;
    // Latitude: Using Mercator projection for realistic positioning
    const latRad = (lat * Math.PI) / 180;
    const mercatorY = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const y = 250 - (mercatorY * 500) / (2 * Math.PI);
    return { x, y };
  };

  const visitedDestinations = destinations.filter((d) => !d.isFuture);
  const futureDestinations = destinations.filter((d) => d.isFuture);

  return (
    <div className="relative w-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-4 sm:p-8 border-2 border-gray-200 shadow-xl overflow-hidden">
      <svg
        viewBox="0 0 1000 500"
        className="w-full h-auto"
        style={{ minHeight: "500px" }}
      >
        {/* Defs for realistic styling */}
        <defs>
          <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#0369a1", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#0c4a6e", stopOpacity: 1 }} />
          </linearGradient>

          <linearGradient id="landGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#84cc16", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "#65a30d", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#a16207", stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* Ocean */}
        <rect width="1000" height="500" fill="url(#oceanGradient)" />

        {/* Grid lines for reference */}
        <g stroke="#94a3b8" strokeWidth="0.5" opacity="0.2">
          {[0, 100, 200, 300, 400, 500].map((y) => (
            <line key={`lat-${y}`} x1="0" y1={y} x2="1000" y2={y} />
          ))}
          {[0, 200, 400, 600, 800, 1000].map((x) => (
            <line key={`lng-${x}`} x1={x} y1="0" x2={x} y2="500" />
          ))}
        </g>

        {/* Realistic World Map - Using more accurate continental outlines */}
        <g fill="url(#landGradient)" stroke="#4d7c0f" strokeWidth="1" opacity="0.9">
          {/* North America */}
          <path d="M 50,120 L 60,90 L 80,70 L 100,65 L 115,68 L 125,75 L 140,78 L 155,82 L 168,88 L 178,98 L 185,110 L 188,125 L 186,140 L 182,155 L 178,165 L 170,172 L 160,176 L 148,178 L 138,175 L 130,170 L 122,165 L 115,160 L 108,155 L 100,152 L 90,150 L 82,148 L 75,145 L 68,142 L 60,138 L 52,132 L 48,125 Z M 140,178 L 145,188 L 148,195 L 146,202 L 142,206 L 138,204 L 135,198 L 134,190 L 136,183 Z" />

          {/* South America */}
          <path d="M 152,210 L 162,215 L 170,222 L 176,232 L 180,245 L 182,260 L 182,275 L 180,290 L 176,305 L 170,318 L 162,328 L 152,335 L 142,337 L 135,332 L 132,320 L 132,305 L 134,290 L 136,275 L 138,260 L 140,245 L 142,230 L 145,218 Z" />

          {/* Europe */}
          <path d="M 475,95 L 485,88 L 495,85 L 505,86 L 515,90 L 522,96 L 525,105 L 523,115 L 518,122 L 510,126 L 500,128 L 490,127 L 482,122 L 477,115 L 475,105 Z M 495,128 L 502,135 L 505,142 L 502,148 L 495,150 L 488,147 L 485,140 L 487,133 Z" />

          {/* Africa */}
          <path d="M 485,155 L 495,150 L 508,148 L 520,150 L 532,155 L 542,165 L 548,178 L 552,195 L 553,212 L 552,228 L 548,245 L 542,260 L 534,272 L 524,282 L 512,288 L 498,290 L 486,288 L 478,282 L 474,272 L 472,258 L 472,242 L 474,225 L 477,210 L 480,195 L 482,180 L 484,168 Z" />

          {/* Asia */}
          <path d="M 530,95 L 545,88 L 562,85 L 580,85 L 598,88 L 615,92 L 632,98 L 648,106 L 662,116 L 673,128 L 680,142 L 683,158 L 682,172 L 677,185 L 668,195 L 655,202 L 640,206 L 623,207 L 608,205 L 595,200 L 583,193 L 572,185 L 563,176 L 556,165 L 551,152 L 548,138 L 547,123 L 548,110 L 552,100 Z M 682,140 L 692,135 L 700,136 L 706,142 L 708,150 L 706,158 L 700,164 L 692,166 L 685,162 L 682,153 Z M 610,210 L 622,207 L 635,208 L 645,214 L 650,223 L 648,232 L 640,238 L 628,240 L 618,236 L 612,228 L 610,218 Z" />

          {/* Australia */}
          <path d="M 765,310 L 780,305 L 795,304 L 810,306 L 823,312 L 833,320 L 840,332 L 842,346 L 840,360 L 833,372 L 822,380 L 808,384 L 792,384 L 778,380 L 767,372 L 760,360 L 757,346 L 758,332 L 762,320 Z" />

          {/* Antarctica (partial, bottom) */}
          <path d="M 0,480 L 1000,480 L 1000,500 L 0,500 Z" opacity="0.7" />

          {/* Greenland */}
          <path d="M 245,45 L 258,42 L 268,45 L 275,52 L 278,62 L 276,72 L 270,80 L 260,85 L 248,86 L 238,82 L 232,74 L 230,64 L 233,54 L 240,48 Z" />

          {/* Iceland */}
          <path d="M 430,85 L 438,83 L 445,85 L 448,91 L 446,97 L 440,100 L 433,100 L 428,96 L 427,90 Z" />

          {/* British Isles */}
          <path d="M 465,105 L 472,102 L 478,105 L 480,112 L 478,118 L 472,121 L 466,120 L 463,114 Z" />

          {/* Scandinavia */}
          <path d="M 505,55 L 515,50 L 522,52 L 526,60 L 525,70 L 520,80 L 512,85 L 505,83 L 500,75 L 500,65 Z" />

          {/* Japan */}
          <path d="M 830,165 L 838,162 L 845,165 L 848,172 L 847,180 L 842,186 L 835,188 L 828,185 L 825,178 L 826,170 Z" />

          {/* New Zealand */}
          <path d="M 895,385 L 902,383 L 908,386 L 910,393 L 908,400 L 902,403 L 895,401 L 892,394 Z M 898,408 L 904,406 L 910,409 L 912,416 L 910,423 L 904,426 L 898,424 L 895,417 Z" />

          {/* Madagascar */}
          <path d="M 555,285 L 560,282 L 565,284 L 567,292 L 566,302 L 562,310 L 557,312 L 552,308 L 551,298 L 553,288 Z" />

          {/* Philippines */}
          <path d="M 740,220 L 746,218 L 752,220 L 755,228 L 753,238 L 748,243 L 742,243 L 738,237 L 737,228 Z" />

          {/* Indonesia */}
          <path d="M 680,245 L 695,242 L 710,243 L 725,247 L 735,252 L 740,258 L 738,265 L 728,270 L 712,272 L 695,270 L 682,265 L 678,258 L 678,250 Z" />

          {/* Caribbean Islands */}
          <ellipse cx="192" cy="195" rx="8" ry="4" />

          {/* Hawaii */}
          <ellipse cx="130" cy="210" rx="3" ry="2" />
        </g>

        {/* Connection Lines (for visited places) - only show if 2+ destinations */}
        {visitedDestinations.length >= 2 && visitedDestinations.map((dest, index) => {
          if (index === 0) return null;
          const prev = visitedDestinations[index - 1];
          const start = latLngToXY(prev.latitude, prev.longitude);
          const end = latLngToXY(dest.latitude, dest.longitude);

          return (
            <line
              key={`line-${dest.id}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="#6366F1"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              opacity="0.3"
            />
          );
        })}

        {/* Destination Markers - Visited */}
        {visitedDestinations.map((dest, index) => {
          const { x, y } = latLngToXY(dest.latitude, dest.longitude);

          return (
            <g
              key={dest.id}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredCity(dest.id)}
              onMouseLeave={() => setHoveredCity(null)}
            >
              {/* Static outer ring */}
              <circle
                cx={x}
                cy={y}
                r="10"
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                opacity="0.3"
              />

              {/* Main marker with cute pin design */}
              <g>
                {/* Pin body */}
                <circle
                  cx={x}
                  cy={y}
                  r="7"
                  fill="#10B981"
                  stroke="white"
                  strokeWidth="2.5"
                  className="drop-shadow-lg"
                />
                {/* Inner shine */}
                <circle
                  cx={x - 2}
                  cy={y - 2}
                  r="2"
                  fill="white"
                  opacity="0.6"
                />
                {/* Heart or star icon */}
                <text
                  x={x}
                  y={y + 1}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="bold"
                  fill="white"
                >
                  ✓
                </text>
              </g>

              {/* Cute tooltip - Visited */}
              {hoveredCity === dest.id && (
                <g>
                  {/* Speech bubble */}
                  <rect
                    x={x - 45}
                    y={y - 45}
                    width="90"
                    height="32"
                    fill="#10B981"
                    rx="8"
                    className="drop-shadow-xl"
                  />
                  {/* Speech bubble pointer */}
                  <path
                    d={`M ${x - 5},${y - 13} L ${x},${y - 8} L ${x + 5},${y - 13} Z`}
                    fill="#10B981"
                  />
                  {/* City name */}
                  <text
                    x={x}
                    y={y - 25}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="bold"
                    fill="white"
                  >
                    {dest.city}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Destination Markers - Future */}
        {futureDestinations.map((dest, index) => {
          const { x, y } = latLngToXY(dest.latitude, dest.longitude);

          return (
            <g
              key={dest.id}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredCity(dest.id)}
              onMouseLeave={() => setHoveredCity(null)}
            >
              {/* Static outer ring */}
              <circle
                cx={x}
                cy={y}
                r="10"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2"
                opacity="0.3"
              />

              {/* Main marker with cute design for future trips */}
              <g>
                {/* Pin body - hollow */}
                <circle
                  cx={x}
                  cy={y}
                  r="7"
                  fill="white"
                  stroke="#F59E0B"
                  strokeWidth="3"
                  className="drop-shadow-lg"
                />
                {/* Inner shine */}
                <circle
                  cx={x - 2}
                  cy={y - 2}
                  r="2"
                  fill="#FEF3C7"
                  opacity="0.8"
                />
                {/* Star icon for future */}
                <text
                  x={x}
                  y={y + 1}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="bold"
                  fill="#F59E0B"
                >
                  ★
                </text>
              </g>

              {/* Cute tooltip - Future */}
              {hoveredCity === dest.id && (
                <g>
                  {/* Speech bubble */}
                  <rect
                    x={x - 45}
                    y={y - 45}
                    width="90"
                    height="32"
                    fill="#F59E0B"
                    rx="8"
                    className="drop-shadow-xl"
                  />
                  {/* Speech bubble pointer */}
                  <path
                    d={`M ${x - 5},${y - 13} L ${x},${y - 8} L ${x + 5},${y - 13} Z`}
                    fill="#F59E0B"
                  />
                  {/* City name */}
                  <text
                    x={x}
                    y={y - 25}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="bold"
                    fill="white"
                  >
                    {dest.city}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Cute Legend */}
      <div className="flex items-center justify-center gap-8 mt-6">
        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border-2 border-green-200">
          <div className="relative">
            <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-md"></div>
            <span className="absolute -top-1 -right-1 text-xs">✓</span>
          </div>
          <span className="text-sm font-bold text-green-700">Visited</span>
        </div>
        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border-2 border-orange-200">
          <div className="relative">
            <div className="w-5 h-5 bg-white rounded-full border-2 border-orange-500 shadow-md" style={{ borderWidth: "3px" }}></div>
            <span className="absolute -top-1 -right-1 text-xs">★</span>
          </div>
          <span className="text-sm font-bold text-orange-700">Future Trip</span>
        </div>
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
