const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const injection = `
  useEffect(() => {
    if (activeMarket !== 'Aggregated') return;
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

    let out = "Baseline:\\n";
    out += "OpProfit: " + base.operatingProfit + "\\n";
    out += "NetProfit: " + base.totalNetIncome + "\\n";
    out += "NPV: " + base.npv + "\\n";
    out += "IRR: " + base.irr + "\\n";
    out += "ROI: " + base.roi + "\\n";
    out += "Payback: " + base.paybackPeriod + "\\n\\nImpacts:\\n";
    
    for (const s of scenarios) {
      const res = testScenario(s.mod, s.val, s.wacc || 0);
      out += s.name + "\\n";
      out += "  OpProfit: " + Math.round(res.opProfit) + "\\n";
      out += "  NetProfit: " + Math.round(res.netProfit) + "\\n";
      out += "  NPV: " + Math.round(res.npv) + "\\n";
      out += "  IRR: " + (res.irr * 100).toFixed(2) + "%\\n";
      out += "  ROI: " + (res.roi * 100).toFixed(2) + "%\\n";
      out += "  Payback: " + res.payback.toFixed(2) + "\\n";
    }
    console.log("SIMULATION_RESULTS_START\\n" + out + "SIMULATION_RESULTS_END");
  }, [markets, activeMarket]);
`;

code = code.replace('const updateMarketData = (updater: (prev: MarketData) => MarketData) => {', injection + '\n  const updateMarketData = (updater: (prev: MarketData) => MarketData) => {');

fs.writeFileSync('src/App.tsx', code);
