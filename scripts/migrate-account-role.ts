import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting accountRole backfill...");
  // MongoDB requires using updateMany to set the default accountRole for existing records
  // Since we don't have direct MongoDB native query without dropping down to raw,
  // we can use Prisma's updateMany to update all records where accountRole is unset.
  // However, Prisma might not be able to find where accountRole is "missing", so we update all to PRIMARY
  // since the schema was just added and prior to this they were effectively all primary.

  const result = await prisma.instaAccount.updateMany({
    data: {
      accountRole: "PRIMARY",
    },
    // We update all, since secondary accounts didn't exist before this feature was introduced
  });

  console.log(`Updated ${result.count} InstaAccount records to have accountRole: 'PRIMARY'`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
