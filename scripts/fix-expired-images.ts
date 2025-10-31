import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import { put } from "@vercel/blob";
import crypto from "crypto";

const prisma = new PrismaClient();
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

async function generateThemeImage(theme: string, destination: string): Promise<string> {
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

  console.log(`Generating ${theme} image for ${destination}...`);

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1792x1024",
    quality: "standard",
    style: "vivid",
  });

  const tempImageUrl = response.data?.[0]?.url;

  if (!tempImageUrl) {
    throw new Error("Failed to generate image");
  }

  // Generate a unique filename
  const hash = crypto.createHash("md5").update(`${theme}-${destination}-${Date.now()}`).digest("hex");
  const filename = `trip-images/${theme}-${destination.replace(/[^a-zA-Z0-9]/g, "-")}-${hash}.png`;

  // Upload to Vercel Blob
  const blobUrl = await uploadImageToBlob(tempImageUrl, filename);

  console.log(`✓ Generated and uploaded ${theme} image: ${blobUrl}`);

  return blobUrl;
}

async function generateDestinationImage(destination: string): Promise<string> {
  console.log(`Generating destination image for ${destination}...`);

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
    throw new Error("Failed to generate image");
  }

  // Generate a unique filename
  const hash = crypto.createHash("md5").update(`${destination}-${Date.now()}`).digest("hex");
  const filename = `trip-images/destination-${destination.replace(/[^a-zA-Z0-9]/g, "-")}-${hash}.png`;

  // Upload to Vercel Blob
  const blobUrl = await uploadImageToBlob(tempImageUrl, filename);

  console.log(`✓ Generated and uploaded destination image: ${blobUrl}`);

  return blobUrl;
}

async function main() {
  console.log("Finding trips with expired image URLs...\n");

  // Find all trips with oaidalleapiprodscus.blob.core.windows.net URLs
  const trips = await prisma.trip.findMany({
    where: {
      OR: [
        { destinationImageUrl: { contains: "oaidalleapiprodscus.blob.core.windows.net" } },
        { budgetImageUrl: { contains: "oaidalleapiprodscus.blob.core.windows.net" } },
        { itineraryImageUrl: { contains: "oaidalleapiprodscus.blob.core.windows.net" } },
        { expensesImageUrl: { contains: "oaidalleapiprodscus.blob.core.windows.net" } },
      ],
    },
  });

  console.log(`Found ${trips.length} trip(s) with expired images.\n`);

  for (const trip of trips) {
    console.log(`\n=== Processing Trip: ${trip.name} (${trip.destination}) ===`);

    const updates: any = {};

    // Regenerate destination image if expired
    if (trip.destinationImageUrl?.includes("oaidalleapiprodscus.blob.core.windows.net")) {
      console.log("  ⚠ Destination image expired, regenerating...");
      updates.destinationImageUrl = await generateDestinationImage(trip.destination);
    }

    // Regenerate budget image if expired
    if (trip.budgetImageUrl?.includes("oaidalleapiprodscus.blob.core.windows.net")) {
      console.log("  ⚠ Budget image expired, regenerating...");
      updates.budgetImageUrl = await generateThemeImage("budget", trip.destination);
    }

    // Regenerate itinerary image if expired
    if (trip.itineraryImageUrl?.includes("oaidalleapiprodscus.blob.core.windows.net")) {
      console.log("  ⚠ Itinerary image expired, regenerating...");
      updates.itineraryImageUrl = await generateThemeImage("itinerary", trip.destination);
    }

    // Regenerate expenses image if expired
    if (trip.expensesImageUrl?.includes("oaidalleapiprodscus.blob.core.windows.net")) {
      console.log("  ⚠ Expenses image expired, regenerating...");
      updates.expensesImageUrl = await generateThemeImage("expenses", trip.destination);
    }

    // Update the trip with new image URLs
    if (Object.keys(updates).length > 0) {
      await prisma.trip.update({
        where: { id: trip.id },
        data: updates,
      });

      console.log(`\n  ✓ Updated trip with new image URLs`);
    }
  }

  console.log("\n\n✅ All expired images have been regenerated!\n");
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
