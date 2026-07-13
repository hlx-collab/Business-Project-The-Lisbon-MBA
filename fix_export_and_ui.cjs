const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Inside exportToExcel, define currentMods
code = code.replace(/const sensSheet = workbook\.addWorksheet\('Sensitivity Analysis'\);/, `const sensSheet = workbook.addWorksheet('Sensitivity Analysis');
    const exportMods = activeMarket === 'Aggregated' ? sensitivityMods.Portugal : sensitivityMods[activeMarket as 'Portugal' | 'UK'];
`);

// Replace sensitivityMods with exportMods in the sensitivity sheet generation
code = code.replace(/sensitivityMods\.newOwners/g, 'exportMods.newOwners');
code = code.replace(/sensitivityMods\.newProviders/g, 'exportMods.newProviders');
// But WACC is global!
code = code.replace(/exportMods\.wacc/g, 'sensitivityMods.wacc'); // Undo WACC change

code = code.replace(/sensitivityMods\.itRnD/g, 'exportMods.itRnD');
code = code.replace(/sensitivityMods\.marketing/g, 'exportMods.marketing');
code = code.replace(/sensitivityMods\.ownerChurn/g, 'exportMods.ownerChurn');
code = code.replace(/sensitivityMods\.providerChurn/g, 'exportMods.providerChurn');
code = code.replace(/sensitivityMods\.avgPricePerBooking/g, 'exportMods.avgPricePerBooking');
code = code.replace(/sensitivityMods\.commission/g, 'exportMods.commission');
code = code.replace(/sensitivityMods\.subscriptionFee/g, 'exportMods.subscriptionFee');
code = code.replace(/sensitivityMods\.yearlyBookings/g, 'exportMods.yearlyBookings');

// Now in the UI, define currentMods
code = code.replace(/const currentMarketData = marketsFilled\[activeMarket as 'Portugal' \| 'UK'\];/, `const currentMarketData = marketsFilled[activeMarket as 'Portugal' | 'UK'];
  const currentMods = activeMarket === 'Aggregated' ? null : sensitivityMods[activeMarket as 'Portugal' | 'UK'];
  const handleModChange = (key: string, value: any) => {
    if (!currentMods) return;
    setSensitivityMods({
      ...sensitivityMods,
      [activeMarket]: {
        ...sensitivityMods[activeMarket as 'Portugal' | 'UK'],
        [key]: value
      }
    });
  };
`);

// Now replace UI usages with currentMods, taking care of wacc again
code = code.replace(/exportMods\./g, 'currentMods.'); // some might have been replaced globally, wait.

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed export and UI setup');
