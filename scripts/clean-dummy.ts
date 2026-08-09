import { db } from "../lib/db";
import { events, inventory } from "../lib/db/schema";
import { like } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env.local" });

async function clean() {
  console.log("🧹 Starting dev database cleanup...");

  try {
    // 1. Delete Dummy Events
    const deletedEvents = await db.delete(events).where(like(events.slug, "dummy-%")).returning();
    console.log(`✅ Deleted ${deletedEvents.length} dummy events.`);

    // 2. Delete Dummy Inventory
    const deletedInventory = await db.delete(inventory).where(like(inventory.name, "[DUMMY]%")).returning();
    console.log(`✅ Deleted ${deletedInventory.length} dummy inventory items.`);

    // 3. Delete Dummy Forms (assuming forms table exists and has a title column)
    const { forms } = await import("../lib/db/schema");
    const deletedForms = await db.delete(forms).where(like(forms.title, "[DUMMY]%")).returning();
    console.log(`✅ Deleted ${deletedForms.length} dummy forms.`);

    console.log("🎉 Cleanup complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  }
}

clean();
