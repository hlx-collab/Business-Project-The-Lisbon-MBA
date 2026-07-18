const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  /const defRevRowIdx = cfOpRowIdx \+ 25;\s*const accFeeRowIdx = cfOpRowIdx \+ 26;/g,
  `const defRevRowIdx = cfOpRowIdx + 26;
      const accFeeRowIdx = cfOpRowIdx + 27;`
);
fs.writeFileSync('src/App.tsx', code);
