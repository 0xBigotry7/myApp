import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default async function PokerLobby() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get active games for this user
  const games = await prisma.pokerGame.findMany({
    where: {
      OR: [
        { player1Id: session.user.id },
        { player2Id: session.user.id },
      ],
    },
    include: {
      player1: { select: { name: true } },
      player2: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                🃏 Texas Hold'em Poker
              </h1>
              <p className="text-gray-600">Heads-up poker between baber and BABER</p>
            </div>
            <form action="/api/poker/create" method="POST">
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                + New Game
              </button>
            </form>
          </div>

          {/* Game Configuration */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Game Settings</h2>
            <form action="/api/poker/create" method="POST" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Starting Chips
                  </label>
                  <select
                    name="startingChips"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    defaultValue="1000"
                  >
                    <option value="500">500</option>
                    <option value="1000">1,000</option>
                    <option value="2000">2,000</option>
                    <option value="5000">5,000</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Small Blind
                  </label>
                  <select
                    name="smallBlind"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    defaultValue="10"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Big Blind
                  </label>
                  <select
                    name="bigBlind"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    defaultValue="20"
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Create Game
              </button>
            </form>
          </div>

          {/* Games List */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Games</h2>
            {games.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🎴</div>
                <p>No games yet. Create your first game!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {games.map((game) => {
                  const isPlayer1 = game.player1Id === session.user.id;
                  const opponent = isPlayer1 ? game.player2 : game.player1;
                  const chips = isPlayer1 ? game.player1Chips : game.player2Chips;

                  return (
                    <Link
                      key={game.id}
                      href={`/poker/${game.id}`}
                      className="block p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-gray-900">
                            vs {opponent.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            Status: <span className="capitalize">{game.status}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {chips.toLocaleString()} chips
                          </div>
                          <div className="text-xs text-gray-500">
                            Blinds: {game.smallBlind}/{game.bigBlind}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
