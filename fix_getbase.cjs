const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /  const getBasePlatformMetric = \(name: string, yearIdx: number = 0\) => \{[\s\S]*?return isNaN\(val\) \? 0 : val;\n  \};/m;

const replacement = `  const getBasePlatformMetric = (name: string, yearIdx?: number) => {
    let yIdx = yearIdx;
    if (yIdx === undefined) {
      yIdx = activeMarket === 'UK' ? 2 : 0;
    }
    const stream = baseFinancialsNoMods.platformMetricsStreams.find(s => s.name === name);
    const val = Number(stream?.amounts?.[yIdx]);
    return isNaN(val) ? 0 : val;
  };`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed getBasePlatformMetric');
