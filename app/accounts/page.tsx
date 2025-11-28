import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import AccountsClient from "@/components/AccountsClient";

export default async function AccountsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: { transactions: true },
      },
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
  });

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <AccountsClient initialAccounts={accounts as any} />
        </div>
      </div>
    </>
  );
}
