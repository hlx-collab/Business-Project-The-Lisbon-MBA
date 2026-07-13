const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/currentMods\.avgPricePerBooking/g, '(currentMods?.avgPricePerBooking || 0)');
code = code.replace(/currentMods\.commission/g, '(currentMods?.commission || 0)');
code = code.replace(/currentMods\.subscriptionFee/g, '(currentMods?.subscriptionFee || 0)');
code = code.replace(/currentMods\.yearlyBookings/g, '(currentMods?.yearlyBookings || 0)');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed currentMods again');
