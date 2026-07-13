const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /function computeAllFinancials\(markets: any, activeMarket: string, mods\?: typeof sensitivityMods\) \{/g;

const replacement = `function computeAllFinancials(markets: any, activeMarket: string, mods?: typeof sensitivityMods) {
    const pt = markets.Portugal;
    let uk = { ...markets.UK };
    
    const fillEmpty = (streamsUK: FinancialStream[], streamsPT: FinancialStream[]) => {
      return streamsUK.map(sUK => {
        const sPT = streamsPT.find(s => s.name === sUK.name);
        if (!sPT) return sUK;
        return {
          ...sUK,
          amounts: sUK.amounts.map((v, i) => v === '' ? sPT.amounts[i] : v)
        };
      });
    };
    
    uk.platformMetricsStreams = fillEmpty(uk.platformMetricsStreams, pt.platformMetricsStreams);
    uk.revenueStreams = fillEmpty(uk.revenueStreams, pt.revenueStreams);
    uk.variableCostsStreams = fillEmpty(uk.variableCostsStreams, pt.variableCostsStreams);
    uk.fixedCostsStreams = fillEmpty(uk.fixedCostsStreams, pt.fixedCostsStreams);
    uk.chargeSubscription = uk.chargeSubscription.map((v: any, i: number) => uk.platformMetricsStreams.some((s: any) => s.name === 'Monthly Subscription fee' && s.amounts[i] === '') ? pt.chargeSubscription[i] : v);
    uk.chargeBookingFees = uk.chargeBookingFees.map((v: any, i: number) => uk.platformMetricsStreams.some((s: any) => s.name === 'Avg price per booking' && s.amounts[i] === '') ? pt.chargeBookingFees[i] : v);
    
    const marketsFilled = { Portugal: pt, UK: uk, Aggregated: undefined };
`;

code = code.replace(regex, replacement);

// Also replace usages of `markets` with `marketsFilled` inside `computeAllFinancials`
code = code.replace(/const pt = markets.Portugal;\s*const uk = markets.UK;/g, `const pt = marketsFilled.Portugal;\n      const uk = marketsFilled.UK;`);
code = code.replace(/let rawFin = \{ \.\.\.markets\[activeMarket\], \.\.\.calculateFinancials\(markets\[activeMarket\], activeMarket as 'Portugal' \| 'UK', mods\) \};/g, `let rawFin = { ...marketsFilled[activeMarket], ...calculateFinancials(marketsFilled[activeMarket], activeMarket as 'Portugal' | 'UK', mods) };`);
code = code.replace(/const currentMarketData = markets\[activeMarket\];/g, `const currentMarketData = marketsFilled[activeMarket as 'Portugal' | 'UK'];`);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed UK fallback');
