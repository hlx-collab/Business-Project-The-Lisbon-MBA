const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
    /const defRevBalance = years\.map\(y => totalRevenueByYear\[y\] \* 0\.01\);\n    const accruedFeesBalance = years\.map\(y => totalRevenueByYear\[y\] \* 0\.03\);\n    const arBalance = years\.map\(y => totalRevenueByYear\[y\] \* 0\.08\);/,
    `const defRevBalance = years.map(y => (Number(derivedRevenueStreams.find(s => s.name === 'Booking Fees')?.amounts[y]) || 0) / 12);
    const accruedFeesBalance = years.map(y => totalRevenueByYear[y] * 0.03);
    const arBalance = years.map(y => (Number(derivedRevenueStreams.find(s => s.name === 'Monthly Subscriptions')?.amounts[y]) || 0) / 12);`
);

code = code.replace(
    /const defRevBalance = years\.map\(y => totalRevenueByYear\[y\] \* 0\.01\);\n    const accruedFeesBalance = years\.map\(y => totalRevenueByYear\[y\] \* 0\.03\);\n    const arBalance = years\.map\(y => totalRevenueByYear\[y\] \* 0\.08\);/,
    `const defRevBalance = years.map(y => ptFin.defRevBalance[y] + ukFin.defRevBalance[y]);
    const accruedFeesBalance = years.map(y => ptFin.accruedFeesBalance[y] + ukFin.accruedFeesBalance[y]);
    const arBalance = years.map(y => ptFin.arBalance[y] + ukFin.arBalance[y]);`
);

fs.writeFileSync('src/App.tsx', code);
