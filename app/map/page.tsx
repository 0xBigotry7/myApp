import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import TravelMapClient from "@/components/TravelMapClient";
import { getHouseholdUserIds } from "@/lib/household";

export default async function TravelMapPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const householdUserIds = await getHouseholdUserIds();

  // Get all travel destinations:
  // 1. Shared destinations (isPersonal = false) from all household members
  // 2. Personal destinations (isPersonal = true) only from current user
  const destinations = await prisma.travelDestination.findMany({
    where: {
      OR: [
        {
          // Shared destinations from any household member
          userId: { in: householdUserIds },
          isPersonal: false,
        },
        {
          // Personal destinations from current user only
          userId: session.user.id,
          isPersonal: true,
        },
      ],
    },
    orderBy: {
      visitDate: "desc",
    },
  });

  // Get user details (for joint travel with wife)
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

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
