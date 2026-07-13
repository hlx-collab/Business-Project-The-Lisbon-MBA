const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `} else if (name.includes('%')) {
              rowData.push(val / 100);
            } else { rowData.push(val); }`,
  `} else {
              const sensCell: Record<string, string> = {
                'New owners added': 'B4',
                'New providers added': 'B5',
                'Owner churn rate (%)': 'B6',
                'Provider churn rate (%)': 'B7',
                'Avg price per booking': 'B9',
                '% of bookings commission': 'B10',
                'Monthly Subscription fee': 'B11',
                '# of yearly bookings per pet owners': 'B12'
              };
              const cell = sensCell[name];
              let baseVal = name.includes('%') ? val / 100 : val;
              if (cell) {
                rowData.push({ formula: \`\${baseVal} * (1 + 'Sensitivity Analysis'!$\${cell}/100)\` });
              } else {
                rowData.push(baseVal);
              }
            }`
);

code = code.replace(
  `rowData.push(getStreamValue(market as Market, 'Fixed Cost', name, y));`,
  `const val = getStreamValue(market as Market, 'Fixed Cost', name, y);
            const sensCell: Record<string, string> = {
              'IT R&D and Support': 'B13',
              'Advertisement & Promotion': 'B14'
            };
            const cell = sensCell[name];
            if (cell) {
              rowData.push({ formula: \`\${val} * (1 + 'Sensitivity Analysis'!$\${cell}/100)\` });
            } else {
              rowData.push(val);
            }`
);

code = code.replace(
  `        'NPV (WACC 17.3%)',
        { formula: \`NPV(0.173, C\${netCfOpRowIdx + 1}:G\${netCfOpRowIdx + 1})\` }`,
  `        'NPV (Adjusted)',
        { formula: \`NPV(0.173 * (1 + 'Sensitivity Analysis'!$B$8/100), C\${netCfOpRowIdx + 1}:G\${netCfOpRowIdx + 1})\` }`
);

fs.writeFileSync('src/App.tsx', code);
