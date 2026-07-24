const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `    const defRevBalance = years.map(y => totalGrossRevenueByYear[y] * 0.01);
    const accruedFeesBalance = years.map(y => totalGrossRevenueByYear[y] * 0.03);`;
const replacement1 = `    const defRevBalance = years.map(y => 0);
    const accruedFeesBalance = years.map(y => 0);`;
code = code.replace(target1, replacement1);
code = code.replace(target1, replacement1);

const excelTarget1 = `      sheet.addRow([
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

const excelReplacement1 = `      sheet.addRow([
        'Balance Sheet',
        'Deferred Revenue',
        ...years.map(y => 0)
      ]); currentRow++;

      sheet.addRow([
        'Balance Sheet',
        'Accrued Provider Fees',
        ...years.map(y => 0)
      ]); currentRow++;`;

code = code.replace(excelTarget1, excelReplacement1);

fs.writeFileSync('src/App.tsx', code);
console.log("Done");
