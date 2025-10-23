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

  console.log("Created users:", { user1, user2 });
  console.log("\nYou can now log in with:");
  console.log("Email: you@example.com");
  console.log("Password: password123");
  console.log("\nOr:");
  console.log("Email: wife@example.com");
  console.log("Password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
