const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Update WACC calculations
code = code.replace(/const WACC = 0\.173 \* \(1 \+ \(\(mods\?\.wacc\) \|\| 0\) \/ 100\);/g, 'const WACC = (17.3 + ((mods?.wacc) || 0)) / 100;');

// Update Excel export text
code = code.replace(/sensSheet\.addRow\(\['WACC Modifier', sensitivityMods\.wacc\]\);/g, "sensSheet.addRow(['WACC (%)', 17.3 + (sensitivityMods.wacc || 0)]);");

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed WACC math');
