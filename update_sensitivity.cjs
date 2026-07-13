const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `totals: {
        grossRev: adjusted.totalGrossRevenue,
        netRev: adjusted.totalRevenue,
        cogs: adjusted.totalVariableCosts,
        margin: adjusted.grossMargin,
        fixedCosts: adjusted.fixedCosts,
        opProfit: adjusted.operatingProfit,
        netIncome: adjusted.totalNetIncome
      },`;

const replacement = `totals: {
        grossRev: adjusted.totalGrossRevenue,
        netRev: adjusted.totalRevenue,
        cogs: adjusted.totalVariableCosts,
        margin: adjusted.grossMargin,
        fixedCosts: adjusted.fixedCosts,
        opProfit: adjusted.operatingProfit,
        netIncome: adjusted.totalNetIncome
      },
      metrics: {
        npv: adjusted.npv,
        irr: adjusted.irr,
        roi: adjusted.roi,
        paybackPeriod: adjusted.paybackPeriod,
        discountedPaybackPeriod: adjusted.discountedPaybackPeriod
      },`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
