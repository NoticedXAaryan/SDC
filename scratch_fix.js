const fs = require('fs');
let code = fs.readFileSync('components/astryx/app-sidenav.tsx', 'utf8');

// Fix the corrupted lines
// from: icon={<Home className="w-4 h-4" / label="}
//       isSelected={pathname === "/dashboard"}
//     >
//       Dashboard" />
// to:   icon={<Home className="w-4 h-4" />} label="Dashboard" isSelected={...} />
code = code.replace(/icon=\{<([A-Za-z]+)\s+className="([^"]+)"\s+\/\s+label="\}\s+isSelected=\{([^}]+)\}\s+>\s+([^"]+)"\s+\/>/g, 
  (match, iconName, className, isSelected, labelText) => {
    return `icon={<${iconName} className="${className}" />} \n          label="${labelText.trim()}" \n          isSelected={${isSelected}}\n        />`;
});

fs.writeFileSync('components/astryx/app-sidenav.tsx', code);
