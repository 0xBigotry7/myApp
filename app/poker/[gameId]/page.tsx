import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PokerGameClient from "@/components/poker/PokerGameClient";

export default async function PokerGamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { gameId } = await params;

  const game = await prisma.pokerGame.findUnique({
    where: { id: gameId },
    include: {
      player1: { select: { id: true, name: true } },
      player2: { select: { id: true, name: true } },
      hands: {
        where: { completedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!game) {
    redirect("/poker");
  }

  // Check if user is part of this game
  if (game.player1Id !== session.user.id && game.player2Id !== session.user.id) {
    redirect("/poker");
  }

  const isPlayer1 = game.player1Id === session.user.id;
  const currentHand = game.hands[0] || null;

  // Filter hole cards - only show player's own cards
  let playerHoleCards = null;
  let communityCards = [];

  if (currentHand) {
    playerHoleCards = isPlayer1
      ? JSON.parse(currentHand.player1Cards as string)
      : JSON.parse(currentHand.player2Cards as string);
    communityCards = JSON.parse(currentHand.communityCards as string);
  }

  return (
    <PokerGameClient
      game={game}
      currentHand={currentHand}
      playerHoleCards={playerHoleCards}
      communityCards={communityCards}
      isPlayer1={isPlayer1}
      userId={session.user.id}
    />
  );
}
