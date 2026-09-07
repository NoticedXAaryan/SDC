import { db } from "../lib/db";
import { formTemplates } from "../lib/db/schema";
import { membershipQuestions } from "../lib/constants/membership-questions";
import { eq } from "drizzle-orm";

async function main() {
  const [active] = await db.select({ cycle: formTemplates.cycleName }).from(formTemplates).where(eq(formTemplates.isActive, true)).limit(1);
  if (active) { console.log("An active recruitment round already exists; its questions were preserved."); return; }
  await db.insert(formTemplates).values({ cycleName: "SDC membership " + new Date().getFullYear(), fields: membershipQuestions, isActive: true });
  console.log("Opened the default membership questionnaire.");
}
main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
