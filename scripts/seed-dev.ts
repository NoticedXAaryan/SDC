import { db } from "../lib/db";
import { user, events, inventory, budgets } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { config } from "dotenv";

config({ path: ".env.local" });

async function seed() {
  console.log("🌱 Starting dev database seed...");

  // 1. Ensure admin exists
  const [adminUser] = await db.select().from(user).where(eq(user.email, "admin@club.local")).limit(1);
  if (!adminUser) {
    console.log("⚠️ Admin user not found. Please run seed-admin.ts first.");
    process.exit(1);
  }

  // 2. Seed dummy events
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 14);

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 30);

  const dummyEvents = [
    {
      id: crypto.randomUUID(),
      title: "Intro to Open Source",
      slug: "intro-to-os-2026",
      type: "workshop" as const,
      domain: "Technical",
      description: "Learn how to contribute to open source projects.",
      location: "Room 304, Tech Block",
      capacity: 60,
      startsAt: futureDate,
      endsAt: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000), // +2 hours
      visibility: "public" as const,
      status: "published" as const,
      createdBy: adminUser.id,
      isPaid: false,
    },
    {
      id: crypto.randomUUID(),
      title: "Hack The Future",
      slug: "hack-the-future",
      type: "hackathon" as const,
      domain: "Technical",
      description: "48-hour hackathon to build the next big thing.",
      location: "Main Auditorium",
      capacity: 200,
      startsAt: pastDate,
      endsAt: new Date(pastDate.getTime() + 48 * 60 * 60 * 1000), // +48 hours
      visibility: "public" as const,
      status: "completed" as const,
      createdBy: adminUser.id,
      isPaid: true,
      price: "150",
    }
  ];

  for (const ev of dummyEvents) {
    const [existing] = await db.select().from(events).where(eq(events.slug, ev.slug)).limit(1);
    if (!existing) {
      await db.insert(events).values(ev);
      console.log(`✅ Created event: ${ev.title}`);
      
      // Create a budget for this event
      await db.insert(budgets).values({
        id: crypto.randomUUID(),
        eventId: ev.id,
        allocated: "5000",
      });
      console.log(`✅ Created budget for: ${ev.title}`);
    } else {
      console.log(`ℹ️ Event already exists: ${ev.title}`);
    }
  }

  // 3. Seed Inventory
  const dummyInventory = [
    { name: "Arduino Uno", qtyTotal: 20 },
    { name: "Raspberry Pi 4", qtyTotal: 10 },
    { name: "Club T-Shirt (M)", qtyTotal: 50 },
    { name: "Club Banner", qtyTotal: 2 },
  ];

  for (const item of dummyInventory) {
    const [existing] = await db.select().from(inventory).where(eq(inventory.name, item.name)).limit(1);
    if (!existing) {
      await db.insert(inventory).values({
        id: crypto.randomUUID(),
        name: item.name,
        qtyTotal: item.qtyTotal,
        qtyAvailable: item.qtyTotal,
      });
      console.log(`✅ Created inventory item: ${item.name}`);
    }
  }

  console.log("🎉 Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
