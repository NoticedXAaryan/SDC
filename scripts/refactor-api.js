const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('route.ts')) results.push(file);
    }
  });
  return results;
}

const routes = walk('app/api');
let count = 0;

routes.forEach(route => {
  let content = fs.readFileSync(route, 'utf-8');
  let changed = false;

  // Add import if needed
  if (!content.includes('withApiHandler')) {
    content = 'import { withApiHandler } from "@/lib/api-wrapper";\n' + content;
  }

  // Find all export async function METHOD(req: NextRequest) { try {
  const regex = /export async function (GET|POST|PATCH|PUT|DELETE)\(req: NextRequest(?:, (.*?))?\) \{\s*try \{([\s\S]*?)\}\s*catch\s*\(.*?\)\s*\{[\s\S]*?\}\s*\}/g;
  
  content = content.replace(regex, (match, method, params, tryBody) => {
    changed = true;
    const args = params ? `req: NextRequest, ${params}` : `req: NextRequest`;
    return `export const ${method} = withApiHandler(async (${args}) => {${tryBody}});`;
  });

  if (changed) {
    fs.writeFileSync(route, content, 'utf-8');
    console.log('Refactored:', route);
    count++;
  }
});

console.log('Total files refactored:', count);
