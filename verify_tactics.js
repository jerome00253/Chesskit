const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const gameId = 3073;
  console.log(`Checking Critical Moments for Game ${gameId}...`);

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      criticalMoments: true
    }
  });

  if (!game) {
    console.log("Game not found!");
    return;
  }

  console.log(`Found ${game.criticalMoments.length} critical moments.`);
  
  const tacticalMoments = game.criticalMoments.filter(cm => cm.tactical);
  console.log(`Found ${tacticalMoments.length} TACTICAL moments.`);

  tacticalMoments.forEach(cm => {
    console.log(`\n--- Ply ${cm.ply} (${cm.move}) ---`);
    console.log(`Type: ${cm.type}`);
    console.log(`Themes: ${JSON.stringify(cm.themes)}`);
    console.log(`Position Context: ${cm.positionContext}`);
    console.log(`Description: ${cm.description}`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
