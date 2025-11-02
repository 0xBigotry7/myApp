import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      title,
      content,
      photos,
      location,
      latitude,
      longitude,
      tags,
      mood,
      isPrivate,
      date,
    } = body;

    if (!title || !date) {
      return NextResponse.json(
        { error: "Title and date are required" },
        { status: 400 }
      );
    }

    const lifeEvent = await prisma.lifeEvent.create({
      data: {
        userId: session.user.id,
        type: type || "memory",
        title,
        content: content || null,
        photos: photos || [],
        location: location || null,
        latitude: latitude || null,
        longitude: longitude || null,
        tags: tags || [],
        mood: mood || null,
        isPrivate: isPrivate || false,
        date: new Date(date),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(lifeEvent);
  } catch (error) {
    console.error("Error creating life event:", error);
    return NextResponse.json(
      { error: "Failed to create life event" },
      { status: 500 }
    );
  }
}
