const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  `const colLetter = getColLetter(2 + y);
                  rowData.push({ formula: \`'Sensitivity Analysis'!\${colLetter}\${cell}/100\` });`,
  `const colLetter = getColLetter(1 + y);
                  rowData.push({ formula: \`'Sensitivity Analysis'!\${colLetter}\${cell}/100\` });`
);
fs.writeFileSync('src/App.tsx', code);
