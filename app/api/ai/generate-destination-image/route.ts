import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { uploadToGoogleDrive, isGoogleDriveConnected } from "@/lib/google-drive";
import crypto from "crypto";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function downloadImageAsBuffer(url: string): Promise<Buffer> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Error downloading image:", error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Google Drive is connected
    const driveConnected = await isGoogleDriveConnected(session.user.id);
    if (!driveConnected) {
      return NextResponse.json(
        { error: "Google Drive not connected. Please connect in settings." },
        { status: 400 }
      );
    }

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

    // Download the generated image
    const imageBuffer = await downloadImageAsBuffer(tempImageUrl);

    // Generate a unique filename
    const hash = crypto.createHash("md5").update(`${destination}-${Date.now()}`).digest("hex");
    const filename = `destination-${destination.replace(/[^a-zA-Z0-9]/g, "-")}-${hash}.png`;

    // Upload to Google Drive
    const driveUrl = await uploadToGoogleDrive(
      session.user.id,
      imageBuffer,
      filename,
      "image/png",
      "AI_GENERATED" // Store in AI Generated Images subfolder
    );

    return NextResponse.json({ imageUrl: driveUrl });
  } catch (error) {
    console.error("Error generating destination image:", error);
    return NextResponse.json(
      { error: "Failed to generate destination image" },
      { status: 500 }
    );
  }
}
