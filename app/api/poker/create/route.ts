import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Handle FormData from HTML form
    const formData = await req.formData();
    const startingChips = parseInt(formData.get("startingChips") as string) || 1000;
    const smallBlind = parseInt(formData.get("smallBlind") as string) || 10;
    const bigBlind = parseInt(formData.get("bigBlind") as string) || 20;

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
        player1Chips: startingChips,
        player2Chips: startingChips,
        smallBlind: smallBlind,
        bigBlind: bigBlind,
        status: "waiting",
        dealerButton: 0, // Player 1 starts as dealer
      },
      include: {
        player1: { select: { id: true, name: true } },
        player2: { select: { id: true, name: true } },
      },
    });

    // Redirect to the game page
    return NextResponse.redirect(new URL(`/poker/${game.id}`, req.url));
  } catch (error) {
    console.error("Error creating poker game:", error);
    return NextResponse.json(
      { error: "Failed to create poker game" },
      { status: 500 }
    );
  }
}
