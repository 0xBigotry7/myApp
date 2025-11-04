import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import PackingDashboard from "@/components/PackingDashboard";
import { getServerLocale } from "@/lib/locale-server";

export default async function PackingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const locale = await getServerLocale();

  // Fetch user's luggage and shared luggage with items
  const luggages = await prisma.luggage.findMany({
    where: {
      OR: [
        { userId: session.user.id }, // User's own luggage
        { isShared: true }, // Shared luggage from all users
      ],
      isActive: true,
    },
    include: {
      items: {
        orderBy: {
          order: "asc",
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      order: "asc",
    },
  });

  // Fetch unorganized items (items without luggage)
  const unorganizedItems = await prisma.packingItem.findMany({
    where: {
      userId: session.user.id,
      luggageId: null,
    },
    orderBy: {
      order: "asc",
    },
  });

  // Fetch packing templates
  const templates = await prisma.packingTemplate.findMany({
    where: {
      isPublic: true,
    },
    orderBy: {
      useCount: "desc",
    },
    take: 10,
  });

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 sm:p-6">
        <PackingDashboard
          luggages={luggages}
          unorganizedItems={unorganizedItems}
          templates={templates}
          userEmail={session.user.email || ""}
          userId={session.user.id}
          locale={locale}
        />
      </div>
    </>
  );
}
