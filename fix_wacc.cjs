const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `<h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">NPV (WACC {(17.3 + sensitivityMods.wacc).toFixed(1)}%)</h3>`;
const replacement1 = `<h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">NPV (WACC 17.3%)</h3>`;
code = code.replace(target1, replacement1);

const target2 = `        'NPV (Adjusted)',
        { formula: \`NPV(0.173 * (1 + 'Sensitivity Analysis'!$B$7/100), C\${netCfOpRowIdx + 1}:G\${netCfOpRowIdx + 1})\` }`;
const replacement2 = `        'NPV',
        { formula: \`NPV(0.173, C\${netCfOpRowIdx + 1}:G\${netCfOpRowIdx + 1})\` }`;
code = code.replace(target2, replacement2);

const target3 = `                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">NPV</span>
                <span className="text-lg font-bold text-slate-900">{formatCurrency(sensitivityData.metrics.npv)}</span>`;
const replacement3 = `                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">NPV (WACC {(17.3 + sensitivityMods.wacc).toFixed(1)}%)</span>
                <span className="text-lg font-bold text-slate-900">{formatCurrency(sensitivityData.metrics.npv)}</span>`;
code = code.replace(target3, replacement3);

fs.writeFileSync('src/App.tsx', code);
console.log("Done");
