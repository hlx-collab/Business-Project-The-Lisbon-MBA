const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The block containing the sliders starts around line 4300 and ends around 4700.
// Let's replace sensitivityMods with currentMods where applicable.

const replacements = [
  'newOwners', 'newProviders', 'itRnD', 'marketing',
  'avgPricePerBooking', 'commission', 'subscriptionFee', 'yearlyBookings',
  'ownerChurn', 'providerChurn'
];

replacements.forEach(key => {
  // Replace value reads
  code = code.replace(new RegExp(`sensitivityMods\\.${key}`, 'g'), `(currentMods?.${key} ?? 0)`);
  
  // Replace onChange
  // e.g. onChange={(e: any) => setSensitivityMods({...sensitivityMods, newOwners: Number(e.target.value)})}
  // with onChange={(e: any) => handleModChange('newOwners', Number(e.target.value))}
  code = code.replace(new RegExp(`onChange=\\{\\(e: any\\) => setSensitivityMods\\(\\{\\.\\.\\.sensitivityMods, ${key}: ([^}]+)\\}\\)\\}`, 'g'), `onChange={(e: any) => handleModChange('${key}', $1)}`);
});

// For WACC, keep it as sensitivityMods.wacc and use setSensitivityMods directly
// But the onChange for WACC is: onChange={(e: any) => setSensitivityMods({...sensitivityMods, wacc: Number(e.target.value) - 17.3})}
// This is already using sensitivityMods, which is correct.

// Hide the non-WACC sliders if activeMarket === 'Aggregated'
code = code.replace(/<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">/, `{currentMods && <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">}`);
// Close the first grid
code = code.replace(/<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">/, `</div>}\n              {currentMods && <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">}`);
// Close the second grid
code = code.replace(/<div className="bg-slate-50 p-6 rounded-xl border border-slate-100">/, `</div>}\n\n              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">`);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed sliders');
