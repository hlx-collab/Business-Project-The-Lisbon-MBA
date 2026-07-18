const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetMods = `      platformMetricsStreams = applyMod(platformMetricsStreams, '# of yearly bookings per pet owners', mods.yearlyBookings, 'absolute');`;
const replacementMods = `      platformMetricsStreams = applyMod(platformMetricsStreams, '# of yearly bookings per pet owners', mods.yearlyBookings, 'absolute');
      platformMetricsStreams = applyMod(platformMetricsStreams, 'Unit Customer Support cost - Owners', mods.unitCustomerSupportCostOwners, 'absolute');`;

code = code.replaceAll(targetMods, replacementMods);

fs.writeFileSync('src/App.tsx', code);
