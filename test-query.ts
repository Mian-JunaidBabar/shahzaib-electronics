import { prisma } from './lib/prisma'

async function main() {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const grouped = await prisma.orderItem.groupBy({
    by: ['variantId'],
    _sum: { quantity: true },
    where: {
      order: { createdAt: { gte: since } }
    },
    orderBy: {
      _sum: { quantity: 'desc' }
    },
    take: 5
  });
  console.log(grouped);
}
main().finally(() => prisma.$disconnect());
