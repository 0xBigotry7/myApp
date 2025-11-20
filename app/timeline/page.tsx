import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import LifeTimeline from "@/components/LifeTimeline";
import { getHouseholdUserIds } from "@/lib/household";

export default async function TimelinePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Get household users for filtering
  const householdUserIds = await getHouseholdUserIds();
  const householdUsers = await prisma.user.findMany({
    where: { id: { in: householdUserIds } },
    select: { id: true, name: true, email: true },
  });

  return (
    <main className="min-h-screen bg-zinc-50 pb-20">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-3">
            Timeline
          </h1>
          <p className="text-lg text-zinc-500">
            Your journey through life - all your memories in one place.
          </p>
        </div>

        <LifeTimeline
          currentUserId={session.user.id}
          householdUsers={householdUsers}
        />
      </div>
    </main>
  );
}
