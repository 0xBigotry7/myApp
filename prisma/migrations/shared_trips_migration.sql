-- Manual migration to add shared trips support

-- Step 1: Create TripMember table
CREATE TABLE "TripMember" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripMember_pkey" PRIMARY KEY ("id")
);

-- Step 2: Add ownerId column (allow NULL temporarily)
ALTER TABLE "Trip" ADD COLUMN "ownerId" TEXT;

-- Step 3: Copy existing userId to ownerId
UPDATE "Trip" SET "ownerId" = "userId";

-- Step 4: Make ownerId NOT NULL
ALTER TABLE "Trip" ALTER COLUMN "ownerId" SET NOT NULL;

-- Step 5: Create TripMember entries for existing trips (both BABER and baber get access to all trips)
INSERT INTO "TripMember" ("id", "tripId", "userId", "role")
SELECT
    gen_random_uuid()::text,
    t."id",
    t."ownerId",
    'owner'
FROM "Trip" t;

-- Step 6: Add the other user as member to all trips
INSERT INTO "TripMember" ("id", "tripId", "userId", "role")
SELECT
    gen_random_uuid()::text,
    t."id",
    u."id",
    'member'
FROM "Trip" t
CROSS JOIN "User" u
WHERE u."id" != t."ownerId";

-- Step 7: Drop old userId column
ALTER TABLE "Trip" DROP COLUMN "userId";

-- Step 8: Add foreign keys and unique constraints
CREATE UNIQUE INDEX "TripMember_tripId_userId_key" ON "TripMember"("tripId", "userId");

ALTER TABLE "Trip" ADD CONSTRAINT "Trip_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TripMember" ADD CONSTRAINT "TripMember_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TripMember" ADD CONSTRAINT "TripMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
