import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create users for you and your wife
  const hashedPassword = await bcrypt.hash("password123", 10);

  const user1 = await prisma.user.upsert({
    where: { email: "you@example.com" },
    update: {},
    create: {
      email: "you@example.com",
      password: hashedPassword,
      name: "You",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "wife@example.com" },
    update: {},
    create: {
      email: "wife@example.com",
      password: hashedPassword,
      name: "Wife",
    },
  });

  // Create demo accounts matching UI instructions
  const baberHusbandPassword = await bcrypt.hash("baberhusband", 10);
  const baberWifePassword = await bcrypt.hash("baberwife", 10);

  const baber1 = await prisma.user.upsert({
    where: { email: "BABER" },
    update: {
      password: baberHusbandPassword,
    },
    create: {
      email: "BABER",
      password: baberHusbandPassword,
      name: "BABER",
    },
  });

  const baber2 = await prisma.user.upsert({
    where: { email: "baber" },
    update: {
      password: baberWifePassword,
    },
    create: {
      email: "baber",
      password: baberWifePassword,
      name: "baber",
    },
  });

  // Create a sample trip for BABER
  const trip = await prisma.trip.create({
    data: {
      name: "Japan Adventure",
      destination: "Tokyo, Japan",
      startDate: new Date("2025-04-01"),
      endDate: new Date("2025-04-14"),
      totalBudget: 5000,
      ownerId: baber1.id,
      members: {
        create: [
            { userId: baber1.id, role: "owner" },
            { userId: baber2.id, role: "member" }
        ]
      },
      expenses: {
        create: [
          {
            amount: 1200,
            category: "Transportation",
            currency: "USD",
            date: new Date("2025-04-01"),
            note: "Flights to Tokyo",
            userId: baber1.id,
          },
          {
            amount: 150,
            category: "Food",
            currency: "USD",
            date: new Date("2025-04-02"),
            note: "Sushi Dinner",
            userId: baber1.id,
          },
        ],
      },
    },
  });

  console.log("Created users:", { user1, user2, baber1, baber2 });
  console.log("Created trip:", trip);
  
  console.log("\nYou can now log in with:");
  console.log("Email: you@example.com");
  console.log("Password: password123");
  console.log("\nOr:");
  console.log("Email: BABER");
  console.log("Password: baberhusband");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
