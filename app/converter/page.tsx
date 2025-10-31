import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CurrencyConverter from "@/components/CurrencyConverter";
import Navbar from "@/components/Navbar";

export default async function ConverterPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-8">
          <CurrencyConverter />
        </div>
      </div>
    </>
  );
}
