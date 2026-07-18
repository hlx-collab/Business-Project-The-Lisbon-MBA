const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add totalRoi calculation
code = code.replace(
  /const roi = totalInvestment > 0 \? \(\(totalNetIncome \/ 5\) \/ totalInvestment\) : 0;/g,
  `const roi = totalInvestment > 0 ? ((totalNetIncome / 5) / totalInvestment) : 0;\n    const totalRoi = totalInvestment > 0 ? (totalNetIncome / totalInvestment) : 0;`
);

// 2. Add to return object
code = code.replace(
  /      irr,\n      roi,\n      paybackPeriod,/g,
  `      irr,\n      roi,\n      totalRoi,\n      paybackPeriod,`
);

code = code.replace(
  /        irr,\n        roi,\n        paybackPeriod,/g,
  `        irr,\n        roi,\n        totalRoi,\n        paybackPeriod,`
);

code = code.replace(
  /    irr,\n    roi,\n    paybackPeriod,/g,
  `    irr,\n    roi,\n    totalRoi,\n    paybackPeriod,`
);

// 3. Add to UI
const uiToReplace = `<div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Average Annual ROI</h3>
                <div className="flex items-baseline space-x-3">
                  <span className={\`text-3xl font-bold \${roi >= 0 ? 'text-indigo-600' : 'text-red-600'}\`}>
                    {(roi * 100).toFixed(1)}%
                  </span>
                </div>
              </div>`;

const uiReplacement = `<div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Average Annual ROI</h3>
                <div className="flex items-baseline space-x-3">
                  <span className={\`text-3xl font-bold \${roi >= 0 ? 'text-indigo-600' : 'text-red-600'}\`}>
                    {(roi * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Total ROI</h3>
                <div className="flex items-baseline space-x-3">
                  <span className={\`text-3xl font-bold \${totalRoi >= 0 ? 'text-indigo-600' : 'text-red-600'}\`}>
                    {(totalRoi * 100).toFixed(1)}%
                  </span>
                </div>
              </div>`;

code = code.replace(uiToReplace, uiReplacement);

// Check if totalRoi works in state type
code = code.replace(
  /roi: number\[\]; payback: number\[\];/g,
  `roi: number[]; totalRoi: number[]; payback: number[];`
);

code = code.replace(
  /const roiArr = \[\];/g,
  `const roiArr = [];\n      const totalRoiArr = [];`
);

code = code.replace(
  /roiArr\.push\(result\.roi \|\| 0\);/g,
  `roiArr.push(result.roi || 0);\n        totalRoiArr.push(result.totalRoi || 0);`
);

code = code.replace(
  /roi: roiArr\.sort\(\(a,b\)=>a-b\),/g,
  `roi: roiArr.sort((a,b)=>a-b),\n        totalRoi: totalRoiArr.sort((a,b)=>a-b),`
);

code = code.replace(
  /roi: \(result\.roi \|\| 0\) - \(base\.roi \|\| 0\),/g,
  `roi: (result.roi || 0) - (base.roi || 0),\n        totalRoi: (result.totalRoi || 0) - (base.totalRoi || 0),`
);

code = code.replace(
  /roi: adjusted\.roi,/g,
  `roi: adjusted.roi,\n        totalRoi: adjusted.totalRoi,`
);

code = code.replace(
  /sensSheet\.addRow\(\['Average Annual ROI \(%\)', sensitivityData\.metrics\.roi \* 100\]\);/g,
  `sensSheet.addRow(['Average Annual ROI (%)', sensitivityData.metrics.roi * 100]);\n    sensSheet.addRow(['Total ROI (%)', sensitivityData.metrics.totalRoi * 100]);`
);

code = code.replace(
  /\<span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1"\>ROI\<\/span\>\n                \<span className="text-lg font-bold text-slate-900"\>\{\(sensitivityData\.metrics\.roi \* 100\)\.toFixed\(1\)\}\%\<\/span\>/g,
  `<span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Avg Ann ROI</span>
                <span className="text-lg font-bold text-slate-900">{(sensitivityData.metrics.roi * 100).toFixed(1)}%</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total ROI</span>
                <span className="text-lg font-bold text-slate-900">{(sensitivityData.metrics.totalRoi * 100).toFixed(1)}%</span>`
);

fs.writeFileSync('src/App.tsx', code);
