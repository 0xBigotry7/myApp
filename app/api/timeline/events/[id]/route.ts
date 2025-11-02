import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const existingEvent = await prisma.lifeEvent.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Life event not found" }, { status: 404 });
    }

    if (existingEvent.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedEvent = await prisma.lifeEvent.update({
      where: { id },
      data: {
        type: body.type !== undefined ? body.type : undefined,
        title: body.title !== undefined ? body.title : undefined,
        content: body.content !== undefined ? (body.content || null) : undefined,
        photos: body.photos !== undefined ? body.photos : undefined,
        location: body.location !== undefined ? (body.location || null) : undefined,
        latitude: body.latitude !== undefined ? body.latitude : undefined,
        longitude: body.longitude !== undefined ? body.longitude : undefined,
        tags: body.tags !== undefined ? body.tags : undefined,
        mood: body.mood !== undefined ? (body.mood || null) : undefined,
        isPrivate: body.isPrivate !== undefined ? body.isPrivate : undefined,
        date: body.date !== undefined ? new Date(body.date) : undefined,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Error updating life event:", error);
    return NextResponse.json(
      { error: "Failed to update life event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existingEvent = await prisma.lifeEvent.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Life event not found" }, { status: 404 });
    }

    if (existingEvent.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.lifeEvent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting life event:", error);
    return NextResponse.json(
      { error: "Failed to delete life event" },
      { status: 500 }
    );
  }
}
