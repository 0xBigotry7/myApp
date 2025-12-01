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
};

const convertCurrency = (amount: number, from: string, to: string): number => {
  if (from === to) return amount;
  const fromRate = conversionRates[from] || 1;
  const toRate = conversionRates[to] || 1;
  const amountInUSD = amount * fromRate;
  return amountInUSD / toRate;
};

async function main() {
  console.log("=== Fixing All Account Balances ===\n");

  // Get all accounts with their transactions
  const accounts = await prisma.account.findMany({
    include: {
      transactions: {
        select: {
          id: true,
          amount: true,
          currency: true,
          description: true,
          date: true,
        },
      },
    },
  });

  for (const account of accounts) {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`Account: ${account.name} (${account.currency})`);
    console.log(`Current Balance: ${account.balance.toFixed(2)} ${account.currency}`);
    console.log(`${"=".repeat(70)}`);

    let correctBalance = 0;
    let conversions: string[] = [];
    let totalConverted = 0;

    for (const tx of account.transactions) {
      const txCurrency = tx.currency; // Use stored currency, could be THB, USD, CNY, or NULL
      
      let amountInAccountCurrency: number;
      
      if (!txCurrency || txCurrency === account.currency) {
        // No currency specified or same as account - use amount as is
        amountInAccountCurrency = tx.amount;
      } else {
        // Different currency - need to convert
        amountInAccountCurrency = convertCurrency(tx.amount, txCurrency, account.currency);
        totalConverted++;
        
        if (Math.abs(tx.amount) > 50) { // Log significant conversions
          conversions.push(
            `  ${(tx.description || 'Unknown').substring(0, 20).padEnd(20)} | ${tx.amount.toFixed(2).padStart(10)} ${txCurrency.padEnd(3)} → ${amountInAccountCurrency.toFixed(2).padStart(10)} ${account.currency}`
          );
        }
      }
      
      correctBalance += amountInAccountCurrency;
    }

    console.log(`\nTransactions: ${account.transactions.length} total, ${totalConverted} needed conversion`);
    
    if (conversions.length > 0) {
      console.log(`\nCurrency conversions applied:`);
      conversions.slice(0, 15).forEach(c => console.log(c));
      if (conversions.length > 15) {
        console.log(`  ... and ${conversions.length - 15} more`);
      }
    }

    console.log(`\nCorrect Balance: ${correctBalance.toFixed(2)} ${account.currency}`);
    const diff = account.balance - correctBalance;
    console.log(`Difference: ${diff.toFixed(2)} ${account.currency}`);

    if (Math.abs(diff) > 0.01) {
      console.log(`\n🔧 Updating balance...`);
      
      await prisma.account.update({
        where: { id: account.id },
        data: { balance: correctBalance },
      });
      
      console.log(`✅ Updated from ${account.balance.toFixed(2)} to ${correctBalance.toFixed(2)} ${account.currency}`);
    } else {
      console.log(`\n✅ Balance is already correct!`);
    }
  }

  // Final summary
  console.log(`\n\n${"=".repeat(70)}`);
  console.log("FINAL RESULTS");
  console.log(`${"=".repeat(70)}\n`);

  const finalAccounts = await prisma.account.findMany();
  let totalNetWorth = 0;

  for (const acc of finalAccounts) {
    const usdValue = convertCurrency(acc.balance, acc.currency, "USD");
    totalNetWorth += usdValue;
    console.log(`📊 ${acc.name}: ${acc.balance.toFixed(2)} ${acc.currency} (≈ $${usdValue.toFixed(2)} USD)`);
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



