const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/computeAllFinancials\(markets, activeMarket, sensitivityMods\)/, "computeAllFinancials(markets, activeMarket, sensitivityMods.Portugal, sensitivityMods.UK, sensitivityMods.wacc)");
fs.writeFileSync('src/App.tsx', code);
