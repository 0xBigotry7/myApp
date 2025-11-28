import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import TransactionsClient from "@/components/TransactionsClient";
import QuickAddTransaction from "@/components/QuickAddTransaction";
import { getHouseholdUserIds } from "@/lib/household";

export default async function TransactionsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get all household user IDs for shared financial view
  const householdUserIds = await getHouseholdUserIds();

  // Get all users for color coding
  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true },
  });

  // Fetch all household transactions with account details
  const transactions = await prisma.transaction.findMany({
    where: { userId: { in: householdUserIds } },
    include: {
      account: {
        select: {
          id: true,
          name: true,
          type: true,
          icon: true,
          color: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { date: "desc" },
    take: 100, // Limit to recent 100 transactions
  });

  // Serialize dates for client component
  const serializedTransactions = transactions.map(t => ({
    ...t,
    date: t.date.toISOString(),
    amount: Number(t.amount), // Ensure number type
  }));

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-zinc-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Transactions</h1>
            <p className="text-zinc-500 font-medium">Recent activity across all accounts</p>
          </div>
          
          <TransactionsClient 
            initialTransactions={serializedTransactions} 
            allUsers={allUsers} 
          />
        </div>
      </div>
      <QuickAddTransaction />
    </>
  );
}
