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
      <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
                Texas Hold'em
              </h1>
              <p className="text-zinc-400 text-lg">High stakes, heads-up poker.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: New Game */}
            <div className="lg:col-span-1">
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 sticky top-24">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-emerald-500">♦</span>
                  New Game
                </h2>
                <form action="/api/poker/create" method="POST" className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                      Starting Chips
                    </label>
                    <select
                      name="startingChips"
                      className="w-full px-4 py-3 bg-zinc-950 text-white border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none"
                      defaultValue="1000"
                    >
                      <option value="500">500</option>
                      <option value="1000">1,000</option>
                      <option value="2000">2,000</option>
                      <option value="5000">5,000</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                        Small Blind
                      </label>
                      <select
                        name="smallBlind"
                        className="w-full px-4 py-3 bg-zinc-950 text-white border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none"
                        defaultValue="10"
                      >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                        Big Blind
                      </label>
                      <select
                        name="bigBlind"
                        className="w-full px-4 py-3 bg-zinc-950 text-white border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none"
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
                    className="w-full px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <span>Create Table</span>
                    <span>→</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Games List */}
            <div className="lg:col-span-2">
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="p-6 border-b border-zinc-800">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-amber-500">♠</span>
                    Active Tables
                  </h2>
                </div>
                
                {games.length === 0 ? (
                  <div className="text-center py-20 px-6">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                      🃏
                    </div>
                    <h3 className="text-lg font-medium text-white mb-1">No active games</h3>
                    <p className="text-zinc-500">Create a new table to start playing.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800">
                    {games.map((game) => {
                      const isPlayer1 = game.player1Id === session.user.id;
                      const opponent = isPlayer1 ? game.player2 : game.player1;
                      const chips = isPlayer1 ? game.player1Chips : game.player2Chips;
                      
                      const statusColors = {
                        active: "text-emerald-400 bg-emerald-950/30 border-emerald-900/50",
                        waiting: "text-amber-400 bg-amber-950/30 border-amber-900/50",
                        finished: "text-zinc-400 bg-zinc-800/50 border-zinc-700/50",
                      };

                      const statusLabels = {
                        active: "In Progress",
                        waiting: "Waiting",
                        finished: "Finished",
                      };

                      return (
                        <Link
                          key={game.id}
                          href={`/poker/${game.id}`}
                          className="block p-6 hover:bg-zinc-800/50 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold border border-zinc-700">
                                {opponent.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-white text-lg mb-1 group-hover:text-emerald-400 transition-colors">
                                  vs {opponent.name}
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                  <span className={`px-2 py-0.5 rounded-full border ${statusColors[game.status as keyof typeof statusColors] || statusColors.active} font-medium`}>
                                    {statusLabels[game.status as keyof typeof statusLabels] || game.status}
                                  </span>
                                  <span className="text-zinc-500">
                                    Blinds: ${game.smallBlind}/${game.bigBlind}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-2xl font-bold text-white font-mono tracking-tight">
                                ${chips.toLocaleString()}
                              </div>
                              <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider mt-1">
                                Your Stack
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
        </div>
      </div>
    </>
  );
}
