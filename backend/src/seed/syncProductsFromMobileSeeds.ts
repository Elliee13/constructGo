import { prisma } from '../lib/prisma.js';

const STORE_ID = 'store-main';

type SeedProduct = {
  name: string;
  category: string;
  sku: string;
  price: number; // PHP major unit
};

const seedProducts: SeedProduct[] = [
  { name: 'Power Drill Set', category: 'Tools', sku: 'TLS-PD-18V', price: 1290 },
  { name: 'Circular Saw', category: 'Tools', sku: 'TLS-CS-185', price: 1490 },
  { name: 'Framing Hammer', category: 'Tools', sku: 'TLS-FH-20', price: 890 },
  { name: 'Measuring Tape', category: 'Tools', sku: 'TLS-MT-25', price: 420 },
  { name: 'Screwdriver Set', category: 'Tools', sku: 'TLS-SD-12', price: 760 },
  { name: 'Step Ladder', category: 'Tools', sku: 'TLS-SL-5FT', price: 1190 },
  { name: 'Steel Nails (Per Kilo)', category: 'Tools', sku: 'TLS-NAILS-001', price: 65 },
  { name: 'Digital Multimeter', category: 'Electrical', sku: 'ELC-DM-6000', price: 890 },
  { name: 'True RMS Multimeter', category: 'Electrical', sku: 'ELC-TRMS-600', price: 1190 },
  { name: 'Adjustable Hacksaw', category: 'Electrical', sku: 'ELC-HSW-12', price: 420 },
  { name: 'Mini Hacksaw', category: 'Electrical', sku: 'ELC-HSW-M6', price: 310 },
  { name: 'Ratcheting Crimping Tool', category: 'Electrical', sku: 'ELC-RCT-8P8C', price: 760 },
  { name: 'Wire Terminal Crimper', category: 'Electrical', sku: 'ELC-WTC-2210', price: 680 },
  { name: 'PVC Pipe Cutter', category: 'Plumbing', sku: 'PLB-PC-PVC', price: 450 },
  { name: 'Heavy-Duty PVC Cutter', category: 'Plumbing', sku: 'PLB-PC-P63', price: 530 },
  { name: 'Straight Pipe Wrench', category: 'Plumbing', sku: 'PLB-SPW-14', price: 620 },
  { name: 'Heavy Pipe Wrench', category: 'Plumbing', sku: 'PLB-HPW-18', price: 680 },
  { name: 'Manual Tube Bender', category: 'Plumbing', sku: 'PLB-MTB-180', price: 740 },
  { name: 'Copper Pipe Bender', category: 'Plumbing', sku: 'PLB-CPB-180', price: 790 },
  { name: 'Paint Roller', category: 'Paint', sku: 'PNT-PR-9', price: 240 },
  { name: 'Paint Roller Refill', category: 'Paint', sku: 'PNT-PRR-9', price: 180 },
  { name: 'Paint Brush Set', category: 'Paint', sku: 'PNT-PBS-5', price: 280 },
  { name: 'Angled Paint Brush Set', category: 'Paint', sku: 'PNT-APB-4', price: 320 },
  { name: 'Electric Paint Spray Gun', category: 'Paint', sku: 'PNT-EPS-500', price: 1390 },
];

const run = async () => {
  const existing = await prisma.product.findMany({
    where: { storeId: STORE_ID },
    select: { id: true, sku: true, deletedAt: true },
  });

  const existingBySku = new Map(existing.map((item) => [item.sku, item]));
  let created = 0;
  let updated = 0;

  for (const seed of seedProducts) {
    const payload = {
      storeId: STORE_ID,
      name: seed.name,
      category: seed.category,
      sku: seed.sku,
      priceCents: Math.round(seed.price * 100),
      currency: 'PHP',
      description: `${seed.name} (synced from mobile seed)`,
      imageUrl: null as string | null,
      images: [] as string[],
      stock: 50,
      isActive: true,
      deletedAt: null as Date | null,
    };

    const matched = existingBySku.get(seed.sku);
    if (!matched) {
      await prisma.product.create({ data: payload });
      created += 1;
      continue;
    }

    await prisma.product.update({
      where: { id: matched.id },
      data: payload,
    });
    updated += 1;
  }

  const seedSkuSet = new Set(seedProducts.map((item) => item.sku));
  const staleIds = existing
    .filter((item) => !seedSkuSet.has(item.sku) && item.deletedAt === null)
    .map((item) => item.id);

  if (staleIds.length > 0) {
    await prisma.product.updateMany({
      where: { id: { in: staleIds } },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  console.info('[seed] sync products complete', {
    storeId: STORE_ID,
    seeded: seedProducts.length,
    created,
    updated,
    deactivated: staleIds.length,
  });
};

run()
  .catch((error) => {
    console.error('[seed] sync products failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
