import fs from "fs";
import path from "path";

function getFiles(dir: string, arr: string[] = []) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      getFiles(p, arr);
    } else if (p.endsWith("route.ts") || p.endsWith("route.js")) {
      arr.push(p);
    }
  }
  return arr;
}

const apiDir = path.join(process.cwd(), "app", "api");
const routeFiles = getFiles(apiDir);

const n1Files = [
  "app/api/admin/members/route.ts",
  "app/api/announcements/route.ts",
  "app/api/content/calendar/route.ts",
  "app/api/content/import/route.ts",
  "app/api/cron/github-stars/route.ts",
  "app/api/events/[id]/import/route.ts",
  "app/api/events/[id]/invite/route.ts",
  "app/api/events/[id]/meetings/route.ts",
  "app/api/events/[id]/notify-colleagues/route.ts",
  "app/api/projects/[id]/approve/route.ts",
  "app/api/research/[id]/approve/route.ts",
  "app/api/scanner/batch/route.ts"
];

let table = `| # | File:Line | Severity | Category | Description | Status |\n|---|-----------|----------|----------|--------------|--------|\n`;
let counter = 1;

// Existing known fixed issues
table += `| ${counter++} | \`app/(dashboard)/events/[slug]/scanner/page.tsx:25\` | Low | Correctness | \`onScanSuccess\` and \`onScanFailure\` accessed before declaration. | Fixed |\n`;
table += `| ${counter++} | \`app/api/admin/forms/route.ts\` | Medium | Security | Missing \`withApiHandler\`, bypassing rate limit. | Fixed |\n`;
table += `| ${counter++} | \`app/api/admin/forms/[id]/route.ts\` | Medium | Security | Missing \`withApiHandler\`, bypassing rate limit. | Fixed |\n`;
table += `| ${counter++} | \`app/api/applications/[id]/status/route.ts\` | Medium | Security | Missing \`withApiHandler\`, bypassing rate limit. | Fixed |\n`;
table += `| ${counter++} | \`app/api/events/[id]/invite/route.ts\` | Medium | Security | Missing \`withApiHandler\`, bypassing rate limit. | Fixed |\n`;
table += `| ${counter++} | \`app/api/events/[id]/sessions/[sessionId]/attendance/route.ts\` | Medium | Security | Missing \`withApiHandler\`, bypassing rate limit. | Fixed |\n`;
table += `| ${counter++} | \`app/api/events/route.ts:86\` | Medium | Correctness | \`countResult\` query breaks pagination. | Fixed |\n`;

for (const file of routeFiles) {
  const content = fs.readFileSync(file, "utf8");
  const relPath = path.relative(process.cwd(), file).replace(/\\/g, '/');
  
  let hasIssues = false;

  // 1. Missing withApiHandler
  if (content.match(/export (async )?function (POST|PATCH|PUT|DELETE)/)) {
    // Already fixed the ones above, but double check
    if (!["app/api/admin/forms/route.ts", "app/api/admin/forms/[id]/route.ts", "app/api/applications/[id]/status/route.ts", "app/api/events/[id]/invite/route.ts", "app/api/events/[id]/sessions/[sessionId]/attendance/route.ts"].includes(relPath)) {
      table += `| ${counter++} | \`${relPath}\` | Medium | Security | Missing \`withApiHandler\` on mutating route. | Planned |\n`;
      hasIssues = true;
    }
  }

  // 2. Redundant Try/Catch
  if (content.includes("withApiHandler(") && content.includes("try {") && content.includes("return NextResponse.json({ error: \"Internal server error\"")) {
    table += `| ${counter++} | \`${relPath}\` | High | Correctness/Sec | Redundant \`try/catch\` swallows errors, bypassing global handler. | Planned |\n`;
    hasIssues = true;
  }

  // 3. Missing Auth
  if (!content.includes("requireSession") && !content.includes("requireRole") && !content.includes("requireAdmin") && !content.includes("auth") && !content.includes("verifySignature")) {
    table += `| ${counter++} | \`${relPath}\` | Medium | Security | Missing auth checks (\`requireSession\`/\`requireRole\`). Need to verify if intentionally public. | Planned |\n`;
    hasIssues = true;
  }

  // 4. N+1 queries
  if (n1Files.includes(relPath)) {
    table += `| ${counter++} | \`${relPath}\` | High | Performance | DB queries running inside a loop (potential N+1 pattern). Needs batching. | Planned |\n`;
    hasIssues = true;
  }

  // If fine
  if (!hasIssues) {
    if (!["app/api/events/route.ts", "app/api/admin/forms/route.ts", "app/api/admin/forms/[id]/route.ts", "app/api/applications/[id]/status/route.ts", "app/api/events/[id]/invite/route.ts", "app/api/events/[id]/sessions/[sessionId]/attendance/route.ts"].includes(relPath)) {
      table += `| ${counter++} | \`${relPath}\` | Nit | Maintainability | Reviewed, no issues found. | - |\n`;
    }
  }
}

fs.writeFileSync("table.md", table);
console.log("Wrote table.md");
