const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash('polo', 12);
    console.log('Generated hash:', hashedPassword);

    // Update the user's password
    const result = await prisma.user.update({
      where: { email: 'paul@test.fr' },
      data: { password: hashedPassword },
    });

    console.log('✓ Password updated successfully for:', result.email);
  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
