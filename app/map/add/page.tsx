import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import AddDestinationFormSmart from "@/components/AddDestinationFormSmart";
import { getServerLocale } from "@/lib/locale-server";
import { getTranslations } from "@/lib/i18n";

export default async function AddDestinationPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const locale = await getServerLocale();
  const t = getTranslations(locale);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-black text-gray-900 mb-2">✈️ {t.addDestination}</h1>
            <p className="text-gray-600">{t.startAddingDestinations}</p>
          </div>

          <AddDestinationFormSmart />
        </div>
      </div>
    </>
  );
}
