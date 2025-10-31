import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Verify user has access to this trip
    const trip = await prisma.trip.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
      }
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Fetch all posts for this trip
    const posts = await prisma.tripPost.findMany({
      where: { tripId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        timestamp: "desc"
      }
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching trip posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Verify user has access to this trip
    const trip = await prisma.trip.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
      }
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const body = await req.json();
    const { type, content, photos, location, latitude, longitude, timestamp } = body;

    // Validate required fields
    if (!type || !["photo", "note", "checkin"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid post type. Must be photo, note, or checkin" },
        { status: 400 }
      );
    }

    // Create the post
    const post = await prisma.tripPost.create({
      data: {
        tripId: id,
        userId: session.user.id,
        type,
        content: content || null,
        photos: photos || [],
        location: location || null,
        latitude: latitude || null,
        longitude: longitude || null,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Error creating trip post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
