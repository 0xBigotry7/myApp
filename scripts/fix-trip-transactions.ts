import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const conversionRates: Record<string, number> = {
  USD: 1,
  EUR: 1.09,
  GBP: 1.27,
  JPY: 0.0067,
  CNY: 0.138,
  THB: 0.029,
  AUD: 0.66,
  CAD: 0.73,
  CHF: 1.13,
  HKD: 0.13,
  SGD: 0.74,
  KRW: 0.00075,
  MXN: 0.059,
  INR: 0.012,
  IDR: 0.000064,
  VND: 0.000064,
  PHP: 0.000041,
  MYR: 0.21,
  TWD: 0.032,
};

const convertCurrency = (amount: number, from: string, to: string): number => {
  if (from === to) return amount;
  const fromRate = conversionRates[from] || 1;
  const toRate = conversionRates[to] || 1;
  const amountInUSD = amount * fromRate;
  return amountInUSD / toRate;
};

async function main() {
  console.log("=== Fixing Trip Transaction Currencies ===\n");

  // 1. Get all trip-related transactions
  const transactions = await prisma.transaction.findMany({
    where: {
      isTripRelated: true,
    },
    include: {
      account: true,
    },
  });

  console.log(`Found ${transactions.length} trip-related transactions.`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const tx of transactions) {
    if (!tx.tripId) {
      skippedCount++;
      continue;
    }

    // 2. Find matching expense
    // We assume the raw amount matches (because that was the bug)
    // We search for expense with same tripId, date, and amount (approximate float check)
    
    const txAmountAbs = Math.abs(tx.amount);
    
    // We can't do precise float match in Prisma easily, so fetch candidates by trip and date
    const expenses = await prisma.expense.findMany({
      where: {
        tripId: tx.tripId,
        date: tx.date,
      },
    });

    // Find match in JS
    const matchingExpense = expenses.find(e => Math.abs(e.amount - txAmountAbs) < 0.01);

    if (!matchingExpense) {
      // console.log(`No matching expense found for TX ${tx.id} (Amount: ${txAmountAbs})`);
      skippedCount++;
      continue;
    }

    // 3. Check currency mismatch
    const expenseCurrency = matchingExpense.currency;
    const accountCurrency = tx.account.currency;

    if (expenseCurrency === accountCurrency) {
      // Correct behavior, no fix needed
      continue;
    }

    // 4. Calculate correct amount
    const correctAmount = convertCurrency(matchingExpense.amount, expenseCurrency, accountCurrency);
    
    // If the difference is significant (more than 1 unit of account currency? or just any diff?)
    // If we mistakenly deducted 1000 THB (as 1000 USD), difference is huge.
    // If we deducted 100 USD (as 100 USD), difference is 0.
    
    const diff = Math.abs(txAmountAbs - correctAmount);
    if (diff < 0.01) {
        continue;
    }

    console.log(`\nFixing TX ${tx.id}:`);
    console.log(`  Expense: ${matchingExpense.amount} ${expenseCurrency}`);
    console.log(`  Account: ${tx.account.name} (${accountCurrency})`);
    console.log(`  Current TX Amount: ${tx.amount} (Raw deduction)`);
    console.log(`  Correct TX Amount: -${correctAmount.toFixed(2)}`);
    
    const adjustment = txAmountAbs - correctAmount;
    console.log(`  Adjustment to Balance: +${adjustment.toFixed(2)}`);

    // 5. Update Transaction and Account
    await prisma.$transaction([
        prisma.transaction.update({
            where: { id: tx.id },
            data: {
                amount: -correctAmount, // Set to correct converted amount (negative)
            }
        }),
        prisma.account.update({
            where: { id: tx.accountId },
            data: {
                balance: {
                    increment: adjustment // Add back the over-deducted amount
                }
            }
        })
    ]);

    updatedCount++;
  }

  console.log(`\nSummary:`);
  console.log(`  Total Trip Transactions: ${transactions.length}`);
  console.log(`  Updated: ${updatedCount}`);
  console.log(`  Skipped/Correct: ${transactions.length - updatedCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

