import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the post to check ownership
    const post = await prisma.tripPost.findUnique({
      where: { id },
      include: {
        trip: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user has access (is owner of trip OR is a member OR created the post)
    const hasAccess =
      post.trip.ownerId === session.user.id ||
      post.trip.members.some((m: { userId: string }) => m.userId === session.user.id) ||
      post.userId === session.user.id;

    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the post
    await prisma.tripPost.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { content, location, timestamp } = body;

    // Parse timestamp correctly if provided - handle different formats
    let parsedTimestamp: Date | undefined;
    if (timestamp && typeof timestamp === 'string') {
      if (timestamp.includes('T') || timestamp.includes('Z')) {
        // ISO format: use as-is
        parsedTimestamp = new Date(timestamp);
        console.log('Received ISO timestamp:', timestamp, '→ Parsed as:', parsedTimestamp);
      } else if (timestamp.includes(' ') && timestamp.includes(':')) {
        // Format: "YYYY-MM-DD HH:mm" - parse as local time
        const [datePart, timePart] = timestamp.split(' ');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes] = timePart.split(':').map(Number);
        parsedTimestamp = new Date(year, month - 1, day, hours, minutes, 0, 0);
        console.log('Received date+time:', timestamp, '→ Parsed as:', parsedTimestamp);
      } else {
        // Just a date string - parse as local date at noon to avoid timezone issues
        const [year, month, day] = timestamp.split('-').map(Number);
        parsedTimestamp = new Date(year, month - 1, day, 12, 0, 0, 0);
        console.log('Received date-only:', timestamp, '→ Parsed as:', parsedTimestamp);
      }
    }

    // Get the post to check ownership
    const post = await prisma.tripPost.findUnique({
      where: { id },
      include: {
        trip: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user has access
    const hasAccess =
      post.trip.ownerId === session.user.id ||
      post.trip.members.some((m: { userId: string }) => m.userId === session.user.id) ||
      post.userId === session.user.id;

    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update the post
    const updatedPost = await prisma.tripPost.update({
      where: { id },
      data: {
        content: content !== undefined ? content : undefined,
        location: location !== undefined ? (location || null) : undefined,
        timestamp: parsedTimestamp,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}
