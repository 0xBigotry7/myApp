import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Get user from database
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true, email: true, name: true },
  });

  // Get trips for this user
  const trips = await prisma.trip.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } }
      ]
    },
    select: {
      id: true,
      name: true,
      ownerId: true,
    },
  });

  return NextResponse.json({
    sessionUserId: session.user.id,
    sessionUserEmail: session.user.email,
    dbUserId: dbUser?.id,
    dbUserEmail: dbUser?.email,
    idsMatch: session.user.id === dbUser?.id,
    tripsFound: trips.length,
    trips: trips,
  });
}

