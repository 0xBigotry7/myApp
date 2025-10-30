import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import AddExpenseForm from "@/components/AddExpenseForm";

export default async function AddExpensePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user's accounts
  const accounts = await prisma.account.findMany({
    where: {
      userId: session.user.id,
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <>
      <div className="hidden md:block">
        <Navbar />
      </div>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-8">
          <AddExpenseForm accounts={JSON.parse(JSON.stringify(accounts))} />
        </div>
      </div>
    </>
  );
}
