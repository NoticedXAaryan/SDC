import * as fs from 'fs';
import * as path from 'path';

const dirs = [
  path.join(process.cwd(), 'app', '(dashboard)'),
  path.join(process.cwd(), 'components'),
  path.join(process.cwd(), 'app', 'error.tsx'),
  path.join(process.cwd(), 'app', 'global-error.tsx'),
];

const results: Record<string, { shadcn: boolean; astryx: boolean; uiComponents: string[] }> = {};

function walk(dir: string) {
  if (!fs.existsSync(dir)) return;
  const stat = fs.statSync(dir);
  if (stat.isFile()) {
    if (dir.endsWith('.tsx') || dir.endsWith('.ts')) {
      const content = fs.readFileSync(dir, 'utf-8');
      const usesShadcn = content.includes('@/components/ui/');
      const usesAstryx = content.includes('@astryxdesign/core');
      
      if (usesShadcn || usesAstryx) {
        const relativePath = path.relative(process.cwd(), dir);
        
        // Extract component names for shadcn
        const shadcnRegex = /import\s+{([^}]+)}\s+from\s+['"]@\/components\/ui\/[^'"]+['"]/g;
        let match;
        const uiComponents = [];
        while ((match = shadcnRegex.exec(content)) !== null) {
          const components = match[1].split(',').map(s => s.trim());
          uiComponents.push(...components);
        }
        
        results[relativePath] = { shadcn: usesShadcn, astryx: usesAstryx, uiComponents };
      }
    }
  } else if (stat.isDirectory()) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      walk(path.join(dir, file));
    }
  }
}

for (const dir of dirs) {
  walk(dir);
}

let md = `# UI Component Audit\n\n`;
md += `| File | Astryx? | Shadcn? | Shadcn Components to Migrate |\n`;
md += `|---|---|---|---|\n`;

for (const [file, data] of Object.entries(results).sort()) {
  const shadcnComponents = data.uiComponents.length > 0 ? data.uiComponents.join(', ') : (data.shadcn ? 'Yes (Unknown)' : 'None');
  md += `| ${file} | ${data.astryx ? '✅' : '❌'} | ${data.shadcn ? '⚠️' : '❌'} | ${shadcnComponents} |\n`;
}

if (!fs.existsSync(path.join(process.cwd(), 'docs', 'ai'))) {
    fs.mkdirSync(path.join(process.cwd(), 'docs', 'ai'), { recursive: true });
}

fs.writeFileSync(path.join(process.cwd(), 'docs', 'ai', 'component-audit.md'), md);
console.log('Audit complete: docs/ai/component-audit.md created.');
