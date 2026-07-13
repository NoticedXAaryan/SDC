// @ts-nocheck
import { Project, SyntaxKind, VariableDeclarationKind } from "ts-morph";

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
});

const sourceFile = project.getSourceFile("lib/db/schema.ts");

if (!sourceFile) {
  console.error("Could not find schema.ts");
  process.exit(1);
}

// Ensure crypto import
const hasCrypto = sourceFile.getImportDeclarations().some(i => i.getModuleSpecifierValue() === "crypto");
if (!hasCrypto) {
  sourceFile.addImportDeclaration({
    defaultImport: "crypto",
    moduleSpecifier: "crypto"
  });
}

// Find all pgTable calls
const declarations = sourceFile.getVariableDeclarations();
const tables = [];

for (const decl of declarations) {
  const init = decl.getInitializer();
  if (init && init.getKind() === SyntaxKind.CallExpression) {
    const callExpr = init;
    if (callExpr.getExpression().getText() === "pgTable") {
      tables.push(decl);
    }
  }
}

for (const table of tables) {
  const callExpr = table.getInitializer();
  const args = callExpr.getArguments();
  if (args.length < 2) continue;
  
  const schemaObj = args[1];
  if (schemaObj.getKind() !== SyntaxKind.ObjectLiteralExpression) continue;
  
  const properties = schemaObj.getProperties();
  
  let hasUpdatedAt = false;
  
  for (const prop of properties) {
    if (prop.getKind() !== SyntaxKind.PropertyAssignment) continue;
    
    const name = prop.getName();
    const init = prop.getInitializer();
    const initText = init ? init.getText() : "";
    
    // DB-01: Add $defaultFn UUID generation to all PKs
    if (name === "id" && initText === 'text("id").primaryKey()') {
      prop.setInitializer('text("id").primaryKey().$defaultFn(() => crypto.randomUUID())');
    }
    
    // DB-04: Remove dangling events.budgetId
    if (table.getName() === "events" && name === "budgetId") {
      prop.remove();
    }
    
    if (name === "updatedAt") {
      hasUpdatedAt = true;
    }
  }
  
  // DB-03: Add deletedAt to user table
  if (table.getName() === "user") {
    const hasDeletedAt = properties.some(p => p.getName() === "deletedAt");
    if (!hasDeletedAt) {
      schemaObj.addPropertyAssignment({
        name: "deletedAt",
        initializer: 'timestamp("deletedAt")'
      });
    }
  }
  
  // DB-06: Add updatedAt to missing tables
  const tablesNeedsUpdatedAt = ['registrations', 'eventSessions', 'pointLogs', 'certificates', 'notifications', 'inventory'];
  if (tablesNeedsUpdatedAt.includes(table.getName()) && !hasUpdatedAt) {
    schemaObj.addPropertyAssignment({
      name: "updatedAt",
      initializer: 'timestamp("updatedAt").$onUpdateFn(() => new Date())' // or similar default depending on DB
    });
  }
  
  // DB-07: Add PK to sessionAttendance
  if (table.getName() === "sessionAttendance") {
    const hasId = properties.some(p => p.getName() === "id");
    if (!hasId) {
      schemaObj.insertPropertyAssignment(0, {
        name: "id",
        initializer: 'text("id").primaryKey().$defaultFn(() => crypto.randomUUID())'
      });
    }
  }
}

// DB-02: Add missing database indexes
// To do this, we need to modify the 3rd argument to pgTable (which is the index/constraints function).
// Or we can just do it manually since it requires careful structure.
// I will do DB-02 manually using replace_file_content or append.

sourceFile.saveSync();
console.log("Schema modifications saved.");
