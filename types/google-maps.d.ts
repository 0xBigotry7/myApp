// Google Maps TypeScript definitions for Places API
declare global {
  interface Window {
    google: typeof google;
  }

  namespace google {
    namespace maps {
      class LatLng {
        constructor(lat: number, lng: number);
        lat(): number;
        lng(): number;
      }

      namespace places {
        class Autocomplete {
          constructor(
            input: HTMLInputElement,
            opts?: AutocompleteOptions
          );
          addListener(
            eventName: string,
            handler: () => void
          ): google.maps.MapsEventListener;
          getPlace(): PlaceResult;
        }

        interface AutocompleteOptions {
          types?: string[];
          fields?: string[];
          componentRestrictions?: {
            country?: string | string[];
          };
        }

        interface PlaceResult {
          formatted_address?: string;
          name?: string;
          types?: string[];
          geometry?: {
            location?: LatLng;
          };
        }
      }

      namespace event {
        function removeListener(listener: MapsEventListener): void;
      }

      interface MapsEventListener {
        remove(): void;
      }
    }
  }
}

export {};
