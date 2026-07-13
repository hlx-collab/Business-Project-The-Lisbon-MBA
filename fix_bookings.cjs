const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const getBookingsTotalFn = `
  const getBookingsTotal = (marketCode: 'Portugal' | 'UK', adjustedDerived?: any) => {
    const derived = adjustedDerived ? adjustedDerived : calculateFinancials(markets[marketCode], marketCode);
    const owners = derived.platformMetricsStreams.find((s: any) => s.name === 'Number of owners in the platform');
    const bp = derived.platformMetricsStreams.find((s: any) => s.name === '# of yearly bookings per pet owners');
    let sum = 0;
    for (let i = 0; i < 5; i++) {
      sum += (Number(owners?.amounts?.[i]) || 0) * (Number(bp?.amounts?.[i]) || 0);
    }
    return sum;
  };

`;

code = code.replace(
  `  const sensitivityData = React.useMemo(() => {`,
  getBookingsTotalFn + `  const sensitivityData = React.useMemo(() => {`
);

fs.writeFileSync('src/App.tsx', code);
