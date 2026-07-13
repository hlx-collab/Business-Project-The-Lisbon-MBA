const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const match = code.match(/function calculateFinancials\([\s\S]*?platformMetricsStreams = applyMod\(platformMetricsStreams, '# of yearly bookings per pet owners', mods\.yearlyBookings, 'absolute'\);\n      fixedCostsStreams = applyMod\(fixedCostsStreams, 'IT R&D and Support', mods\.itRnD, 'relative'\);\n      fixedCostsStreams = applyMod\(fixedCostsStreams, 'Advertisement & Promotion', mods\.marketing, 'relative'\);\n    \}/);

if (match) {
  console.log("Matched calculateFinancials");
} else {
  console.log("Not matched");
}
