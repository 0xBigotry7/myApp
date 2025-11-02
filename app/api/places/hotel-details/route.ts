import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get("placeId");

  if (!placeId) {
    return NextResponse.json(
      { error: "placeId parameter is required" },
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
    // Get place details from Google Places API
    const detailsUrl = new URL(
      "https://maps.googleapis.com/maps/api/place/details/json"
    );
    detailsUrl.searchParams.set("place_id", placeId);
    detailsUrl.searchParams.set(
      "fields",
      "name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,price_level,photos,geometry,types,business_status,opening_hours,reviews,url"
    );
    detailsUrl.searchParams.set("key", apiKey);

    const detailsResponse = await fetch(detailsUrl.toString());
    const detailsData = await detailsResponse.json();

    if (detailsData.status !== "OK") {
      return NextResponse.json(
        { error: `Google Places API error: ${detailsData.status}` },
        { status: 500 }
      );
    }

    const place = detailsData.result;

    // Get photo URLs
    const photoUrls = place.photos
      ? await Promise.all(
          place.photos.slice(0, 10).map(async (photo: any) => {
            const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${apiKey}`;
            return photoUrl;
          })
        )
      : [];

    // Format hotel details
    const hotelDetails = {
      placeId: placeId,
      name: place.name,
      address: place.formatted_address,
      phone: place.formatted_phone_number,
      website: place.website,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      priceLevel: place.price_level,
      photos: photoUrls,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      types: place.types,
      businessStatus: place.business_status,
      openingHours: place.opening_hours,
      reviews: place.reviews
        ? place.reviews.slice(0, 3).map((review: any) => ({
            author: review.author_name,
            rating: review.rating,
            text: review.text,
            time: review.time,
          }))
        : [],
      googleMapsUrl: place.url,
    };

    return NextResponse.json({ hotel: hotelDetails });
  } catch (error) {
    console.error("Error fetching hotel details:", error);
    return NextResponse.json(
      { error: "Failed to fetch hotel details" },
      { status: 500 }
    );
  }
}
