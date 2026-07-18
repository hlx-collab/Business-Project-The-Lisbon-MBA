const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `          shareCapital: convertArr(fin.shareCapital),`;
const replacement = `          equityInjection: convertArr(fin.equityInjection),
          shareCapital: convertArr(fin.shareCapital),`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
