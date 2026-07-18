const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /      totalRevenue,\n      totalVariableCosts,/g,
  `      totalRevenue,\n      totalVariableCosts,\n      totalInvestment,\n      totalNetIncome,`
);

code = code.replace(
  /        totalRevenue,\n        totalVariableCosts,/g,
  `        totalRevenue,\n        totalVariableCosts,\n        totalInvestment,\n        totalNetIncome,`
);

code = code.replace(
  /    totalVariableCosts,\n    fixedCosts,/g,
  `    totalVariableCosts,\n    totalInvestment,\n    fixedCosts,`
);

fs.writeFileSync('src/App.tsx', code);
