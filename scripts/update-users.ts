import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Updating user accounts...");

  // Hash passwords
  const baberHusbandPassword = await bcrypt.hash("baberhusband", 10);
  const baberWifePassword = await bcrypt.hash("baberwife", 10);

  // Get all existing users to see what we have
  const existingUsers = await prisma.user.findMany();
  console.log("\nExisting users:", existingUsers.map(u => ({ email: u.email, name: u.name })));

  // Delete all existing users (and their trips due to cascade)
  await prisma.user.deleteMany({});
  console.log("\nDeleted all existing users");

  // Create new users
  const husband = await prisma.user.create({
    data: {
      email: "BABER",
      password: baberHusbandPassword,
      name: "BABER",
    },
  });

  const wife = await prisma.user.create({
    data: {
      email: "baber",
      password: baberWifePassword,
      name: "baber",
    },
  });

  console.log("\n✅ Created new users:");
  console.log("Husband account:");
  console.log("  Email/Username: BABER");
  console.log("  Password: baberhusband");
  console.log("  Name: BABER");
  console.log("\nWife account:");
  console.log("  Email/Username: baber");
  console.log("  Password: baberwife");
  console.log("  Name: baber");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
