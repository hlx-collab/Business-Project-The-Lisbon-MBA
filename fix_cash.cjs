const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/const defRevBalance = years\.map\(y => totalGrossRevenueByYear\[y\] \* 0\.01\);/g, "const defRevBalance = years.map(y => totalRevenueByYear[y] * 0.01);");
code = code.replace(/const accruedFeesBalance = years\.map\(y => totalGrossRevenueByYear\[y\] \* 0\.03\);/g, "const accruedFeesBalance = years.map(y => totalRevenueByYear[y] * 0.03);");

fs.writeFileSync('src/App.tsx', code);
