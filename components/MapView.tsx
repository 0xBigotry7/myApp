"use client";

import { useState, useMemo } from "react";
import { ComposableMap, Geographies, Geography, Marker, Line, ZoomableGroup } from "react-simple-maps";
import { format } from "date-fns";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface MapEvent {
  id: string;
  date: string | Date;
  title: string;
  type: string;
  content?: string;
  photos: string[];
  location?: string;
  mood?: string;
  user: { id: string; name: string; email?: string };
}

interface MapViewProps {
  events: MapEvent[];
  onEventClick?: (event: MapEvent) => void;
}

// Simple geocoding - in production, use a real geocoding API
const getCityCoordinates = (location: string): [number, number] | null => {
  const cities: Record<string, [number, number]> = {
    // North America
    "new york": [-74.006, 40.7128], "nyc": [-74.006, 40.7128],
    "los angeles": [-118.2437, 34.0522], "la": [-118.2437, 34.0522],
    "san francisco": [-122.4194, 37.7749], "sf": [-122.4194, 37.7749],
    "chicago": [-87.6298, 41.8781],
    "boston": [-71.0589, 42.3601],
    "miami": [-80.1918, 25.7617],
    "seattle": [-122.3321, 47.6062],
    "toronto": [-79.3832, 43.6532],
    "vancouver": [-123.1207, 49.2827],
    "mexico city": [-99.1332, 19.4326],
    "montreal": [-73.5673, 45.5017],
    "washington": [-77.0369, 38.9072], "dc": [-77.0369, 38.9072],
    "philadelphia": [-75.1652, 39.9526],
    "atlanta": [-84.388, 33.749],
    "houston": [-95.3698, 29.7604],
    "dallas": [-96.797, 32.7767],
    "austin": [-97.7431, 30.2672],
    "denver": [-104.9903, 39.7392],
    "portland": [-122.6765, 45.5152],
    "san diego": [-117.1611, 32.7157],
    "las vegas": [-115.1398, 36.1699],
    "phoenix": [-112.074, 33.4484],
    "nashville": [-86.7816, 36.1627],
    "new orleans": [-90.0715, 29.9511],
    "orlando": [-81.3792, 28.5383],
    "tampa": [-82.4572, 27.9506],
    "minneapolis": [-93.2650, 44.9778],
    "detroit": [-83.0458, 42.3314],
    "pittsburgh": [-79.9959, 40.4406],
    "cleveland": [-81.6944, 41.4993],
    "cincinnati": [-84.5120, 39.1031],
    "milwaukee": [-87.9065, 43.0389],
    "kansas city": [-94.5786, 39.0997],
    "st louis": [-90.1994, 38.6270],
    "salt lake city": [-111.8910, 40.7608],
    "raleigh": [-78.6382, 35.7796],
    "charlotte": [-80.8431, 35.2271],
    "charleston": [-79.9311, 32.7765],
    "savannah": [-81.0998, 32.0809],

    // Caribbean & US Territories
    "san juan": [-66.1057, 18.4655], "pr": [-66.1057, 18.4655], "puerto rico": [-66.1057, 18.4655],
    "havana": [-82.3666, 23.1136],
    "nassau": [-77.3963, 25.0443],
    "kingston": [-76.7936, 18.0179],
    "santo domingo": [-69.9312, 18.4861],
    "port-au-prince": [-72.3074, 18.5944],
    "bridgetown": [-59.6167, 13.0969],
    "st thomas": [-64.8963, 18.3381],
    "st croix": [-64.7505, 17.7478],
    "aruba": [-69.9683, 12.5211],
    "curacao": [-68.9335, 12.1696],
    "barbados": [-59.5432, 13.1939],
    "martinique": [-61.0242, 14.6415],
    "cancun": [-86.8515, 21.1619],
    "playa del carmen": [-87.0739, 20.6296],
    "cozumel": [-86.9223, 20.5083],
    "montego bay": [-77.9200, 18.4762],
    "grand cayman": [-81.3857, 19.3133],

    // Europe
    "london": [-0.1276, 51.5074],
    "paris": [2.3522, 48.8566],
    "berlin": [13.405, 52.52],
    "rome": [12.4964, 41.9028],
    "barcelona": [2.1734, 41.3851],
    "amsterdam": [4.9041, 52.3676],
    "madrid": [-3.7038, 40.4168],
    "vienna": [16.3738, 48.2082],
    "prague": [14.4378, 50.0755],
    "istanbul": [28.9784, 41.0082],
    "moscow": [37.6173, 55.7558],
    "athens": [23.7275, 37.9838],
    "lisbon": [-9.1393, 38.7223],
    "dublin": [-6.2603, 53.3498],
    "brussels": [4.3517, 50.8503],
    "zurich": [8.5417, 47.3769],
    "geneva": [6.1432, 46.2044],
    "copenhagen": [12.5683, 55.6761],
    "stockholm": [18.0686, 59.3293],
    "oslo": [10.7522, 59.9139],
    "helsinki": [24.9384, 60.1699],
    "warsaw": [21.0122, 52.2297],
    "budapest": [19.0402, 47.4979],
    "munich": [11.5820, 48.1351],
    "milan": [9.1900, 45.4642],
    "venice": [12.3155, 45.4408],
    "florence": [11.2558, 43.7696],
    "edinburgh": [-3.1883, 55.9533],
    "manchester": [-2.2426, 53.4808],

    // Asia
    "tokyo": [139.6917, 35.6895],
    "beijing": [116.4074, 39.9042],
    "shanghai": [121.4737, 31.2304],
    "hong kong": [114.1095, 22.3964],
    "singapore": [103.8198, 1.3521],
    "bangkok": [100.5018, 13.7563],
    "seoul": [126.978, 37.5665],
    "mumbai": [72.8777, 19.076],
    "delhi": [77.1025, 28.7041],
    "dubai": [55.2708, 25.2048],
    "taipei": [121.5654, 25.0330],
    "kuala lumpur": [101.6869, 3.139],
    "jakarta": [106.8456, -6.2088],
    "manila": [120.9842, 14.5995],
    "hanoi": [105.8342, 21.0278],
    "ho chi minh": [106.6297, 10.8231], "saigon": [106.6297, 10.8231],
    "karachi": [67.0099, 24.8607],
    "bangalore": [77.5946, 12.9716],
    "hyderabad": [78.4867, 17.3850],
    "chennai": [80.2707, 13.0827],
    "kolkata": [88.3639, 22.5726],
    "osaka": [135.5022, 34.6937],
    "kyoto": [135.7681, 35.0116],
    "riyadh": [46.6753, 24.7136],
    "tel aviv": [34.7818, 32.0853],
    "jerusalem": [35.2137, 31.7683],

    // Australia & Oceania
    "sydney": [151.2093, -33.8688],
    "melbourne": [144.9631, -37.8136],
    "brisbane": [153.0251, -27.4698],
    "perth": [115.8605, -31.9505],
    "auckland": [174.7633, -36.8485],
    "wellington": [174.7762, -41.2865],

    // South America
    "rio de janeiro": [-43.1729, -22.9068], "rio": [-43.1729, -22.9068],
    "buenos aires": [-58.3816, -34.6037],
    "sao paulo": [-46.6333, -23.5505],
    "lima": [-77.0428, -12.0464],
    "bogota": [-74.0721, 4.7110],
    "santiago": [-70.6693, -33.4489],
    "caracas": [-66.9036, 10.4806],

    // Africa
    "cairo": [31.2357, 30.0444],
    "cape town": [18.4241, -33.9249],
    "johannesburg": [28.0473, -26.2041],
    "lagos": [3.3792, 6.5244],
    "nairobi": [36.8219, -1.2921],
    "casablanca": [-7.5898, 33.5731],
    "marrakech": [-7.9811, 31.6295],
  };

  const normalized = location.toLowerCase().trim();

  // Try exact match first
  if (cities[normalized]) {
    return cities[normalized];
  }

  // Try extracting city from "City, State/Country" format
  if (normalized.includes(',')) {
    const cityPart = normalized.split(',')[0].trim();
    if (cities[cityPart]) {
      return cities[cityPart];
    }

    // Also try matching against the city part
    for (const [city, coords] of Object.entries(cities)) {
      if (cityPart === city || cityPart.includes(city) || city.includes(cityPart)) {
        return coords;
      }
    }
  }

  // Try partial match
  for (const [city, coords] of Object.entries(cities)) {
    if (normalized.includes(city) || city.includes(normalized)) {
      return coords;
    }
  }

  return null;
};

export default function MapView({ events, onEventClick }: MapViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [tooltipEvent, setTooltipEvent] = useState<MapEvent | null>(null);
  const [showConnections, setShowConnections] = useState(true);
  const [showUnmapped, setShowUnmapped] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);

  // Process events with valid locations
  const { mappedEvents, unmappedEvents } = useMemo(() => {
    const eventsWithLocation = events.filter((event) => event.location);

    const mapped: (MapEvent & { coordinates: [number, number] })[] = [];
    const unmapped: MapEvent[] = [];

    eventsWithLocation.forEach((event) => {
      const coords = getCityCoordinates(event.location!);
      if (coords) {
        mapped.push({ ...event, coordinates: coords });
      } else {
        unmapped.push(event);
      }
    });

    return { mappedEvents: mapped, unmappedEvents: unmapped };
  }, [events]);

  // Group events by location
  const eventsByLocation = useMemo(() => {
    const map = new Map<string, (MapEvent & { coordinates: [number, number] })[]>();
    mappedEvents.forEach((event) => {
      const key = `${event.coordinates[0]},${event.coordinates[1]}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(event);
    });
    return map;
  }, [mappedEvents]);

  // Generate connection lines (chronological order)
  const connections = useMemo(() => {
    if (!showConnections || mappedEvents.length < 2) return [];

    const sorted = [...mappedEvents].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const lines: Array<{ from: [number, number]; to: [number, number] }> = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      lines.push({
        from: sorted[i].coordinates,
        to: sorted[i + 1].coordinates,
      });
    }

    return lines;
  }, [mappedEvents, showConnections]);

  // Get marker color based on event type
  const getMarkerColor = (type: string): string => {
    const colors: Record<string, string> = {
      travel: "#3b82f6",
      milestone: "#8b5cf6",
      memory: "#ec4899",
      achievement: "#f59e0b",
      celebration: "#10b981",
      relationship: "#ef4444",
      work: "#6366f1",
      education: "#14b8a6",
      health: "#f97316",
      default: "#6b7280",
    };
    return colors[type] || colors.default;
  };

  const handleMarkerClick = (event: MapEvent & { coordinates: [number, number] }) => {
    setSelectedEvent(event.id);
    if (onEventClick) {
      onEventClick(event);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Map Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Map View</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {mappedEvents.length} mapped • {unmappedEvents.length} unmapped • {events.length - mappedEvents.length - unmappedEvents.length} without location
            </p>
            <p className="text-xs text-gray-500 mt-1 hidden sm:block">
              💡 Drag to pan • Scroll to zoom • Click markers to view events
            </p>
            <p className="text-xs text-gray-500 mt-1 sm:hidden">
              💡 Drag & pinch to zoom
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto flex-wrap">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setZoom((prev) => Math.max(1, prev - 0.5))}
                className="px-2 sm:px-3 py-1 sm:py-1.5 hover:bg-white rounded-md transition-colors text-sm font-medium"
                title="Zoom Out"
              >
                −
              </button>
              <span className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-700">
                {zoom.toFixed(1)}x
              </span>
              <button
                onClick={() => setZoom((prev) => Math.min(5, prev + 0.5))}
                className="px-2 sm:px-3 py-1 sm:py-1.5 hover:bg-white rounded-md transition-colors text-sm font-medium"
                title="Zoom In"
              >
                +
              </button>
            </div>

            <button
              onClick={() => { setZoom(1); setCenter([0, 20]); }}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs sm:text-sm font-medium transition-colors"
            >
              Reset
            </button>

            <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showConnections}
                onChange={(e) => setShowConnections(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
              <span className="hidden sm:inline">Show Connections</span>
              <span className="sm:hidden">Lines</span>
            </label>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-6 overflow-hidden">
        <div className="relative w-full overflow-hidden h-[400px] sm:h-[500px]">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              center: center,
            }}
            width={800}
            height={500}
          >
            <ZoomableGroup
              zoom={zoom}
              center={center}
              onMoveEnd={({ coordinates, zoom: newZoom }) => {
                setCenter(coordinates);
                setZoom(newZoom);
              }}
            >
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#E5E7EB"
                      stroke="#D1D5DB"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { outline: "none", fill: "#D1D5DB" },
                        pressed: { outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>

              {/* Connection lines */}
              {connections.map((line, i) => (
                <Line
                  key={`line-${i}`}
                  from={line.from}
                  to={line.to}
                  stroke="#8b5cf6"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeDasharray="4,4"
                  opacity={0.4}
                />
              ))}

            {/* Event markers */}
            {Array.from(eventsByLocation.entries()).map(([key, locationEvents]) => {
              const firstEvent = locationEvents[0];
              const isSelected = locationEvents.some((e) => e.id === selectedEvent);
              const color = getMarkerColor(firstEvent.type);

              return (
                <Marker
                  key={key}
                  coordinates={firstEvent.coordinates}
                  onMouseEnter={() => setTooltipEvent(firstEvent)}
                  onMouseLeave={() => setTooltipEvent(null)}
                  onClick={() => handleMarkerClick(firstEvent)}
                >
                  {/* Pulse animation for selected marker */}
                  {isSelected && (
                    <circle
                      r={12}
                      fill={color}
                      opacity={0.3}
                      className="animate-ping"
                    />
                  )}

                  {/* Main marker */}
                  <circle
                    r={locationEvents.length > 1 ? 8 : 6}
                    fill={color}
                    stroke="white"
                    strokeWidth={2}
                    className="cursor-pointer hover:scale-110 transition-transform"
                  />

                  {/* Event count badge */}
                  {locationEvents.length > 1 && (
                    <text
                      textAnchor="middle"
                      y={-12}
                      style={{
                        fontSize: "10px",
                        fill: "white",
                        fontWeight: "bold",
                        pointerEvents: "none",
                      }}
                    >
                      <tspan
                        x="0"
                        dy="0"
                        style={{
                          fill: color,
                          stroke: "white",
                          strokeWidth: "3px",
                          paintOrder: "stroke",
                        }}
                      >
                        {locationEvents.length}
                      </tspan>
                    </text>
                  )}
                </Marker>
              );
            })}
            </ZoomableGroup>
          </ComposableMap>

          {/* Tooltip */}
          {tooltipEvent && (
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-xs z-10">
              <div className="flex items-start gap-3">
                {tooltipEvent.photos.length > 0 && (
                  <img
                    src={tooltipEvent.photos[0]}
                    alt=""
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm truncate">
                    {tooltipEvent.title}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {format(new Date(tooltipEvent.date), "MMM d, yyyy")}
                  </p>
                  {tooltipEvent.location && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <span>📍</span>
                      {tooltipEvent.location}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Events by location list */}
      {mappedEvents.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Events by Location</h3>
          <div className="space-y-2">
            {Array.from(eventsByLocation.entries()).map(([key, locationEvents]) => {
              const location = locationEvents[0].location;
              return (
                <div
                  key={key}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span className="font-semibold text-gray-900">{location}</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {locationEvents.length} event{locationEvents.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {locationEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => handleMarkerClick(event)}
                        className={`
                          px-3 py-1 rounded-full text-xs font-medium transition-all
                          ${
                            selectedEvent === event.id
                              ? "bg-purple-600 text-white"
                              : "bg-white text-gray-700 hover:bg-purple-50"
                          }
                        `}
                      >
                        {event.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unmapped events (locations not recognized) */}
      {unmappedEvents.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Unmapped Locations ({unmappedEvents.length})
            </h3>
            <span className="text-xs text-gray-500">
              These locations are not in our database
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {unmappedEvents.map((event) => (
              <div
                key={event.id}
                className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">📍</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">
                      {event.title}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {event.location}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {format(new Date(event.date), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No location events message */}
      {mappedEvents.length === 0 && unmappedEvents.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Events with Locations</h3>
          <p className="text-gray-600">
            Add location information to your events to see them on the map!
          </p>
        </div>
      )}
    </div>
  );
}
