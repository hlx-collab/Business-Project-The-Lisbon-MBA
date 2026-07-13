const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace UI Avg Price
code = code.replace(
  /<div className="space-y-4">\s*<label className="text-sm font-medium text-slate-700 flex justify-between">\s*<span>Avg Price per Booking<\/span>[\s\S]*?<\/div>/,
  `<div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span>Avg Price per Booking</span>
                  <span className="text-indigo-600 font-bold">
                    {formatCurrency(getBasePlatformMetric('Avg price per booking') + sensitivityMods.avgPricePerBooking)}
                  </span>
                </label>
                <input 
                  type="range"
                  min={Math.max(0, getBasePlatformMetric('Avg price per booking') - 50)}
                  max={getBasePlatformMetric('Avg price per booking') + 50}
                  value={getBasePlatformMetric('Avg price per booking') + sensitivityMods.avgPricePerBooking}
                  onChange={e => setSensitivityMods({...sensitivityMods, avgPricePerBooking: Number(e.target.value) - getBasePlatformMetric('Avg price per booking')})}
                  className="w-full accent-indigo-600"
                />
              </div>`
);

// Replace UI Commission
code = code.replace(
  /<div className="space-y-4">\s*<label className="text-sm font-medium text-slate-700 flex justify-between">\s*<span>% of Bookings Commission<\/span>[\s\S]*?<\/div>/,
  `<div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span>% of Bookings Commission</span>
                  <span className="text-indigo-600 font-bold">
                    {(getBasePlatformMetric('% of bookings commission') + sensitivityMods.commission).toFixed(1)}%
                  </span>
                </label>
                <input 
                  type="range"
                  min={0}
                  max={100}
                  step={0.5}
                  value={getBasePlatformMetric('% of bookings commission') + sensitivityMods.commission}
                  onChange={e => setSensitivityMods({...sensitivityMods, commission: Number(e.target.value) - getBasePlatformMetric('% of bookings commission')})}
                  className="w-full accent-indigo-600"
                />
              </div>`
);

// Replace UI Subscription Fee
code = code.replace(
  /<div className="space-y-4">\s*<label className="text-sm font-medium text-slate-700 flex justify-between">\s*<span>Monthly Subscription Fee<\/span>[\s\S]*?<\/div>/,
  `<div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span>Monthly Subscription Fee</span>
                  <span className="text-indigo-600 font-bold">
                    {formatCurrency(getBasePlatformMetric('Monthly Subscription fee') + sensitivityMods.subscriptionFee)}
                  </span>
                </label>
                <input 
                  type="range"
                  min={0}
                  max={getBasePlatformMetric('Monthly Subscription fee') + 100}
                  value={getBasePlatformMetric('Monthly Subscription fee') + sensitivityMods.subscriptionFee}
                  onChange={e => setSensitivityMods({...sensitivityMods, subscriptionFee: Number(e.target.value) - getBasePlatformMetric('Monthly Subscription fee')})}
                  className="w-full accent-indigo-600"
                />
              </div>`
);

// Replace UI Yearly Bookings
code = code.replace(
  /<div className="space-y-4">\s*<label className="text-sm font-medium text-slate-700 flex justify-between">\s*<span># of Yearly Bookings per Owner<\/span>[\s\S]*?<\/div>/,
  `<div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span># of Yearly Bookings per Owner</span>
                  <span className="text-indigo-600 font-bold">
                    {(getBasePlatformMetric('# of yearly bookings per pet owners') + sensitivityMods.yearlyBookings).toFixed(1)}
                  </span>
                </label>
                <input 
                  type="range"
                  min={0}
                  max={Math.max(10, getBasePlatformMetric('# of yearly bookings per pet owners') + 10)}
                  step={0.5}
                  value={getBasePlatformMetric('# of yearly bookings per pet owners') + sensitivityMods.yearlyBookings}
                  onChange={e => setSensitivityMods({...sensitivityMods, yearlyBookings: Number(e.target.value) - getBasePlatformMetric('# of yearly bookings per pet owners')})}
                  className="w-full accent-indigo-600"
                />
              </div>`
);

// Replace Excel portion
const oldExcelRegex = /sensSheet.addRow\(\['Modifiers Applied \(%\)'\]\);[\s\S]*?sensSheet.addRow\(\[\]\);/;
const newExcel = `sensSheet.addRow(['Modifiers & Overrides']);
    sensSheet.getRow(3).font = { bold: true, size: 12 };
    
    sensSheet.addRow(['Relative Modifiers (%)', 'Value']);
    sensSheet.getRow(4).font = { bold: true, size: 11, color: { argb: 'FF475569' } };
    sensSheet.addRow(['New Owners Added', sensitivityMods.newOwners]);
    sensSheet.addRow(['New Providers Added', sensitivityMods.newProviders]);
    sensSheet.addRow(['WACC Modifier', sensitivityMods.wacc]);
    sensSheet.addRow(['IT R&D and Support', sensitivityMods.itRnD]);
    sensSheet.addRow(['Advertisement & Promotion', sensitivityMods.marketing]);
    sensSheet.addRow([]);
    
    sensSheet.addRow(['Absolute Overrides (Per Year)', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']);
    sensSheet.getRow(11).font = { bold: true, size: 11, color: { argb: 'FF475569' } };
    
    const baseOwnerChurn = years.map(y => getBasePlatformMetric('Owner churn rate (%)', y));
    const baseProviderChurn = years.map(y => getBasePlatformMetric('Provider churn rate (%)', y));
    
    sensSheet.addRow(['Owner Churn Rate (%)', ...years.map(y => baseOwnerChurn[y] + ((sensitivityMods.ownerChurn && sensitivityMods.ownerChurn[y]) || 0))]);
    sensSheet.addRow(['Provider Churn Rate (%)', ...years.map(y => baseProviderChurn[y] + ((sensitivityMods.providerChurn && sensitivityMods.providerChurn[y]) || 0))]);
    sensSheet.addRow([]);
    
    sensSheet.addRow(['Absolute Overrides (Constant)', 'Value']);
    sensSheet.getRow(15).font = { bold: true, size: 11, color: { argb: 'FF475569' } };
    sensSheet.addRow(['Avg Price per Booking', getBasePlatformMetric('Avg price per booking') + sensitivityMods.avgPricePerBooking]);
    sensSheet.addRow(['% of Bookings Commission', (getBasePlatformMetric('% of bookings commission') + sensitivityMods.commission)]);
    sensSheet.addRow(['Monthly Subscription Fee', getBasePlatformMetric('Monthly Subscription fee') + sensitivityMods.subscriptionFee]);
    sensSheet.addRow(['# of yearly bookings per pet owners', getBasePlatformMetric('# of yearly bookings per pet owners') + sensitivityMods.yearlyBookings]);
    sensSheet.addRow([]);`;

code = code.replace(oldExcelRegex, newExcel);

fs.writeFileSync('src/App.tsx', code);
