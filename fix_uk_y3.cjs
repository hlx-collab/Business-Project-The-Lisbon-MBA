const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const fillEmpty = \(streamsUK: FinancialStream\[\], streamsPT: FinancialStream\[\]\) => \{[\s\S]*?uk\.chargeBookingFees = uk\.chargeBookingFees\.map\(\(v: any, i: number\) => uk\.platformMetricsStreams\.some\(\(s: any\) => s\.name === 'Avg price per booking' && s\.amounts\[i\] === ''\) \? pt\.chargeBookingFees\[i\] : v\);/m;

const replacement = `const fillEmptyWithY3 = (streams: FinancialStream[]) => {
      return streams.map(s => {
        const y3Val = s.amounts[2];
        return {
          ...s,
          amounts: s.amounts.map(v => (v === '' || v === undefined) ? (y3Val === '' ? 0 : y3Val) : v)
        };
      });
    };
    
    uk.platformMetricsStreams = fillEmptyWithY3(uk.platformMetricsStreams);
    uk.revenueStreams = fillEmptyWithY3(uk.revenueStreams);
    uk.variableCostsStreams = fillEmptyWithY3(uk.variableCostsStreams);
    uk.fixedCostsStreams = fillEmptyWithY3(uk.fixedCostsStreams);
    // Note: boolean arrays chargeSubscription and chargeBookingFees don't have "empty" states, they are false by default.`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed UK Y3 fallback');
