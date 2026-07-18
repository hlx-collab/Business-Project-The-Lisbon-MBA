const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `  const chartData = years.map(y => ({
    name: \`Year \${y + 1}\`,
    'Gross Revenue': totalGrossRevenueByYear[y],
    'Net Revenue': totalRevenueByYear[y],
    'Total Variable Costs': totalVarCostsByYear[y],
    'Total Fixed Costs': totalFixedCostsByYear[y],
    'EBITDA': opProfitByYear[y]
  }));`;

const replace1 = `  const chartData = React.useMemo(() => years.map(y => ({
    name: \`Year \${y + 1}\`,
    'Gross Revenue': totalGrossRevenueByYear[y],
    'Net Revenue': totalRevenueByYear[y],
    'Total Variable Costs': totalVarCostsByYear[y],
    'Total Fixed Costs': totalFixedCostsByYear[y],
    'EBITDA': opProfitByYear[y]
  })), [totalGrossRevenueByYear, totalRevenueByYear, totalVarCostsByYear, totalFixedCostsByYear, opProfitByYear]);`;

const target2 = `  const viabilityChartData = years.map(y => ({
    name: \`Year \${y + 1}\`,
    'Cash from Operations': cashFromOp[y],
    'Net Income': netIncomeByYear[y],
    'Cumulative Cash Balance': cashBalanceEnd[y]
  }));`;

const replace2 = `  const viabilityChartData = React.useMemo(() => years.map(y => ({
    name: \`Year \${y + 1}\`,
    'Cash from Operations': cashFromOp[y],
    'Net Income': netIncomeByYear[y],
    'Cumulative Cash Balance': cashBalanceEnd[y]
  })), [cashFromOp, netIncomeByYear, cashBalanceEnd]);`;

code = code.replace(target1, replace1);
code = code.replace(target2, replace2);
fs.writeFileSync('src/App.tsx', code);
