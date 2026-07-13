const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The block where relative modifiers are applied:
const oldRelativeReplace = `const sensCell: Record<string, string> = {
              'IT R&D and Support': 'B13',
              'Advertisement & Promotion': 'B14'
            };`;
            
const newRelativeReplace = `const sensCell: Record<string, string> = {
              'IT R&D and Support': 'B8',
              'Advertisement & Promotion': 'B9'
            };`;
code = code.replace(oldRelativeReplace, newRelativeReplace);

// The block for other platform metrics:
const oldPlatformReplace = `const sensCell: Record<string, string> = {
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
              }`;

const newPlatformReplace = `const sensCell: Record<string, string> = {
                'New owners added': 'B5',
                'New providers added': 'B6',
                'Owner churn rate (%)': '12',
                'Provider churn rate (%)': '13',
                'Avg price per booking': 'B16',
                '% of bookings commission': 'B17',
                'Monthly Subscription fee': 'B18',
                '# of yearly bookings per pet owners': 'B19'
              };
              const cell = sensCell[name];
              let baseVal = name.includes('%') ? val / 100 : val;
              if (cell) {
                if (name === 'Owner churn rate (%)' || name === 'Provider churn rate (%)') {
                  const colLetter = getColLetter(2 + y);
                  rowData.push({ formula: \`'Sensitivity Analysis'!\${colLetter}\${cell}/100\` });
                } else if (name === 'Avg price per booking' || name === 'Monthly Subscription fee' || name === '# of yearly bookings per pet owners') {
                  rowData.push({ formula: \`'Sensitivity Analysis'!$\${cell}\` });
                } else if (name === '% of bookings commission') {
                  rowData.push({ formula: \`'Sensitivity Analysis'!$\${cell}/100\` });
                } else {
                  rowData.push({ formula: \`\${baseVal} * (1 + 'Sensitivity Analysis'!$\${cell}/100)\` });
                }
              } else {
                rowData.push(baseVal);
              }`;

code = code.replace(oldPlatformReplace, newPlatformReplace);

// Update WACC NPV formula reference
const oldWaccReplace = `'NPV (Adjusted)',
        { formula: \`NPV(0.173 * (1 + 'Sensitivity Analysis'!$B$8/100), C\${netCfOpRowIdx + 1}:G\${netCfOpRowIdx + 1})\` }`;
        
const newWaccReplace = `'NPV (Adjusted)',
        { formula: \`NPV(0.173 * (1 + 'Sensitivity Analysis'!$B$7/100), C\${netCfOpRowIdx + 1}:G\${netCfOpRowIdx + 1})\` }`;

code = code.replace(oldWaccReplace, newWaccReplace);

fs.writeFileSync('src/App.tsx', code);
