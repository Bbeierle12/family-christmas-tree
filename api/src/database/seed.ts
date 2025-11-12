import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/shared/utils/password';
import { logger } from '@/config/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('🌱 Starting database seed...');

  // Clean existing data (in development only!)
  if (process.env.NODE_ENV === 'development') {
    logger.info('🧹 Cleaning existing data...');
    await prisma.activityLog.deleteMany();
    await prisma.edge.deleteMany();
    await prisma.giftIdea.deleteMany();
    await prisma.person.deleteMany();
    await prisma.giftMap.deleteMany();
    await prisma.workspaceMember.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  }

  // Create test users
  logger.info('👤 Creating test users...');

  const demoPassword = await hashPassword('Demo1234!');

  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      passwordHash: demoPassword,
      displayName: 'Alice Johnson',
      emailVerified: true,
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      passwordHash: demoPassword,
      displayName: 'Bob Smith',
      emailVerified: true,
    },
  });

  const carol = await prisma.user.create({
    data: {
      email: 'carol@example.com',
      passwordHash: demoPassword,
      displayName: 'Carol Williams',
      emailVerified: true,
    },
  });

  logger.info(`✅ Created ${3} users`);

  // Create workspaces
  logger.info('🏢 Creating workspaces...');

  const aliceWorkspace = await prisma.workspace.create({
    data: {
      name: "Alice's Family",
      slug: 'alice-family',
      ownerId: alice.id,
      members: {
        create: [
          {
            userId: alice.id,
            role: 'owner',
            status: 'active',
          },
          {
            userId: bob.id,
            role: 'editor',
            status: 'active',
          },
        ],
      },
    },
  });

  const bobWorkspace = await prisma.workspace.create({
    data: {
      name: "Bob's Friends",
      slug: 'bob-friends',
      ownerId: bob.id,
      members: {
        create: [
          {
            userId: bob.id,
            role: 'owner',
            status: 'active',
          },
          {
            userId: carol.id,
            role: 'viewer',
            status: 'active',
          },
        ],
      },
    },
  });

  logger.info(`✅ Created ${2} workspaces`);

  // Create gift maps
  logger.info('🎁 Creating gift maps...');

  const christmasMap = await prisma.giftMap.create({
    data: {
      workspaceId: aliceWorkspace.id,
      title: 'Christmas 2024',
      year: 2024,
      occasion: 'christmas',
      description: 'Holiday gift planning for the family',
      color: '#dc2626',
      createdBy: alice.id,
    },
  });

  const birthdayMap = await prisma.giftMap.create({
    data: {
      workspaceId: aliceWorkspace.id,
      title: "Mom's 60th Birthday",
      year: 2024,
      occasion: 'birthday',
      description: 'Special birthday celebration',
      color: '#7c3aed',
      createdBy: alice.id,
    },
  });

  const friendsMap = await prisma.giftMap.create({
    data: {
      workspaceId: bobWorkspace.id,
      title: 'Holiday Gifts 2024',
      year: 2024,
      occasion: 'christmas',
      description: 'Gifts for close friends',
      color: '#059669',
      createdBy: bob.id,
    },
  });

  logger.info(`✅ Created ${3} gift maps`);

  // Create people for Christmas map
  logger.info('👥 Creating people...');

  const mom = await prisma.person.create({
    data: {
      giftMapId: christmasMap.id,
      name: 'Mom',
      email: 'mom@family.com',
      budgetMin: 100,
      budgetMax: 200,
      ageGroup: 'senior',
      interests: ['gardening', 'cooking', 'reading'],
      notes: 'Loves mystery novels and herb gardens',
      color: '#f472b6',
      position: { x: 100, y: 100 },
    },
  });

  const dad = await prisma.person.create({
    data: {
      giftMapId: christmasMap.id,
      name: 'Dad',
      email: 'dad@family.com',
      budgetMin: 150,
      budgetMax: 250,
      ageGroup: 'senior',
      interests: ['golf', 'technology', 'grilling'],
      notes: 'Tech enthusiast, loves outdoor cooking',
      color: '#60a5fa',
      position: { x: 300, y: 100 },
    },
  });

  const sister = await prisma.person.create({
    data: {
      giftMapId: christmasMap.id,
      name: 'Sarah (Sister)',
      email: 'sarah@family.com',
      budgetMin: 50,
      budgetMax: 100,
      ageGroup: 'adult',
      interests: ['fitness', 'travel', 'photography'],
      notes: 'Marathon runner, loves adventure',
      color: '#fb923c',
      position: { x: 200, y: 250 },
    },
  });

  const nephew = await prisma.person.create({
    data: {
      giftMapId: christmasMap.id,
      name: 'Tommy (Nephew)',
      budgetMin: 30,
      budgetMax: 60,
      ageGroup: 'child',
      interests: ['lego', 'dinosaurs', 'video games'],
      notes: 'Obsessed with dinosaurs, age 8',
      color: '#34d399',
      position: { x: 200, y: 400 },
    },
  });

  // People for birthday map
  const momBday = await prisma.person.create({
    data: {
      giftMapId: birthdayMap.id,
      name: 'Mom',
      budgetMin: 200,
      budgetMax: 500,
      ageGroup: 'senior',
      interests: ['jewelry', 'spa', 'travel'],
      notes: 'Milestone 60th birthday!',
      color: '#a78bfa',
      position: { x: 200, y: 200 },
    },
  });

  // People for friends map
  const friend1 = await prisma.person.create({
    data: {
      giftMapId: friendsMap.id,
      name: 'Mike',
      budgetMin: 25,
      budgetMax: 50,
      ageGroup: 'adult',
      interests: ['coffee', 'books'],
      notes: 'College roommate',
      color: '#fbbf24',
      position: { x: 150, y: 150 },
    },
  });

  logger.info(`✅ Created ${6} people`);

  // Create gift ideas
  logger.info('💡 Creating gift ideas...');

  // Ideas for Mom (Christmas)
  await prisma.giftIdea.create({
    data: {
      personId: mom.id,
      title: 'Herb Garden Starter Kit',
      description: 'Complete indoor herb garden with grow light',
      price: 89.99,
      currency: 'USD',
      priority: 1,
      url: 'https://example.com/herb-garden',
      status: 'decided',
      createdBy: alice.id,
    },
  });

  await prisma.giftIdea.create({
    data: {
      personId: mom.id,
      title: 'Mystery Book Collection',
      description: 'Agatha Christie complete collection',
      price: 124.99,
      currency: 'USD',
      priority: 0,
      url: 'https://example.com/books',
      status: 'purchased',
      purchasedBy: bob.id,
      purchasedAt: new Date(),
      createdBy: bob.id,
    },
  });

  await prisma.giftIdea.create({
    data: {
      personId: mom.id,
      title: 'Cooking Class Voucher',
      description: 'Italian cuisine cooking class',
      price: 150,
      currency: 'USD',
      priority: 0,
      status: 'considering',
      createdBy: alice.id,
    },
  });

  // Ideas for Dad
  await prisma.giftIdea.create({
    data: {
      personId: dad.id,
      title: 'Smart Golf Rangefinder',
      description: 'GPS-enabled golf rangefinder with slope',
      price: 199.99,
      currency: 'USD',
      priority: 1,
      url: 'https://example.com/rangefinder',
      status: 'idea',
      createdBy: alice.id,
    },
  });

  await prisma.giftIdea.create({
    data: {
      personId: dad.id,
      title: 'Premium Grilling Tool Set',
      description: 'Professional stainless steel BBQ tools',
      price: 79.99,
      currency: 'USD',
      priority: 0,
      url: 'https://example.com/grill-tools',
      status: 'decided',
      createdBy: alice.id,
    },
  });

  // Ideas for Sister
  await prisma.giftIdea.create({
    data: {
      personId: sister.id,
      title: 'Fitness Tracker',
      description: 'Advanced fitness watch with GPS',
      price: 249.99,
      currency: 'USD',
      priority: 1,
      url: 'https://example.com/fitness-watch',
      status: 'considering',
      createdBy: alice.id,
    },
  });

  await prisma.giftIdea.create({
    data: {
      personId: sister.id,
      title: 'Travel Camera',
      description: 'Compact mirrorless camera',
      price: 599.99,
      currency: 'USD',
      priority: 0,
      status: 'idea',
      createdBy: alice.id,
    },
  });

  // Ideas for Nephew
  await prisma.giftIdea.create({
    data: {
      personId: nephew.id,
      title: 'LEGO Jurassic Park Set',
      description: 'T-Rex Breakout building set',
      price: 49.99,
      currency: 'USD',
      priority: 1,
      url: 'https://example.com/lego',
      status: 'purchased',
      purchasedBy: alice.id,
      purchasedAt: new Date(),
      createdBy: alice.id,
    },
  });

  await prisma.giftIdea.create({
    data: {
      personId: nephew.id,
      title: 'Dinosaur Encyclopedia',
      description: 'Illustrated dinosaur book for kids',
      price: 24.99,
      currency: 'USD',
      priority: 0,
      status: 'decided',
      createdBy: bob.id,
    },
  });

  // Ideas for Mom's birthday
  await prisma.giftIdea.create({
    data: {
      personId: momBday.id,
      title: 'Pearl Necklace',
      description: 'Elegant freshwater pearl necklace',
      price: 299,
      currency: 'USD',
      priority: 1,
      url: 'https://example.com/jewelry',
      status: 'decided',
      createdBy: alice.id,
    },
  });

  await prisma.giftIdea.create({
    data: {
      personId: momBday.id,
      title: 'Spa Day Package',
      description: 'Full day spa treatment',
      price: 250,
      currency: 'USD',
      priority: 1,
      status: 'considering',
      createdBy: alice.id,
    },
  });

  // Ideas for Friend
  await prisma.giftIdea.create({
    data: {
      personId: friend1.id,
      title: 'Coffee Subscription',
      description: '3-month specialty coffee subscription',
      price: 45,
      currency: 'USD',
      priority: 0,
      url: 'https://example.com/coffee',
      status: 'idea',
      createdBy: bob.id,
    },
  });

  logger.info(`✅ Created ${12} gift ideas`);

  // Create edges for visualization
  logger.info('🔗 Creating graph edges...');

  // Christmas map edges (ROOT -> People)
  await prisma.edge.create({
    data: {
      giftMapId: christmasMap.id,
      sourceId: 'root',
      sourceType: 'ROOT',
      targetId: mom.id,
      targetType: 'PERSON',
      style: { color: '#f472b6', strokeWidth: 2 },
    },
  });

  await prisma.edge.create({
    data: {
      giftMapId: christmasMap.id,
      sourceId: 'root',
      sourceType: 'ROOT',
      targetId: dad.id,
      targetType: 'PERSON',
      style: { color: '#60a5fa', strokeWidth: 2 },
    },
  });

  await prisma.edge.create({
    data: {
      giftMapId: christmasMap.id,
      sourceId: 'root',
      sourceType: 'ROOT',
      targetId: sister.id,
      targetType: 'PERSON',
      style: { color: '#fb923c', strokeWidth: 2 },
    },
  });

  await prisma.edge.create({
    data: {
      giftMapId: christmasMap.id,
      sourceId: 'root',
      sourceType: 'ROOT',
      targetId: nephew.id,
      targetType: 'PERSON',
      style: { color: '#34d399', strokeWidth: 2 },
    },
  });

  logger.info(`✅ Created ${4} edges`);

  // Create activity logs
  logger.info('📊 Creating activity logs...');

  await prisma.activityLog.create({
    data: {
      giftMapId: christmasMap.id,
      userId: alice.id,
      action: 'created',
      entityType: 'GiftMap',
      entityId: christmasMap.id,
      description: 'Created gift map "Christmas 2024"',
    },
  });

  await prisma.activityLog.create({
    data: {
      giftMapId: christmasMap.id,
      userId: bob.id,
      action: 'purchased',
      entityType: 'GiftIdea',
      entityId: nephew.id,
      description: 'Marked "LEGO Jurassic Park Set" as purchased',
    },
  });

  logger.info(`✅ Created ${2} activity logs`);

  // Summary
  const userCount = await prisma.user.count();
  const workspaceCount = await prisma.workspace.count();
  const giftMapCount = await prisma.giftMap.count();
  const personCount = await prisma.person.count();
  const giftIdeaCount = await prisma.giftIdea.count();
  const edgeCount = await prisma.edge.count();

  logger.info('');
  logger.info('='.repeat(60));
  logger.info('✅ Database seeding complete!');
  logger.info('='.repeat(60));
  logger.info(`👤 Users: ${userCount}`);
  logger.info(`🏢 Workspaces: ${workspaceCount}`);
  logger.info(`🎁 Gift Maps: ${giftMapCount}`);
  logger.info(`👥 People: ${personCount}`);
  logger.info(`💡 Gift Ideas: ${giftIdeaCount}`);
  logger.info(`🔗 Edges: ${edgeCount}`);
  logger.info('');
  logger.info('📧 Test Accounts (password: Demo1234!):');
  logger.info('   • alice@example.com (workspace owner)');
  logger.info('   • bob@example.com (editor/collaborator)');
  logger.info('   • carol@example.com (viewer)');
  logger.info('='.repeat(60));
}

main()
  .catch((error) => {
    logger.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
