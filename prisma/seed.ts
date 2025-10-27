import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Define initial achievements based on requirements
  const achievements = [
    {
      name: 'First Focus',
      description: 'Complete your first Pomodoro session',
      criteria: JSON.stringify({
        type: 'session_count',
        threshold: 1,
      }),
    },
    {
      name: 'Week Warrior',
      description: 'Maintain a 7-day learning streak',
      criteria: JSON.stringify({
        type: 'streak',
        threshold: 7,
      }),
    },
    {
      name: 'Dedicated Learner',
      description: 'Accumulate 25 hours of total focus time',
      criteria: JSON.stringify({
        type: 'focus_time',
        threshold: 1500, // 25 hours in minutes
        unit: 'minutes',
      }),
    },
  ];

  // Create achievements using upsert to avoid duplicates
  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: {},
      create: achievement,
    });
    console.log(`✓ Created/verified achievement: ${achievement.name}`);
  }

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
