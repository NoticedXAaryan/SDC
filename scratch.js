const fs = require('fs');
let code = fs.readFileSync('components/astryx/app-sidenav.tsx', 'utf8');

const regex = /<SideNavItem([\s\S]*?)>([\s\S]*?)<\/SideNavItem>/g;
code = code.replace(regex, (match, props, children) => {
  const label = children.trim();
  if (label && !label.includes('<')) {
    return `<SideNavItem${props} label="${label}" />`;
  }
  return match;
});

fs.writeFileSync('components/astryx/app-sidenav.tsx', code);
