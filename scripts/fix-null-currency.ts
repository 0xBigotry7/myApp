import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Fixing NULL Currency Transactions ===\n");

  // Get all transactions with NULL currency
  const nullCurrencyTxs = await prisma.transaction.findMany({
    where: { currency: null },
    include: {
      trip: { select: { destination: true, name: true } },
      account: { select: { name: true, currency: true } }
    }
  });

  console.log(`Found ${nullCurrencyTxs.length} transactions with NULL currency\n`);

  let fixedCount = 0;

  for (const tx of nullCurrencyTxs) {
    const destination = tx.trip?.destination?.toLowerCase() || '';
    const isThailand = destination.includes('thailand') || destination.includes('phuket') || destination.includes('bangkok');
    
    // Determine if this is already a USD amount based on the value
    // Thai expenses would typically be 50-5000 THB ($1.45 - $145 USD)
    // If the amount is small (like -26.1, -11.28, -5.18) and it's a Thailand trip,
    // it's likely already been converted to USD
    
    let correctCurrency: string;
    const absAmount = Math.abs(tx.amount);
    
    if (isThailand) {
      // Heuristic: If amount is < 100 for a Thailand trip, it's likely already USD
      // Because most Thai transactions in THB would be 100+ (e.g., 100 THB = $2.90 USD)
      if (absAmount < 100) {
        correctCurrency = 'USD'; // Already converted
        console.log(`🔧 ${(tx.description || 'No desc').substring(0, 30).padEnd(30)} | ${tx.amount.toFixed(2).padStart(10)} → USD (already converted)`);
      } else {
        correctCurrency = 'THB'; // Original THB amount
        console.log(`🔧 ${(tx.description || 'No desc').substring(0, 30).padEnd(30)} | ${tx.amount.toFixed(2).padStart(10)} → THB (original currency)`);
      }
    } else {
      // Non-Thailand trips: use USD
      correctCurrency = 'USD';
      console.log(`✓  ${(tx.description || 'No desc').substring(0, 30).padEnd(30)} | ${tx.amount.toFixed(2).padStart(10)} → USD (non-Thai trip)`);
    }

    // Update the transaction
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { currency: correctCurrency }
    });
    
    fixedCount++;
  }

  console.log(`\n✅ Fixed ${fixedCount} transactions`);

  // Verify by checking remaining NULL currency transactions
  const remaining = await prisma.transaction.count({ where: { currency: null } });
  console.log(`\n📊 Remaining NULL currency transactions: ${remaining}`);

  // Now recalculate account balances
  console.log("\n\n=== Recalculating Account Balances ===\n");

  const accounts = await prisma.account.findMany({
    include: {
      transactions: {
        select: { amount: true, currency: true }
      }
    }
  });

  const conversionRates: Record<string, number> = {
    USD: 1, EUR: 1.09, GBP: 1.27, JPY: 0.0067, CNY: 0.138,
    THB: 0.029, AUD: 0.66, CAD: 0.73, CHF: 1.13, HKD: 0.13,
    SGD: 0.74, KRW: 0.00075, MXN: 0.059, INR: 0.012
  };

  const convertCurrency = (amount: number, from: string, to: string): number => {
    if (from === to) return amount;
    const fromRate = conversionRates[from] || 1;
    const toRate = conversionRates[to] || 1;
    return (amount * fromRate) / toRate;
  };

  let totalNetWorth = 0;

  for (const account of accounts) {
    let calculatedBalance = 0;

    for (const tx of account.transactions) {
      const txCurrency = tx.currency || account.currency;
      const amountInAccCurrency = convertCurrency(tx.amount, txCurrency, account.currency);
      calculatedBalance += amountInAccCurrency;
    }

    const usdValue = convertCurrency(calculatedBalance, account.currency, 'USD');
    totalNetWorth += usdValue;

    if (Math.abs(account.balance - calculatedBalance) > 0.01) {
      console.log(`🔧 ${account.name}: ${account.balance.toFixed(2)} → ${calculatedBalance.toFixed(2)} ${account.currency}`);
      await prisma.account.update({
        where: { id: account.id },
        data: { balance: calculatedBalance }
      });
    } else {
      console.log(`✅ ${account.name}: ${calculatedBalance.toFixed(2)} ${account.currency} (correct)`);
    }
  }

  console.log(`\n💰 Total Net Worth: $${totalNetWorth.toFixed(2)} USD`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



