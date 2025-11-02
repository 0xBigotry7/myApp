"use client";

import { useEffect, useRef, useState } from "react";

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Enter location",
  className = "",
  disabled = false,
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (typeof window !== "undefined" && window.google?.maps?.places) {
      setIsLoaded(true);
      return;
    }

    // Load Google Maps Places API
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === "your-google-maps-api-key-here") {
      console.warn("Google Maps API key not configured");
      return;
    }

    // Check if script already exists
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for it to load
      const checkGoogle = setInterval(() => {
        if (window.google?.maps?.places) {
          setIsLoaded(true);
          clearInterval(checkGoogle);
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Don't remove script as it might be used by other components
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || disabled) return;

    // Initialize autocomplete with mobile-friendly options
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["geocode", "establishment"],
      fields: ["formatted_address", "name", "types", "address_components"],
    });

    // Set bounds to bias results (optional, can improve mobile experience)
    // autocompleteRef.current.setBounds() can be added if user location is available

    // Listen for place selection
    const listener = autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace();
      if (place) {
        // Prioritize name for establishments (restaurants, airports, etc.)
        // Use formatted_address for general locations (cities, addresses)
        const isEstablishment = place.types?.some(type =>
          ["establishment", "airport", "train_station", "transit_station", "restaurant", "lodging"].includes(type)
        );

        const location = isEstablishment && place.name
          ? place.name
          : (place.formatted_address || place.name || "");

        onChange(location);

        // Blur input on mobile after selection to dismiss keyboard
        if (inputRef.current && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          inputRef.current.blur();
        }
      }
    });

    return () => {
      if (listener) {
        google.maps.event.removeListener(listener);
      }
    };
  }, [isLoaded, disabled, onChange]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      autoComplete="off"
      // Mobile-specific attributes for better UX
      inputMode="text"
      enterKeyHint="done"
      // Prevent iOS zoom on focus
      style={{ fontSize: '16px' }}
    />
  );
}
