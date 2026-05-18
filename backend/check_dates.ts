import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tasks = await prisma.task.findMany({
        take: 5,
        select: { title: true, dueDate: true, status: true }
    });
    console.log(tasks);
}
main().finally(() => prisma.$disconnect());
