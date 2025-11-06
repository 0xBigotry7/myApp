import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { startingChips, smallBlind, bigBlind } = await req.json();

    // Find the other user (the opponent)
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    const opponent = await prisma.user.findFirst({
      where: { id: { not: session.user.id } },
    });

    if (!opponent) {
      return NextResponse.json({ error: "No opponent found" }, { status: 400 });
    }

    // Create the poker game
    const game = await prisma.pokerGame.create({
      data: {
        player1Id: session.user.id,
        player2Id: opponent.id,
        player1Chips: startingChips || 1000,
        player2Chips: startingChips || 1000,
        smallBlind: smallBlind || 10,
        bigBlind: bigBlind || 20,
        status: "waiting",
        dealerButton: 0, // Player 1 starts as dealer
      },
      include: {
        player1: { select: { id: true, name: true } },
        player2: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error("Error creating poker game:", error);
    return NextResponse.json(
      { error: "Failed to create poker game" },
      { status: 500 }
    );
  }
}
