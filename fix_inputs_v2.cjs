const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `value={Number((getBasePlatformMetric('Unit Customer Support cost - Owners') + (currentMods?.unitCustomerSupportCostOwners || 0)).toFixed(5))}`;
const replacement1 = `value={(getBasePlatformMetric('Unit Customer Support cost - Owners') + (currentMods?.unitCustomerSupportCostOwners || 0)).toFixed(5)}`;
code = code.replace(target1, replacement1);

const target2 = `value={Number((currentMods?.marketing || 0).toFixed(5))}`;
const replacement2 = `value={(currentMods?.marketing || 0).toFixed(5)}`;
code = code.replace(target2, replacement2);

fs.writeFileSync('src/App.tsx', code);
console.log("Done");
