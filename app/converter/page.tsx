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
      <div className="min-h-screen bg-zinc-50">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-12 sm:py-16">
          <CurrencyConverter />
        </div>
      </div>
    </>
  );
}
