import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import EditAccommodationClient from "@/components/EditAccommodationClient";

export default async function EditAccommodationPage({
  params,
}: {
  params: Promise<{ id: string; expenseId: string }>;
}) {
  const session = await auth();
  const { id: tripId, expenseId } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch the expense
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      user: true,
      trip: {
        include: {
          members: true,
        },
      },
    },
  });

  if (!expense) {
    notFound();
  }

  // Check if user has access
  const hasAccess =
    expense.trip.ownerId === session.user.id ||
    expense.trip.members.some((m) => m.userId === session.user.id) ||
    expense.userId === session.user.id;

  if (!hasAccess) {
    notFound();
  }

  // Check if it's an accommodation expense
  if (expense.category !== "Accommodation" && !expense.accommodationName) {
    redirect(`/trips/${tripId}/edit-expense/${expenseId}`);
  }

  return (
    <EditAccommodationClient
      tripId={tripId}
      expense={{
        id: expense.id,
        amount: expense.amount,
        currency: expense.currency,
        date: expense.date,
        accommodationName: expense.accommodationName,
        accommodationType: expense.accommodationType,
        checkInDate: expense.checkInDate,
        checkOutDate: expense.checkOutDate,
        numberOfNights: expense.numberOfNights,
        googlePlaceId: expense.googlePlaceId,
        hotelAddress: expense.hotelAddress,
        hotelPhone: expense.hotelPhone,
        hotelWebsite: expense.hotelWebsite,
        hotelRating: expense.hotelRating,
        hotelPhotos: expense.hotelPhotos,
        latitude: expense.latitude,
        longitude: expense.longitude,
        confirmationNumber: expense.confirmationNumber,
        note: expense.note,
      }}
    />
  );
}
