import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { theme, destination } = body;

    console.log("Generate theme image request:", { theme, destination, fullBody: body });

    if (!theme || !destination) {
      console.error("Missing required fields:", { theme, destination });
      return NextResponse.json(
        { error: "Theme and destination are required", received: { theme, destination } },
        { status: 400 }
      );
    }

    // Generate different prompts based on theme
    let prompt = "";

    switch (theme) {
      case "budget":
        prompt = `A vibrant anime-style illustration in One Piece art style showing a treasure chest with gold coins and money, set in ${destination}.
        Colorful, dynamic composition with iconic landmarks of ${destination} in background.
        Bright sunny day, adventure feeling, no characters, focus on the treasure and scenery.
        Bold colors, high quality, detailed, anime aesthetic.`;
        break;

      case "itinerary":
        prompt = `A vibrant anime-style illustration in One Piece art style showing an adventure map and compass with landmarks of ${destination}.
        Show iconic sights and scenery of ${destination} with exciting exploration theme.
        Bright colors, dynamic composition, adventure feeling, no characters, landscape focus.
        High quality, detailed, vibrant colors, anime aesthetic.`;
        break;

      case "expenses":
        prompt = `A vibrant anime-style illustration in One Piece art style showing shopping bags, souvenirs and local items from ${destination}.
        Colorful scene with iconic elements of ${destination} in background.
        Bright sunny day, cheerful atmosphere, no characters, focus on items and scenery.
        Bold colors, high quality, detailed, anime aesthetic.`;
        break;

      default:
        prompt = `A vibrant anime-style illustration of ${destination} in the art style of One Piece.
        Show iconic landmarks and scenery with bold colors, dynamic composition, and adventure feeling.
        Bright sunny day, beautiful sky, no characters, landscape focus.
        High quality, detailed, vibrant colors, anime aesthetic.`;
    }

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1792x1024",
      quality: "standard",
      style: "vivid",
    });

    const imageUrl = response.data[0]?.url;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Failed to generate image" },
        { status: 500 }
      );
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Error generating theme image:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
