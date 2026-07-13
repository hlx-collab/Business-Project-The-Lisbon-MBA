const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Initial State
code = code.replace(
  `  const [sensitivityMods, setSensitivityMods] = useState({
    newOwners: 0,
    newProviders: 0,
    ownerChurn: 0,
    providerChurn: 0,
    wacc: 0,
    avgPricePerBooking: 0,
    commission: 0,
    subscriptionFee: 0,
    yearlyBookings: 0,
    itRnD: 0,
    marketing: 0
  });`,
  `  const [sensitivityMods, setSensitivityMods] = useState({
    newOwners: 0,
    newProviders: 0,
    ownerChurn: [0, 0, 0, 0, 0],
    providerChurn: [0, 0, 0, 0, 0],
    wacc: 0,
    avgPricePerBooking: 0,
    commission: 0,
    subscriptionFee: 0,
    yearlyBookings: 0,
    itRnD: 0,
    marketing: 0
  });`
);

// 2. Base Financials Memo and applyMod update
code = code.replace(
  `  const calculateFinancials = (data: MarketData, marketName: 'Portugal' | 'UK', mods?: typeof sensitivityMods) => {
    let { platformMetricsStreams, revenueStreams, variableCostsStreams, fixedCostsStreams, chargeSubscription, chargeBookingFees } = data;
    if (mods) {
      const applyMod = (streams: FinancialStream[], nameToMatch: string, modValue: number) => {
        return streams.map(s => {
          if (s.name === nameToMatch) {
            return {
              ...s,
              amounts: s.amounts.map(v => {
                const num = Number(v);
                if (isNaN(num)) return v;
                return num * (1 + modValue / 100);
              })
            };
          }
          return s;
        });
      };`,
  `  const baseFinancialsNoMods = React.useMemo(() => computeAllFinancials(markets, activeMarket), [markets, activeMarket]);
  
  const getBasePlatformMetric = (name: string, yearIdx: number = 0) => {
    const stream = baseFinancialsNoMods.platformMetricsStreams.find(s => s.name === name);
    return Number(stream?.amounts?.[yearIdx]) || 0;
  };

  const calculateFinancials = (data: MarketData, marketName: 'Portugal' | 'UK', mods?: typeof sensitivityMods) => {
    let { platformMetricsStreams, revenueStreams, variableCostsStreams, fixedCostsStreams, chargeSubscription, chargeBookingFees } = data;
    if (mods) {
      const applyMod = (streams: FinancialStream[], nameToMatch: string, modValue: number | number[], type: 'relative' | 'absolute' | 'absoluteArray' = 'relative') => {
        return streams.map(s => {
          if (s.name === nameToMatch) {
            return {
              ...s,
              amounts: s.amounts.map((v, i) => {
                const num = Number(v);
                if (isNaN(num)) return v;
                if (type === 'absoluteArray' && Array.isArray(modValue)) {
                  return num + (modValue[i] || 0);
                } else if (type === 'absolute' && typeof modValue === 'number') {
                  return num + modValue;
                }
                return num * (1 + (modValue as number) / 100);
              })
            };
          }
          return s;
        });
      };`
);

// 3. update applyMod calls
code = code.replace(
  `      platformMetricsStreams = applyMod(platformMetricsStreams, 'New owners added', mods.newOwners);
      platformMetricsStreams = applyMod(platformMetricsStreams, 'New providers added', mods.newProviders);
      platformMetricsStreams = applyMod(platformMetricsStreams, 'Owner churn rate (%)', mods.ownerChurn);
      platformMetricsStreams = applyMod(platformMetricsStreams, 'Provider churn rate (%)', mods.providerChurn);
      platformMetricsStreams = applyMod(platformMetricsStreams, 'Avg price per booking', mods.avgPricePerBooking);
      platformMetricsStreams = applyMod(platformMetricsStreams, '% of bookings commission', mods.commission);
      platformMetricsStreams = applyMod(platformMetricsStreams, 'Monthly Subscription fee', mods.subscriptionFee);
      platformMetricsStreams = applyMod(platformMetricsStreams, '# of yearly bookings per pet owners', mods.yearlyBookings);
      fixedCostsStreams = applyMod(fixedCostsStreams, 'IT R&D and Support', mods.itRnD);
      fixedCostsStreams = applyMod(fixedCostsStreams, 'Advertisement & Promotion', mods.marketing);`,
  `      platformMetricsStreams = applyMod(platformMetricsStreams, 'New owners added', mods.newOwners, 'relative');
      platformMetricsStreams = applyMod(platformMetricsStreams, 'New providers added', mods.newProviders, 'relative');
      platformMetricsStreams = applyMod(platformMetricsStreams, 'Owner churn rate (%)', mods.ownerChurn, 'absoluteArray');
      platformMetricsStreams = applyMod(platformMetricsStreams, 'Provider churn rate (%)', mods.providerChurn, 'absoluteArray');
      platformMetricsStreams = applyMod(platformMetricsStreams, 'Avg price per booking', mods.avgPricePerBooking, 'absolute');
      platformMetricsStreams = applyMod(platformMetricsStreams, '% of bookings commission', mods.commission, 'absolute');
      platformMetricsStreams = applyMod(platformMetricsStreams, 'Monthly Subscription fee', mods.subscriptionFee, 'absolute');
      platformMetricsStreams = applyMod(platformMetricsStreams, '# of yearly bookings per pet owners', mods.yearlyBookings, 'absolute');
      fixedCostsStreams = applyMod(fixedCostsStreams, 'IT R&D and Support', mods.itRnD, 'relative');
      fixedCostsStreams = applyMod(fixedCostsStreams, 'Advertisement & Promotion', mods.marketing, 'relative');`
);

fs.writeFileSync('src/App.tsx', code);
