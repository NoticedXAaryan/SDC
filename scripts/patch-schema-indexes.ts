// @ts-nocheck
import { Project, SyntaxKind } from "ts-morph";

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
});

const sourceFile = project.getSourceFile("lib/db/schema.ts");

const indexMap = {
  events: [
    { name: "events_status_idx", col: "status" },
    { name: "events_starts_at_idx", col: "startsAt" },
    { name: "events_created_by_idx", col: "createdBy" }
  ],
  notifications: [
    { name: "notifications_user_id_idx", col: "userId" },
    { name: "notifications_read_idx", col: "read" }
  ],
  tasks: [
    { name: "tasks_event_id_idx", col: "eventId" }
  ],
  member: [
    { name: "member_user_id_idx", col: "userId" }
  ],
  account: [
    { name: "account_user_id_idx", col: "userId" }
  ],
  session: [
    { name: "session_user_id_idx", col: "userId" }
  ],
  certificates: [
    { name: "certificates_user_id_idx", col: "userId" }
  ]
};

if (!sourceFile) throw new Error("Could not find schema file");
const declarations = sourceFile.getVariableDeclarations();

for (const decl of declarations) {
  const init = decl.getInitializer();
  if (init && init.getKind() === SyntaxKind.CallExpression) {
    const callExpr = init;
    if (callExpr.getExpression().getText() === "pgTable") {
      const tableName = decl.getName();
      if (indexMap[tableName]) {
        const args = callExpr.getArguments();
        
        let callback = null;
        if (args.length === 3) {
          callback = args[2];
        } else if (args.length === 2) {
          // Add 3rd argument
          callback = callExpr.addArgument(`(table) => []`);
        }
        
        if (callback && callback.getKind() === SyntaxKind.ArrowFunction) {
          const body = callback.getBody();
          if (body.getKind() === SyntaxKind.ArrayLiteralExpression) {
             for (const idx of indexMap[tableName]) {
                body.addElement(`index("${idx.name}").on(table.${idx.col})`);
             }
          }
        }
      }
    }
  }
}

sourceFile.saveSync();
console.log("Indexes added.");
