import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const location = searchParams.get("location");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Maps API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Search for hotels using Google Places Text Search API
    const searchQuery = location ? `${query} in ${location}` : query;
    const textSearchUrl = new URL(
      "https://maps.googleapis.com/maps/api/place/textsearch/json"
    );
    textSearchUrl.searchParams.set("query", searchQuery);
    textSearchUrl.searchParams.set("type", "lodging");
    textSearchUrl.searchParams.set("key", apiKey);

    const searchResponse = await fetch(textSearchUrl.toString());
    const searchData = await searchResponse.json();

    if (searchData.status !== "OK" && searchData.status !== "ZERO_RESULTS") {
      return NextResponse.json(
        { error: `Google Places API error: ${searchData.status}` },
        { status: 500 }
      );
    }

    // Format results
    const hotels = searchData.results.map((place: any) => ({
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      priceLevel: place.price_level,
      photos: place.photos
        ? place.photos.slice(0, 5).map((photo: any) => ({
            photoReference: photo.photo_reference,
            width: photo.width,
            height: photo.height,
          }))
        : [],
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      types: place.types,
      businessStatus: place.business_status,
    }));

    return NextResponse.json({ hotels });
  } catch (error) {
    console.error("Error searching hotels:", error);
    return NextResponse.json(
      { error: "Failed to search hotels" },
      { status: 500 }
    );
  }
}
