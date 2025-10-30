import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AddDestinationForm from "@/components/AddDestinationForm";

export default async function AddDestinationPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-24">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-gray-900 mb-2">✈️ Add Destination</h1>
          <p className="text-gray-600">Add a place you've visited or plan to visit</p>
        </div>

        <AddDestinationForm />
      </div>
    </div>
  );
}
