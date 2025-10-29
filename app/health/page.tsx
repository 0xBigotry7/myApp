import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import { getServerLocale } from "@/lib/locale-server";
import { getTranslations } from "@/lib/i18n";
import HealthDashboardClient from "@/components/period/HealthDashboardClient";

export default async function HealthPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const locale = await getServerLocale();
  const t = getTranslations(locale);

  // Fetch current cycle and recent cycles
  // Wrap in try-catch in case tables don't exist yet
  let cycles: any[] = [];
  let todayLog: any = null;
  let insights: any[] = [];

  try {
    cycles = await prisma.periodCycle.findMany({
      where: { userId: session.user.id },
      include: {
        dailyLogs: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: { startDate: "desc" },
      take: 12,
    });

    // Fetch today's log
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    todayLog = await prisma.dailyLog.findFirst({
      where: {
        userId: session.user.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Fetch recent insights
    insights = await prisma.healthInsight.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  } catch (error) {
    console.error("Error fetching period data:", error);
    // Tables might not exist yet, show empty state
  }

  // Calculate statistics
  const completedCycles = cycles.filter((c) => c.isComplete);
  const avgCycleLength =
    completedCycles.length > 0
      ? Math.round(
          completedCycles.reduce((sum, c) => sum + (c.cycleLength || 28), 0) /
            completedCycles.length
        )
      : 28;

  const avgPeriodLength =
    completedCycles.length > 0
      ? Math.round(
          completedCycles.reduce((sum, c) => sum + (c.periodLength || 5), 0) /
            completedCycles.length
        )
      : 5;

  const currentCycle = cycles.find((c) => !c.isComplete);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                🌸 {t.periodTracker}
              </h1>
              <p className="text-gray-600">{t.startTrackingPeriod}</p>
            </div>
          </div>

          <HealthDashboardClient
            cycles={JSON.parse(JSON.stringify(cycles))}
            todayLog={todayLog ? JSON.parse(JSON.stringify(todayLog)) : null}
            insights={JSON.parse(JSON.stringify(insights))}
            currentCycle={
              currentCycle ? JSON.parse(JSON.stringify(currentCycle)) : null
            }
            avgCycleLength={avgCycleLength}
            avgPeriodLength={avgPeriodLength}
            locale={locale}
          />
        </div>
      </div>
    </>
  );
}
