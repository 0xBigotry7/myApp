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
      <Navbar />
      <div className="min-h-screen bg-zinc-50 bg-dot-pattern">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-zinc-900 mb-6">Add Transaction</h1>
            <AddExpenseForm accounts={JSON.parse(JSON.stringify(accounts))} />
          </div>
        </div>
      </div>
    </>
  );
}
