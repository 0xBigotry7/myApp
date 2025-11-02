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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <span>🌟</span>
            <span>My Life Timeline</span>
          </h1>
          <p className="text-lg text-gray-600">
            Your journey through life - all your memories in one place
          </p>
        </div>

        <LifeTimeline
          currentUserId={session.user.id}
          householdUsers={householdUsers}
        />
      </div>
    </div>
  );
}
