const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `          totalNetIncome: convertArr(fin.netIncomeByYear).reduce((a,b)=>a+b,0)`;
const replacement = `          totalNetIncome: convertArr(fin.netIncomeByYear).reduce((a,b)=>a+b,0),
          totalInvestment: convertArr(fin.equityInjection).reduce((a,b)=>a+b,0)`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
