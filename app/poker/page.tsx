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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent mb-3 flex items-center gap-3">
                <span className="text-6xl">🃏</span>
                Texas Hold'em
              </h1>
              <p className="text-gray-300 text-lg">Heads-up poker showdown</p>
            </div>
          </div>

          {/* Game Configuration */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 shadow-2xl mb-8 border-2 border-yellow-600">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-3xl">⚙️</span>
              New Game Settings
            </h2>
            <form action="/api/poker/create" method="POST" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-yellow-400 mb-3">
                    💰 Starting Chips
                  </label>
                  <select
                    name="startingChips"
                    className="w-full px-5 py-3 bg-gray-700 text-white border-2 border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 font-semibold text-lg"
                    defaultValue="1000"
                  >
                    <option value="500">500</option>
                    <option value="1000">1,000</option>
                    <option value="2000">2,000</option>
                    <option value="5000">5,000</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-yellow-400 mb-3">
                    🎯 Small Blind
                  </label>
                  <select
                    name="smallBlind"
                    className="w-full px-5 py-3 bg-gray-700 text-white border-2 border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 font-semibold text-lg"
                    defaultValue="10"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-yellow-400 mb-3">
                    🎲 Big Blind
                  </label>
                  <select
                    name="bigBlind"
                    className="w-full px-5 py-3 bg-gray-700 text-white border-2 border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 font-semibold text-lg"
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
                className="w-full px-8 py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 hover:from-green-500 hover:via-emerald-500 hover:to-green-500 text-white rounded-xl font-bold text-xl shadow-2xl transform hover:scale-105 transition-all border-2 border-green-400"
              >
                <span className="text-2xl mr-2">🎴</span>
                Create New Game
              </button>
            </form>
          </div>

          {/* Games List */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 shadow-2xl border-2 border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-3xl">🎮</span>
              Your Games
            </h2>
            {games.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-8xl mb-6">🎴</div>
                <p className="text-xl font-semibold">No games yet. Create your first game!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {games.map((game) => {
                  const isPlayer1 = game.player1Id === session.user.id;
                  const opponent = isPlayer1 ? game.player2 : game.player1;
                  const chips = isPlayer1 ? game.player1Chips : game.player2Chips;
                  const opponentChips = isPlayer1 ? game.player2Chips : game.player1Chips;

                  const statusColors = {
                    active: "bg-green-500",
                    waiting: "bg-yellow-500",
                    finished: "bg-red-500",
                  };

                  const statusEmojis = {
                    active: "🔥",
                    waiting: "⏸️",
                    finished: "🏆",
                  };

                  return (
                    <Link
                      key={game.id}
                      href={`/poker/${game.id}`}
                      className="block p-6 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 rounded-xl hover:border-yellow-500 hover:shadow-2xl hover:shadow-yellow-500/20 transform hover:scale-102 transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            {opponent.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xl mb-1">
                              vs {opponent.name}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`${statusColors[game.status as keyof typeof statusColors]} px-3 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1`}>
                                <span>{statusEmojis[game.status as keyof typeof statusEmojis]}</span>
                                <span className="capitalize">{game.status}</span>
                              </div>
                              <div className="text-xs text-gray-400">
                                Blinds: {game.smallBlind}/{game.bigBlind}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-yellow-400 mb-1">
                            {chips.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-400">
                            Your chips
                          </div>
                          {game.status === "finished" && game.winnerId && (
                            <div className={`mt-2 px-3 py-1 rounded-lg ${game.winnerId === session.user.id ? 'bg-green-600' : 'bg-red-600'} text-white text-xs font-bold`}>
                              {game.winnerId === session.user.id ? '🎉 Winner!' : 'Lost'}
                            </div>
                          )}
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
