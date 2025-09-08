import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Очистка таблицы Units...");
    await prisma.unitNew.deleteMany({});
    await prisma.advertisingStat.deleteMany({});
    await prisma.advertising.deleteMany({});
    console.log("Таблица Units очищена ✅");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
