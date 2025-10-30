import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import TravelMapClient from "@/components/TravelMapClient";

export default async function TravelMapPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Get all travel destinations for the user
  const destinations = await prisma.travelDestination.findMany({
    where: {
      userId: session.user.id,
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
