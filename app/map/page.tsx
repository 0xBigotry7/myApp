import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import TravelMapClient from "@/components/TravelMapClient";
import { getHouseholdUserIds } from "@/lib/household";

// Cache map data for 5 minutes - destinations don't change frequently
export const revalidate = 300;

export default async function TravelMapPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const householdUserIds = await getHouseholdUserIds();

  // Run queries in parallel
  const [destinations, users] = await Promise.all([
    // Get all travel destinations
    prisma.travelDestination.findMany({
      where: {
        OR: [
          {
            userId: { in: householdUserIds },
            isPersonal: false,
          },
          {
            userId: session.user.id,
            isPersonal: true,
          },
        ],
      },
      orderBy: {
        visitDate: "desc",
      },
    }),

    // Get user details
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    }),
  ]);

  return (
    <>
      <Navbar />
      <TravelMapClient
        initialDestinations={destinations}
        currentUserId={session.user.id}
        users={users}
      />
    </>
  );
}
