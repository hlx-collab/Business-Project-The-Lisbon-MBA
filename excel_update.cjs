const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldExcel = `    // Add Modifiers
    sensSheet.addRow(['Modifiers Applied (%)']);
    sensSheet.getRow(3).font = { bold: true, size: 12 };
    sensSheet.addRow(['New Owners Added', sensitivityMods.newOwners]);
    sensSheet.addRow(['New Providers Added', sensitivityMods.newProviders]);
    sensSheet.addRow(['Owner Churn Rate', sensitivityMods.ownerChurn]);
    sensSheet.addRow(['Provider Churn Rate', sensitivityMods.providerChurn]);
    sensSheet.addRow(['WACC', sensitivityMods.wacc]);
    sensSheet.addRow(['Avg Price per Booking', sensitivityMods.avgPricePerBooking]);
    sensSheet.addRow(['% of Bookings Commission', sensitivityMods.commission]);
    sensSheet.addRow(['Monthly Subscription Fee', sensitivityMods.subscriptionFee]);
    sensSheet.addRow(['# of yearly bookings per pet owners', sensitivityMods.yearlyBookings]);
    sensSheet.addRow(['IT R&D and Support', sensitivityMods.itRnD]);
    sensSheet.addRow(['Advertisement & Promotion', sensitivityMods.marketing]);
    sensSheet.addRow([]);`;

const newExcel = `    // Add Modifiers
    sensSheet.addRow(['Modifiers & Overrides']);
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

code = code.replace(oldExcel, newExcel);
fs.writeFileSync('src/App.tsx', code);
