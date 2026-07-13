const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const calculateFinancials = (data: MarketData, marketName: 'Portugal' | 'UK', mods?: typeof sensitivityMods) => {",
  "function calculateFinancials(data: MarketData, marketName: 'Portugal' | 'UK', mods?: typeof sensitivityMods) {"
);

code = code.replace(
  "const computeAllFinancials = (markets: any, activeMarket: string, mods?: typeof sensitivityMods) => {",
  "function computeAllFinancials(markets: any, activeMarket: string, mods?: typeof sensitivityMods) {"
);

fs.writeFileSync('src/App.tsx', code);
