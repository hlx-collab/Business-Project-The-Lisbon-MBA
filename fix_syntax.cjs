const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /const getBookingsTotal = \(marketCode: 'Portugal' \| 'UK', adjustedDerived\?: any\) => \{\n\| 'UK', adjustedDerived\?: any\) => \{/,
  `const getBookingsTotal = (marketCode: 'Portugal' | 'UK', adjustedDerived?: any) => {`
);

fs.writeFileSync('src/App.tsx', code);
