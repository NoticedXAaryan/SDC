import { Project, SyntaxKind } from "ts-morph";

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
});

const sourceFiles = project.getSourceFiles("app/api/**/route.ts");

let modified = 0;

for (const sourceFile of sourceFiles) {
  let hasChanges = false;
  
  // Find exported async functions named POST, PUT, PATCH, DELETE
  const functions = sourceFile.getFunctions().filter(f => {
    return f.isExported() && 
           f.isAsync() && 
           ["POST", "PUT", "PATCH", "DELETE"].includes(f.getName() || "");
  });

  if (functions.length === 0) continue;

  // Add import if needed
  const imports = sourceFile.getImportDeclarations();
  const hasWrapperImport = imports.some(i => i.getModuleSpecifierValue() === "@/lib/api-wrapper");
  
  if (!hasWrapperImport) {
    sourceFile.addImportDeclaration({
      namedImports: ["withApiHandler", "AuthorizationError", "ValidationError"],
      moduleSpecifier: "@/lib/api-wrapper"
    });
    hasChanges = true;
  }

  // Convert each function
  for (const func of functions) {
    const name = func.getName()!;
    const parameters = func.getParameters().map(p => p.getText()).join(", ");
    const returnType = func.getReturnTypeNode() ? `: ${func.getReturnTypeNode()!.getText()}` : "";
    const body = func.getBodyText() || "";
    
    // Create new variable declaration
    const newStatement = `export const ${name} = withApiHandler(async (${parameters})${returnType} => {\n${body}\n});`;
    
    func.replaceWithText(newStatement);
    hasChanges = true;
  }

  if (hasChanges) {
    sourceFile.saveSync();
    modified++;
    console.log(`Updated ${sourceFile.getFilePath()}`);
  }
}

console.log(`\nModified ${modified} files.`);
