const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Find start of defaultMarketData
const startIdx = code.indexOf('const defaultMarketData');
// Find start of currentMarketData = marketsFilled
const endIdx = code.indexOf("const currentMarketData = marketsFilled[activeMarket as 'Portugal' | 'UK'];");

let extracted = code.substring(startIdx, endIdx);
// Extract constants
const top = code.substring(0, 3000);
const cStart = top.indexOf('const DEFAULT_PLATFORM_METRICS');
const cEnd = top.indexOf('const RangeWithButtons');
const constants = top.substring(cStart, cEnd);

const script = `
interface FinancialStream {
  id: string;
  name: string;
  amounts: (number | '')[];
  isPermanent?: boolean;
  isCalculated?: boolean;
}

type Market = 'Portugal' | 'UK' | 'Aggregated';

interface MarketData {
  platformMetricsStreams: FinancialStream[];
  revenueStreams: FinancialStream[];
  variableCostsStreams: FinancialStream[];
  fixedCostsStreams: FinancialStream[];
  chargeSubscription: boolean[];
  chargeBookingFees: boolean[];
}

const sensitivityMods = {
  Portugal: { newOwners: 0, newProviders: 0, ownerChurn: [0,0,0,0,0], providerChurn: [0,0,0,0,0], avgPricePerBooking: 0, commission: 0, subscriptionFee: 0, yearlyBookings: 0, itRnD: 0, marketing: 0 },
  UK: { newOwners: 0, newProviders: 0, ownerChurn: [0,0,0,0,0], providerChurn: [0,0,0,0,0], avgPricePerBooking: 0, commission: 0, subscriptionFee: 0, yearlyBookings: 0, itRnD: 0, marketing: 0 }
};

const years = [0, 1, 2, 3, 4];

${constants}
${extracted}

const markets = {
  Portugal: defaultMarketData('Portugal'),
  UK: defaultMarketData('UK')
};

const base = computeAllFinancials(markets, 'Aggregated', undefined, undefined, 0);

function testScenario(modName, modValue, waccMod = 0) {
  const mods = {
    newOwners: 0,
    newProviders: 0,
    ownerChurn: [0, 0, 0, 0, 0],
    providerChurn: [0, 0, 0, 0, 0],
    avgPricePerBooking: 0,
    commission: 0,
    subscriptionFee: 0,
    yearlyBookings: 0,
    itRnD: 0,
    marketing: 0
  };
  
  if (modName !== 'wacc') {
    if (modName === 'ownerChurn' || modName === 'providerChurn') {
      mods[modName] = [modValue, modValue, modValue, modValue, modValue];
    } else {
      mods[modName] = modValue;
    }
  }

  const result = computeAllFinancials(markets, 'Aggregated', mods, mods, waccMod);
  return {
    opProfit: result.operatingProfit - base.operatingProfit,
    netProfit: result.totalNetIncome - base.totalNetIncome,
    npv: result.npv - base.npv,
    irr: (result.irr || 0) - (base.irr || 0),
    roi: (result.roi || 0) - (base.roi || 0),
    payback: (result.paybackPeriod || 0) - (base.paybackPeriod || 0),
  };
}

const scenarios = [
  { name: 'New Owners +10%', mod: 'newOwners', val: 10 },
  { name: 'New Providers +10%', mod: 'newProviders', val: 10 },
  { name: 'Owner Churn +5%', mod: 'ownerChurn', val: 5 },
  { name: 'Provider Churn +5%', mod: 'providerChurn', val: 5 },
  { name: 'Avg Price +5 (abs)', mod: 'avgPricePerBooking', val: 5 },
  { name: 'Commission +2% (abs)', mod: 'commission', val: 2 },
  { name: 'Subscription Fee +5 (abs)', mod: 'subscriptionFee', val: 5 },
  { name: 'Yearly Bookings +1 (abs)', mod: 'yearlyBookings', val: 1 },
  { name: 'IT R&D +10%', mod: 'itRnD', val: 10 },
  { name: 'Marketing +10%', mod: 'marketing', val: 10 },
  { name: 'WACC +2%', mod: 'wacc', val: 0, wacc: 2 },
];

console.log("Baseline:");
console.log("OpProfit:", base.operatingProfit);
console.log("NetProfit:", base.totalNetIncome);
console.log("NPV:", base.npv);
console.log("IRR:", base.irr);
console.log("ROI:", base.roi);
console.log("Payback:", base.paybackPeriod);

console.log("\\nImpacts:");
for (const s of scenarios) {
  const res = testScenario(s.mod, s.val, s.wacc || 0);
  console.log(s.name);
  console.log("  OpProfit: " + Math.round(res.opProfit));
  console.log("  NetProfit: " + Math.round(res.netProfit));
  console.log("  NPV: " + Math.round(res.npv));
  console.log("  IRR: " + (res.irr * 100).toFixed(2) + "%");
  console.log("  ROI: " + (res.roi * 100).toFixed(2) + "%");
  console.log("  Payback: " + res.payback.toFixed(2));
}

`;

fs.writeFileSync('tester_new.ts', script);
