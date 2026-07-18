const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `    const defRevBalance = years.map(y => totalRevenueByYear[y] * 0.01);
    const accruedFeesBalance = years.map(y => totalRevenueByYear[y] * 0.03);`;
const replacement1 = `    const defRevBalance = years.map(y => totalGrossRevenueByYear[y] * 0.01);
    const accruedFeesBalance = years.map(y => totalGrossRevenueByYear[y] * 0.03);`;
// Should apply to calculateFinancials for specific market (around line 762)
// and also computeAllFinancials (around line 1204)
code = code.replace(target1, replacement1);
code = code.replace(target1, replacement1);

// Now for Excel Export
const excelTarget1 = `      sheet.addRow([
        'Balance Sheet',
        'Deferred Revenue',
        ...years.map(y => {
          const col = getColLetter(2 + y);
          return { formula: \`IF(\${col}\${revenueTotalRowIdx + 1}=0,0,\${col}\${revenueTotalRowIdx + 1}*0.01)\` };
        })
      ]); currentRow++;

      sheet.addRow([
        'Balance Sheet',
        'Accrued Provider Fees',
        ...years.map(y => {
          const col = getColLetter(2 + y);
          return { formula: \`IF(\${col}\${revenueTotalRowIdx + 1}=0,0,\${col}\${revenueTotalRowIdx + 1}*0.03)\` };
        })
      ]); currentRow++;`;

const excelReplacement1 = `      sheet.addRow([
        'Balance Sheet',
        'Deferred Revenue',
        ...years.map(y => {
          const col = getColLetter(2 + y);
          return { formula: \`IF(\${col}\${grossRevRowIdx + 1}=0,0,\${col}\${grossRevRowIdx + 1}*0.01)\` };
        })
      ]); currentRow++;

      sheet.addRow([
        'Balance Sheet',
        'Accrued Provider Fees',
        ...years.map(y => {
          const col = getColLetter(2 + y);
          return { formula: \`IF(\${col}\${grossRevRowIdx + 1}=0,0,\${col}\${grossRevRowIdx + 1}*0.03)\` };
        })
      ]); currentRow++;`;

code = code.replace(excelTarget1, excelReplacement1);

fs.writeFileSync('src/App.tsx', code);
console.log("Done");
