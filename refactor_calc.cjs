const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/function calculateFinancials\(data: MarketData, marketName: 'Portugal' \| 'UK', mods\?: typeof sensitivityMods\) \{/, `function calculateFinancials(data: MarketData, marketName: 'Portugal' | 'UK', mods?: typeof sensitivityMods.Portugal, waccMod: number = 0) {`);

code = code.replace(/const WACC = \(17\.3 \+ \(\(mods\?\.wacc\) \|\| 0\)\) \/ 100;/g, `const WACC = (17.3 + (waccMod || 0)) / 100;`);

code = code.replace(/if \(type === 'absoluteArray' && Array\.isArray\(modValue\)\) \{/, `// For UK, only apply modifiers to Y3, Y4, Y5 (indices 2, 3, 4)\n                if (marketName === 'UK' && i < 2) return num;\n                if (type === 'absoluteArray' && Array.isArray(modValue)) {`);

code = code.replace(/function computeAllFinancials\(markets: any, activeMarket: string, mods\?: typeof sensitivityMods\) \{/, `function computeAllFinancials(markets: any, activeMarket: string, modsPt?: typeof sensitivityMods.Portugal, modsUk?: typeof sensitivityMods.UK, waccMod: number = 0) {`);

code = code.replace(/const ptFin = \{ \.\.\.pt, \.\.\.calculateFinancials\(pt, 'Portugal', mods\) \};/g, `const ptFin = { ...pt, ...calculateFinancials(pt, 'Portugal', modsPt, waccMod) };`);
code = code.replace(/const rawUkFin = \{ \.\.\.uk, \.\.\.calculateFinancials\(uk, 'UK', mods\) \};/g, `const rawUkFin = { ...uk, ...calculateFinancials(uk, 'UK', modsUk, waccMod) };`);

code = code.replace(/calculateFinancials\(currentMarketData, activeMarket as 'Portugal' \| 'UK', mods\)/g, `calculateFinancials(currentMarketData, activeMarket as 'Portugal' | 'UK', activeMarket === 'Portugal' ? modsPt : modsUk, waccMod)`);

fs.writeFileSync('src/App.tsx', code);
console.log('Done 2');
