import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { put } from "@vercel/blob";
import crypto from "crypto";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function uploadImageToBlob(url: string, filename: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();

    // Upload to Vercel Blob
    const { url: blobUrl } = await put(filename, blob, {
      access: "public",
      addRandomSuffix: false,
    });

    return blobUrl;
  } catch (error) {
    console.error("Error uploading image to blob:", error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { destination } = await req.json();

    if (!destination) {
      return NextResponse.json(
        { error: "Destination is required" },
        { status: 400 }
      );
    }

    // Generate anime-style destination image using DALL-E
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `A vibrant anime-style illustration of ${destination} in the art style of One Piece.
      Show iconic landmarks and scenery with bold colors, dynamic composition, and adventure feeling.
      Bright sunny day, beautiful sky, no characters, landscape focus.
      High quality, detailed, vibrant colors, anime aesthetic.`,
      n: 1,
      size: "1792x1024",
      quality: "standard",
      style: "vivid",
    });

    const tempImageUrl = response.data?.[0]?.url;

    if (!tempImageUrl) {
      return NextResponse.json(
        { error: "Failed to generate image" },
        { status: 500 }
      );
    }

    // Generate a unique filename
    const hash = crypto.createHash("md5").update(`${destination}-${Date.now()}`).digest("hex");
    const filename = `trip-images/destination-${destination.replace(/[^a-zA-Z0-9]/g, "-")}-${hash}.png`;

    // Upload to Vercel Blob
    const blobUrl = await uploadImageToBlob(tempImageUrl, filename);

    return NextResponse.json({ imageUrl: blobUrl });
  } catch (error) {
    console.error("Error generating destination image:", error);
    return NextResponse.json(
      { error: "Failed to generate destination image" },
      { status: 500 }
    );
  }
}
