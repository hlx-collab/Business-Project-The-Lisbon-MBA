const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target3 = `  const platformChartData = years.map(y => {
    const getVal = (name: string) => {
      const stream = derivedPlatformMetricsStreams.find(s => s.name === name);
      return Number(stream?.amounts?.[y]) || 0;
    };
    return {
      name: \`Year \${y + 1}\`,
      'New Providers': getVal('New providers added'),
      'Total Providers': getVal('Number of providers in the platform'),
      'Provider Churn': getVal('Provider churn rate (%)'),
      'New Owners': getVal('New owners added'),
      'Total Owners': getVal('Number of owners in the platform'),
      'Owner Churn': getVal('Owner churn rate (%)'),
      'Number of Bookings': getVal('Number of owners in the platform') * getVal('# of yearly bookings per pet owners'),
    };
  });`;

const replace3 = `  const platformChartData = React.useMemo(() => years.map(y => {
    const getVal = (name: string) => {
      const stream = derivedPlatformMetricsStreams.find(s => s.name === name);
      return Number(stream?.amounts?.[y]) || 0;
    };
    return {
      name: \`Year \${y + 1}\`,
      'New Providers': getVal('New providers added'),
      'Total Providers': getVal('Number of providers in the platform'),
      'Provider Churn': getVal('Provider churn rate (%)'),
      'New Owners': getVal('New owners added'),
      'Total Owners': getVal('Number of owners in the platform'),
      'Owner Churn': getVal('Owner churn rate (%)'),
      'Number of Bookings': getVal('Number of owners in the platform') * getVal('# of yearly bookings per pet owners'),
    };
  }), [derivedPlatformMetricsStreams]);`;

code = code.replace(target3, replace3);
fs.writeFileSync('src/App.tsx', code);
