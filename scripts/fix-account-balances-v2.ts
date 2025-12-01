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
  console.log("=== Fixing Account Balances (Proper Currency Conversion) ===\n");

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
          isTripRelated: true,
        },
      },
    },
  });

  console.log(`Found ${accounts.length} accounts\n`);

  for (const account of accounts) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Account: ${account.name}`);
    console.log(`Currency: ${account.currency}`);
    console.log(`Current Balance: ${account.balance.toFixed(2)} ${account.currency}`);
    console.log(`Transactions: ${account.transactions.length}`);
    console.log(`${"=".repeat(60)}`);

    // Calculate correct balance by converting each transaction to account currency
    let correctBalance = 0;
    let breakdown: string[] = [];

    for (const tx of account.transactions) {
      const txCurrency = tx.currency || account.currency;
      
      // If transaction currency is different from account currency, convert it
      let amountToAdd = tx.amount;
      
      if (txCurrency !== account.currency) {
        // Convert from transaction currency to account currency
        amountToAdd = convertCurrency(tx.amount, txCurrency, account.currency);
        
        if (Math.abs(tx.amount) > 10) { // Only log significant transactions
          breakdown.push(`  ${tx.description?.substring(0, 30) || 'Unknown'}: ${tx.amount.toFixed(2)} ${txCurrency} → ${amountToAdd.toFixed(2)} ${account.currency}`);
        }
      }
      
      correctBalance += amountToAdd;
    }

    console.log(`\nCalculated Balance: ${correctBalance.toFixed(2)} ${account.currency}`);
    console.log(`Difference: ${(account.balance - correctBalance).toFixed(2)} ${account.currency}`);

    if (breakdown.length > 0 && breakdown.length <= 20) {
      console.log(`\nSample currency conversions:`);
      breakdown.slice(0, 10).forEach(b => console.log(b));
      if (breakdown.length > 10) {
        console.log(`  ... and ${breakdown.length - 10} more`);
      }
    }

    // Update if different
    if (Math.abs(account.balance - correctBalance) > 0.01) {
      console.log(`\n🔧 Updating balance from ${account.balance.toFixed(2)} to ${correctBalance.toFixed(2)}`);
      
      await prisma.account.update({
        where: { id: account.id },
        data: { balance: correctBalance },
      });
      
      console.log(`✅ Updated!`);
    } else {
      console.log(`\n✅ Balance is already correct!`);
    }
  }

  // Final summary
  console.log(`\n\n${"=".repeat(60)}`);
  console.log("FINAL ACCOUNT BALANCES");
  console.log(`${"=".repeat(60)}`);

  const finalAccounts = await prisma.account.findMany();
  let totalNetWorth = 0;

  for (const acc of finalAccounts) {
    const usdValue = convertCurrency(acc.balance, acc.currency, "USD");
    totalNetWorth += usdValue;
    console.log(`${acc.name}: ${acc.balance.toFixed(2)} ${acc.currency} (≈ $${usdValue.toFixed(2)} USD)`);
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



