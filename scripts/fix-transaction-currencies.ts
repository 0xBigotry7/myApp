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
  console.log('Starting to fix transaction currencies...\n');

  // Find all trip-related transactions that don't have a currency set
  // and where the trip destination suggests a non-USD currency
  const transactions = await prisma.transaction.findMany({
    where: {
      isTripRelated: true,
      currency: null,
    },
    include: {
      trip: true,
      account: true,
    },
  });

  console.log(`Found ${transactions.length} trip-related transactions without currency set.\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const tx of transactions) {
    // Determine the expected currency based on trip destination
    let expectedCurrency: string | null = null;
    
    if (tx.trip) {
      const destination = tx.trip.destination.toLowerCase();
      
      if (destination.includes('thailand') || destination.includes('phuket') || destination.includes('bangkok')) {
        expectedCurrency = 'THB';
      } else if (destination.includes('japan') || destination.includes('tokyo') || destination.includes('osaka')) {
        expectedCurrency = 'JPY';
      } else if (destination.includes('china') || destination.includes('beijing') || destination.includes('shanghai')) {
        expectedCurrency = 'CNY';
      } else if (destination.includes('korea') || destination.includes('seoul')) {
        expectedCurrency = 'KRW';
      } else if (destination.includes('uk') || destination.includes('london') || destination.includes('england')) {
        expectedCurrency = 'GBP';
      } else if (destination.includes('europe') || destination.includes('paris') || destination.includes('berlin') || destination.includes('rome')) {
        expectedCurrency = 'EUR';
      }
      // For Puerto Rico, USD is correct (it's a US territory)
    }

    // If we can determine the expected currency and it's different from USD
    if (expectedCurrency && expectedCurrency !== 'USD') {
      // Check if the amount looks like it's already in local currency
      // (i.e., it's a "large" number that would make more sense as local currency)
      const amountAbs = Math.abs(tx.amount);
      const conversionRate = conversionRates[expectedCurrency] || 1;
      const amountInUSD = amountAbs * conversionRate;
      
      // If the amount is reasonable as local currency (converts to < $10,000 USD for most expenses)
      // and is larger than what we'd expect in USD
      const isLikelyLocalCurrency = amountAbs > 100 && amountInUSD < 10000;
      
      if (isLikelyLocalCurrency) {
        console.log(`Updating transaction: ${tx.merchantName || tx.description || tx.category}`);
        console.log(`  Amount: ${amountAbs} -> Setting currency to ${expectedCurrency}`);
        console.log(`  This would be ~$${amountInUSD.toFixed(2)} USD`);
        console.log(`  Trip: ${tx.trip?.name} (${tx.trip?.destination})`);
        
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { currency: expectedCurrency },
        });
        
        updatedCount++;
        console.log(`  ✓ Updated!\n`);
      } else {
        console.log(`Skipping transaction: ${tx.merchantName || tx.description || tx.category}`);
        console.log(`  Amount: ${amountAbs} (likely already in USD or small local amount)`);
        console.log(`  Trip: ${tx.trip?.name}\n`);
        skippedCount++;
      }
    } else {
      skippedCount++;
    }
  }

  console.log('\n========================================');
  console.log(`Summary:`);
  console.log(`  Updated: ${updatedCount} transactions`);
  console.log(`  Skipped: ${skippedCount} transactions`);
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


