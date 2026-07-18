const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// For individual market
code = code.replace(
  /const roi = totalInvestment > 0 \? totalNetIncome \/ totalInvestment : 0;/g,
  `const roi = totalInvestment > 0 ? ((totalNetIncome / 5) / totalInvestment) : 0;`
);

fs.writeFileSync('src/App.tsx', code);
