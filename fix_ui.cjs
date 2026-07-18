const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldHtml = `              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Total ROI</h3>
                <div className="flex items-baseline space-x-3">
                  <span className={\`text-3xl font-bold \${totalRoi >= 0 ? 'text-indigo-600' : 'text-red-600'}\`}>
                    {(totalRoi * 100).toFixed(1)}%
                  </span>
                </div>
              </div>`;

const newHtml = `              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 relative group">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Total ROI</h3>
                <div className="flex items-baseline space-x-3">
                  <span className={\`text-3xl font-bold \${totalRoi >= 0 ? 'text-indigo-600' : 'text-red-600'}\`}>
                    {(totalRoi * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  ({formatCurrency(totalNetIncome)} / {formatCurrency(totalInvestment)})
                </div>
              </div>`;

code = code.replace(oldHtml, newHtml);

fs.writeFileSync('src/App.tsx', code);
