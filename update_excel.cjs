const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `    sensSheet.addRow([]);

    // Add Results
    sensSheet.addRow(['Modified P&L', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Total']);`;

const replacement = `    sensSheet.addRow([]);

    // Add Financial Highlights
    sensSheet.addRow(['Financial Highlights', 'Value']);
    sensSheet.getRow(sensSheet.lastRow.number).font = { bold: true, size: 11, color: { argb: 'FF475569' } };
    sensSheet.addRow(['NPV', sensitivityData.metrics.npv]);
    sensSheet.addRow(['IRR (%)', sensitivityData.metrics.irr !== null ? sensitivityData.metrics.irr * 100 : 'N/A']);
    sensSheet.addRow(['ROI (%)', sensitivityData.metrics.roi * 100]);
    sensSheet.addRow(['Payback Period (Years)', sensitivityData.metrics.paybackPeriod !== null ? sensitivityData.metrics.paybackPeriod : '> 5']);
    sensSheet.addRow(['Discounted Payback Period (Years)', sensitivityData.metrics.discountedPaybackPeriod !== null ? sensitivityData.metrics.discountedPaybackPeriod : '> 5']);
    sensSheet.addRow([]);

    // Add Results
    sensSheet.addRow(['Modified P&L', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Total']);`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
