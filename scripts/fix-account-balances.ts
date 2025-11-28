import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Currency conversion rates to USD
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

async function main() {
  console.log('Recalculating account balances based on proper currency conversion...\n');

  // Get all accounts
  const accounts = await prisma.account.findMany({
    include: {
      transactions: {
        select: {
          id: true,
          amount: true,
          currency: true,
          merchantName: true,
          date: true,
        },
      },
    },
  });

  for (const account of accounts) {
    console.log(`\nAccount: ${account.name} (${account.type})`);
    console.log(`Current balance: $${account.balance.toFixed(2)}`);
    console.log(`Account currency: ${account.currency}`);
    console.log('-'.repeat(60));

    // Calculate correct balance based on transactions
    let correctBalance = 0;
    let rawBalance = 0;

    for (const tx of account.transactions) {
      // If transaction has a currency set, convert to account currency
      const txCurrency = tx.currency || account.currency;
      const txRate = conversionRates[txCurrency] || 1;
      const accountRate = conversionRates[account.currency] || 1;
      
      // Convert transaction amount to USD first, then to account currency
      const amountInUSD = tx.amount * txRate;
      const amountInAccountCurrency = amountInUSD / accountRate;
      
      correctBalance += amountInAccountCurrency;
      rawBalance += tx.amount;

      // Log transactions with different currencies
      if (txCurrency !== account.currency) {
        console.log(`  ${tx.merchantName || 'Unknown'}: ${txCurrency} ${tx.amount.toFixed(2)} -> ${account.currency} ${amountInAccountCurrency.toFixed(2)}`);
      }
    }

    console.log('-'.repeat(60));
    console.log(`Raw balance (incorrect): $${rawBalance.toFixed(2)}`);
    console.log(`Correct balance: $${correctBalance.toFixed(2)}`);
    console.log(`Difference: $${(rawBalance - correctBalance).toFixed(2)}`);

    // Update the account balance
    if (Math.abs(account.balance - correctBalance) > 0.01) {
      console.log(`\n>>> Updating account balance from $${account.balance.toFixed(2)} to $${correctBalance.toFixed(2)}`);
      
      await prisma.account.update({
        where: { id: account.id },
        data: { balance: correctBalance },
      });
      
      console.log('>>> Balance updated!');
    } else {
      console.log('\n>>> Balance is already correct.');
    }
  }

  console.log('\n========================================');
  console.log('Account balance recalculation complete!');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


