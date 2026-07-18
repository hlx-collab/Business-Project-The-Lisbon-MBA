const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /\{ \['NPV', 'IRR', 'Average Annual ROI', 'Operating Profit', 'Net Profit'\]\.map\(\(metricName, idx\) => \{/g,
  `{ ['NPV', 'IRR', 'Average Annual ROI', 'Total ROI', 'Operating Profit', 'Net Profit'].map((metricName, idx) => {`
);

code = code.replace(
  /if \(metricName === 'Average Annual ROI'\) \{ dataArr = mcResults\.roi; formatter = \(v\) => \(v \* 100\)\.toFixed\(2\) \+ '\%'; \}/g,
  `if (metricName === 'Average Annual ROI') { dataArr = mcResults.roi; formatter = (v) => (v * 100).toFixed(2) + '%'; }\n                  if (metricName === 'Total ROI') { dataArr = mcResults.totalRoi; formatter = (v) => (v * 100).toFixed(2) + '%'; }`
);

fs.writeFileSync('src/App.tsx', code);
