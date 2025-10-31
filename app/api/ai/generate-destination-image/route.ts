import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { writeFile } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function downloadAndSaveImage(url: string, filename: string): Promise<string> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const publicPath = join(process.cwd(), "public", "generated-images");
    const filePath = join(publicPath, filename);

    // Create directory if it doesn't exist
    const fs = await import("fs/promises");
    await fs.mkdir(publicPath, { recursive: true });

    await writeFile(filePath, buffer);

    return `/generated-images/${filename}`;
  } catch (error) {
    console.error("Error downloading image:", error);
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
    const filename = `destination-${destination.replace(/[^a-zA-Z0-9]/g, "-")}-${hash}.png`;

    // Download and save the image
    const savedImageUrl = await downloadAndSaveImage(tempImageUrl, filename);

    return NextResponse.json({ imageUrl: savedImageUrl });
  } catch (error) {
    console.error("Error generating destination image:", error);
    return NextResponse.json(
      { error: "Failed to generate destination image" },
      { status: 500 }
    );
  }
}
