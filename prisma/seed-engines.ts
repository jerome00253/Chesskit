import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding engines...');

  // Define existing engines
  const engines = [
    {
      name: 'Stockfish 17',
      identifier: 'stockfish_17',
      version: '17',
      type: 'standard',
      filePath: '/engines/stockfish-17/stockfish.js',
      isActive: true,
      isDefault: false,
    },
    {
      name: 'Stockfish 17 Lite',
      identifier: 'stockfish_17_lite',
      version: '17',
      type: 'lite',
      filePath: '/engines/stockfish-17/stockfish-lite.js',
      isActive: true,
      isDefault: true, // Default engine
    },
    {
      name: 'Stockfish 16.1',
      identifier: 'stockfish_16_1',
      version: '16.1',
      type: 'standard',
      filePath: '/engines/stockfish-16.1/stockfish.js',
      isActive: true,
      isDefault: false,
    },
    {
      name: 'Stockfish 16.1 Lite',
      identifier: 'stockfish_16_1_lite',
      version: '16.1',
      type: 'lite',
      filePath: '/engines/stockfish-16.1/stockfish-lite.js',
      isActive: true,
      isDefault: false,
    },
    {
      name: 'Stockfish 16 NNUE',
      identifier: 'stockfish_16_nnue',
      version: '16',
      type: 'standard',
      filePath: '/engines/stockfish-16/stockfish-nnue.js',
      isActive: true,
      isDefault: false,
    },
    {
      name: 'Stockfish 16',
      identifier: 'stockfish_16',
      version: '16',
      type: 'standard',
      filePath: '/engines/stockfish-16/stockfish.js',
      isActive: true,
      isDefault: false,
    },
    {
      name: 'Stockfish 11',
      identifier: 'stockfish_11',
      version: '11',
      type: 'standard',
      filePath: '/engines/stockfish-11.js',
      isActive: false, // Older version, disabled by default
      isDefault: false,
    },
  ];

  for (const engine of engines) {
    const existing = await prisma.engine.findUnique({
      where: { identifier: engine.identifier },
    });

    if (!existing) {
      await prisma.engine.create({
        data: engine,
      });
      console.log(`✓ Created engine: ${engine.name}`);
    } else {
      console.log(`- Engine already exists: ${engine.name}`);
    }
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
