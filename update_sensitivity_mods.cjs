const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetMods = `      yearlyBookings: 0,
      itRnD: 0,
      marketing: 0`;
const replacementMods = `      yearlyBookings: 0,
      itRnD: 0,
      marketing: 0,
      unitCustomerSupportCostOwners: 0`;

code = code.replaceAll(targetMods, replacementMods);

fs.writeFileSync('src/App.tsx', code);
