const fs = require('fs');
const paths = [
  'app/(dashboard)/admin/projects',
  'app/(dashboard)/finance/expenses',
  'app/(dashboard)/inventory',
  'app/(dashboard)/applications',
  'app/(dashboard)/admin/audit',
  'app/(dashboard)/admin/finance',
  'app/(dashboard)/admin/inventory'
];

paths.forEach(p => {
  fs.mkdirSync(p, { recursive: true });
  fs.writeFileSync(p + '/page.tsx', 'export default function Page() { return <div className="p-8 text-xl font-bold">Coming Soon</div>; }');
});
console.log("Done");
