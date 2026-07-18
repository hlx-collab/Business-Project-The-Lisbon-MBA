const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  /formatter: \(val: any\) => \`\$\{val\}%\`/g,
  `formatter: (val: any) => val != null ? \`\${val}%\` : ''`
);
fs.writeFileSync('src/App.tsx', code);
