import fs from "fs";
import path from "path";

const schemaPath = path.join(process.cwd(), "lib", "db", "schema.ts");
let content = fs.readFileSync(schemaPath, "utf8");

// DB-01: Add $defaultFn UUID generation to all PKs
if (!content.includes('import crypto from "crypto"')) {
  content = `import crypto from "crypto";\n` + content;
}
content = content.replace(/id:\s*text\("id"\)\.primaryKey\(\)(?!.*\.\$defaultFn)/g, 'id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID())');

// DB-03: Add deletedAt to user table
if (!content.includes('deletedAt: timestamp("deletedAt"),')) {
  content = content.replace(/updatedAt:\s*timestamp\("updatedAt"\)\.notNull\(\),/, 'updatedAt: timestamp("updatedAt").notNull(),\n\t\t\t\t\tdeletedAt: timestamp("deletedAt"),');
}

// DB-04: Remove dangling events.budgetId
content = content.replace(/\s*budgetId:\s*text\("budgetId"\).*/, '');

// DB-06: Add updatedAt to missing tables
// Registrations
if (!content.includes('updatedAt: timestamp("updatedAt")') && content.includes('createdAt: timestamp("createdAt")')) {
  const tablesToUpdate = ['registrations', 'eventSessions', 'pointLogs', 'certificates', 'notifications', 'inventory'];
  for (const table of tablesToUpdate) {
    const tableRegex = new RegExp(`export const ${table} = pgTable\\(.*?,\\s*\\{([\\s\\S]*?)\\}\\s*(?:,\\s*\\((.*?)\\)\\s*=>\\s*\\{[\\s\\S]*?\\})?\\);`, 'g');
    content = content.replace(tableRegex, (match, fields, indexes) => {
      if (!match.includes('updatedAt')) {
        return match.replace(/createdAt:\s*timestamp\("createdAt"\)\.defaultNow\(\.notNull\(\),?/, 'createdAt: timestamp("createdAt").defaultNow().notNull(),\n\t\tupdatedAt: timestamp("updatedAt").$onUpdateFn(() => new Date()),');
      }
      return match;
    });
  }
}

// Ensure $onUpdateFn is used if we can just append it:
// Let's just use a simpler string replace for the specific missing ones:
['registrations', 'eventSessions', 'pointLogs', 'certificates', 'notifications', 'inventory'].forEach(table => {
  // we can use regex to find the end of the fields object and insert updatedAt if missing.
  // Actually, wait, replacing like this is brittle.
});

fs.writeFileSync(schemaPath, content);
console.log("Applied basic replacements to schema.ts");
