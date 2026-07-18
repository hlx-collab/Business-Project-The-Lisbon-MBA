const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `          yearlyBookings: mods.yearlyBookings + r() * 1,`;
const replacement1 = `          yearlyBookings: mods.yearlyBookings + r() * 1,
          unitCustomerSupportCostOwners: mods.unitCustomerSupportCostOwners + r() * 2,`;
code = code.replace(target1, replacement1);

const target2 = `        yearlyBookings: 0,`;
const replacement2 = `        yearlyBookings: 0,
        unitCustomerSupportCostOwners: 0,`;
code = code.replace(target2, replacement2);

const target3 = `      { name: 'Yearly Bookings +1 (abs)', mod: 'yearlyBookings', val: 1 },`;
const replacement3 = `      { name: 'Yearly Bookings +1 (abs)', mod: 'yearlyBookings', val: 1 },
      { name: 'Unit CS Owners +1 (abs)', mod: 'unitCustomerSupportCostOwners', val: 1 },`;
code = code.replace(target3, replacement3);

fs.writeFileSync('src/App.tsx', code);
