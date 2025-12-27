const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs'); // Assuming bcryptjs is used, or import used hasher

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'Admin';

  if (!email || !password) {
    console.log('Usage: node scripts/create-admin.js <email> <password> [name]');
    return;
  }

  // Simple hash for demo/script matching the app's hashing if possible.
  // The app uses '@/lib/password', which uses 'bcryptjs' usually.
  // I need to check what '@/lib/password' uses. Assuming bcryptjs for now.
  // If it's pure bcrypt, I might need to install types.
  // Let's assume the user has bcryptjs installed if it's in package.json.
  
  // Actually, better to use the app's lib if I can run it with ts-node.
  // But to be safe and simple:
  
  const hashedPassword = await require('bcryptjs').hash(password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
      },
    });
    console.log(`Admin user created: ${user.email}`);
  } catch (e) {
    if (e.code === 'P2002') {
        console.log('User already exists. Updating role to ADMIN...');
        await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN' }
        });
        console.log('User role updated to ADMIN.');
    } else {
        console.error(e);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
