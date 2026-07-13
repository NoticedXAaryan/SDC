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
      if (file.endsWith('route.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, '../app/api'));

let modifiedFiles = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let hasChanges = false;
  
  // Need to import withApiHandler
  if (!content.includes('withApiHandler')) {
    const importStatement = `import { withApiHandler } from "@/lib/api-wrapper";\n`;
    // Find last import
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLine = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, endOfLine + 1) + importStatement + content.slice(endOfLine + 1);
    } else {
      content = importStatement + content;
    }
    
    // Replace export async function POST|PUT|PATCH|DELETE with wrapper
    const regex = /export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\s*\(([^)]*)\)\s*\{/g;
    
    content = content.replace(regex, (match, method, args) => {
      hasChanges = true;
      return `export const ${method} = withApiHandler(async (${args}) => {`;
    });
    
    // The previous regex opens the block but we need to close the `)` for withApiHandler.
    // Finding the matching closing brace for each function is tricky with regex. 
    // Wait, replacing with regex will break if we don't close the `)`.
  }
}
