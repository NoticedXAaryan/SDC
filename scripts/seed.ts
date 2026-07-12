import { faker } from '@faker-js/faker';
import { db } from '../lib/db';
import { user, events, registrations, pointLogs } from '../lib/db/schema';
import { nanoid } from 'nanoid';

async function seed() {
  console.log("Seeding started...");

  // Generate 150 users
  const userIds = [];
  for (let i = 0; i < 150; i++) {
    const id = nanoid();
    userIds.push(id);
    await db.insert(user).values({
      id,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      emailVerified: true,
      role: 'member',
      points: faker.number.int({ min: 0, max: 1000 }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  console.log("150 users seeded.");

  // Seed events
  const eventId = nanoid();
  await db.insert(events).values({
    id: eventId,
    title: faker.company.catchPhrase(),
    slug: faker.lorem.slug(),
    description: faker.lorem.paragraph(),
    type: 'workshop',
    status: 'published',
    visibility: 'public',
    capacity: 100,
    startsAt: faker.date.future(),
    endsAt: faker.date.future(),
    createdBy: userIds[0],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log("Event seeded.");

  // Seed registrations
  for (let i = 0; i < 50; i++) {
    await db.insert(registrations).values({
      id: nanoid(),
      eventId,
      userId: userIds[i],
      status: 'confirmed',
      passCode: nanoid(),
      createdAt: new Date(),
    });
  }
  console.log("50 registrations seeded.");

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seeding failed", err);
  process.exit(1);
});
