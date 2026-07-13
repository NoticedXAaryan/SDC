import fs from "fs";
import path from "path";

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

const apiDir = path.join(process.cwd(), "app", "api");
const allFiles = getAllFiles(apiDir).filter(f => f.endsWith("route.ts"));

const results = {
  missingWithApiHandler: [] as string[],
  redundantTryCatch: [] as string[],
  missingAuth: [] as string[],
};

for (const file of allFiles) {
  const content = fs.readFileSync(file, "utf8");
  const relative = path.relative(process.cwd(), file);

  // Check for POST/PATCH/DELETE/PUT without withApiHandler
  if (content.match(/export (async )?function (POST|PATCH|PUT|DELETE)/)) {
    results.missingWithApiHandler.push(relative);
  }

  // Check for withApiHandler + internal try/catch
  if (content.includes("withApiHandler(") && content.includes("try {") && content.includes("return NextResponse.json({ error: \"Internal server error\"")) {
    results.redundantTryCatch.push(relative);
  }

  // Check for missing session/admin
  if (!content.includes("requireSession") && !content.includes("requireRole") && !content.includes("requireAdmin") && !content.includes("auth") && !content.includes("verifySignature")) {
    results.missingAuth.push(relative);
  }
}

console.log(JSON.stringify(results, null, 2));
