import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ActivityInputForm from "@/components/ActivityInputForm";
import { getTranslations } from "@/lib/i18n";
import { getServerLocale } from "@/lib/locale-server";

export default async function AddActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { id } = await params;

  const trip = await prisma.trip.findUnique({
    where: {
      id,
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      destination: true,
      startDate: true,
      endDate: true,
    },
  });

  if (!trip) {
    redirect("/trips");
  }

  const locale = await getServerLocale();
  const t = getTranslations(locale);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <a
            href={`/trips/${trip.id}`}
            className="text-purple-600 hover:text-purple-800 font-medium mb-4 inline-flex items-center gap-2 transition-colors"
          >
            ← {t.backToTrip}
          </a>
          <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">
            📅 {t.addActivity}
          </h1>
          <p className="text-gray-600">
            {trip.name || trip.destination}
          </p>
        </div>

        {/* Mobile-optimized activity form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <ActivityInputForm
            tripId={trip.id}
            startDate={trip.startDate}
            endDate={trip.endDate}
          />
        </div>
      </div>
    </div>
  );
}
