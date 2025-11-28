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
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 bg-dot-pattern transition-colors">
        <div className="max-w-lg mx-auto px-4 py-6 sm:py-8">
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 w-8 h-8 rounded-lg flex items-center justify-center text-sm">
              +
            </span>
            Add Transaction
          </h1>
          <AddExpenseForm accounts={JSON.parse(JSON.stringify(accounts))} />
        </div>
      </div>
    </>
  );
}
