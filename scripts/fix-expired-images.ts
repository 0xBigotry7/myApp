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
  console.log("Finding trips with broken or missing image URLs...\n");

  // Find all trips with expired/local/missing images
  const trips = await prisma.trip.findMany({
    where: {
      OR: [
        // Expired DALL-E URLs
        { destinationImageUrl: { contains: "oaidalleapiprodscus.blob.core.windows.net" } },
        { budgetImageUrl: { contains: "oaidalleapiprodscus.blob.core.windows.net" } },
        { itineraryImageUrl: { contains: "oaidalleapiprodscus.blob.core.windows.net" } },
        { expensesImageUrl: { contains: "oaidalleapiprodscus.blob.core.windows.net" } },
        // Local file paths
        { destinationImageUrl: { contains: "localhost" } },
        { budgetImageUrl: { contains: "localhost" } },
        { itineraryImageUrl: { contains: "localhost" } },
        { expensesImageUrl: { contains: "localhost" } },
        // Images that are not yet in Vercel Blob
        {
          AND: [
            { destinationImageUrl: { not: null } },
            { destinationImageUrl: { not: { contains: "blob.vercel-storage.com" } } },
          ]
        },
      ],
    },
  });

  console.log(`Found ${trips.length} trip(s) with images to fix.\n`);

  for (const trip of trips) {
    console.log(`\n=== Processing Trip: ${trip.name} (${trip.destination}) ===`);

    const updates: any = {};

    // Check if image needs regeneration (expired, local, or not in Vercel Blob)
    const needsRegeneration = (url: string | null) => {
      if (!url) return false;
      return (
        url.includes("oaidalleapiprodscus.blob.core.windows.net") ||
        url.includes("localhost") ||
        !url.includes("blob.vercel-storage.com")
      );
    };

    // Regenerate destination image if needed
    if (trip.destinationImageUrl && needsRegeneration(trip.destinationImageUrl)) {
      console.log("  ⚠ Destination image needs fixing, regenerating...");
      updates.destinationImageUrl = await generateDestinationImage(trip.destination);
    }

    // Regenerate budget image if needed
    if (trip.budgetImageUrl && needsRegeneration(trip.budgetImageUrl)) {
      console.log("  ⚠ Budget image needs fixing, regenerating...");
      updates.budgetImageUrl = await generateThemeImage("budget", trip.destination);
    }

    // Regenerate itinerary image if needed
    if (trip.itineraryImageUrl && needsRegeneration(trip.itineraryImageUrl)) {
      console.log("  ⚠ Itinerary image needs fixing, regenerating...");
      updates.itineraryImageUrl = await generateThemeImage("itinerary", trip.destination);
    }

    // Regenerate expenses image if needed
    if (trip.expensesImageUrl && needsRegeneration(trip.expensesImageUrl)) {
      console.log("  ⚠ Expenses image needs fixing, regenerating...");
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

  console.log("\n\n✅ All broken images have been regenerated and stored in Vercel Blob!\n");
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
