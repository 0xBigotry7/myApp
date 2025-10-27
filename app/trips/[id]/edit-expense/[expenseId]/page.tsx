import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import EditExpenseForm from "@/components/EditExpenseForm";
import { getServerLocale } from "@/lib/locale-server";
import { getTranslations } from "@/lib/i18n";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string; expenseId: string }>;
}) {
  const session = await auth();
  const { id: tripId, expenseId } = await params;
  const locale = await getServerLocale();
  const t = getTranslations(locale);

  if (!session?.user) {
    redirect("/login");
  }

  // Get the expense
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      trip: {
        include: {
          budgetCategories: true,
          members: true,
        },
      },
    },
  });

  if (!expense) {
    notFound();
  }

  // Check if user has access
  const hasAccess =
    expense.trip.ownerId === session.user.id ||
    expense.trip.members.some((m) => m.userId === session.user.id) ||
    expense.userId === session.user.id;

  if (!hasAccess) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">✏️ {t.edit} {t.addExpense}</h1>
            <p className="text-gray-600 mt-2">{expense.trip.name || expense.trip.destination}</p>
          </div>

          <EditExpenseForm
            expense={expense}
            tripId={tripId}
            categories={expense.trip.budgetCategories.map((bc) => bc.category)}
          />
        </div>
      </div>
    </div>
  );
}
