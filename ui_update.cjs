const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const baseVars = `              <div className="flex space-x-6 text-sm">
                <div className="flex flex-col items-end bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-medium text-xs uppercase tracking-wide">PT Total Bookings (5Y)</span>
                  <span className="font-mono font-bold text-slate-800 text-base">{new Intl.NumberFormat('en-US').format(Math.round(sensitivityData.ptBookings))}</span>
                </div>
                <div className="flex flex-col items-end bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-medium text-xs uppercase tracking-wide">UK Total Bookings (5Y)</span>
                  <span className="font-mono font-bold text-slate-800 text-base">{new Intl.NumberFormat('en-US').format(Math.round(sensitivityData.ukBookings))}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
`;

const uiReplacement = `              <div className="flex space-x-6 text-sm">
                <div className="flex flex-col items-end bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-medium text-xs uppercase tracking-wide">PT Total Bookings (5Y)</span>
                  <span className="font-mono font-bold text-slate-800 text-base">{new Intl.NumberFormat('en-US').format(Math.round(sensitivityData.ptBookings))}</span>
                </div>
                <div className="flex flex-col items-end bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-medium text-xs uppercase tracking-wide">UK Total Bookings (5Y)</span>
                  <span className="font-mono font-bold text-slate-800 text-base">{new Intl.NumberFormat('en-US').format(Math.round(sensitivityData.ukBookings))}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">

              <div className="space-y-4 col-span-1 md:col-span-3">
                <label className="text-sm font-medium text-slate-700">Owner Churn Rate (%) - Absolute Value</label>
                <div className="grid grid-cols-5 gap-4">
                  {years.map(y => {
                    const base = getBasePlatformMetric('Owner churn rate (%)', y);
                    const val = base + ((sensitivityMods.ownerChurn && sensitivityMods.ownerChurn[y]) || 0);
                    return (
                      <div key={y} className="flex flex-col space-y-1">
                        <span className="text-xs text-slate-500">Year {y+1}</span>
                        <input 
                          type="number"
                          step="1"
                          value={val.toFixed(1)}
                          onChange={e => {
                            const newVal = Array.isArray(sensitivityMods.ownerChurn) ? [...sensitivityMods.ownerChurn] : [0,0,0,0,0];
                            newVal[y] = Number(e.target.value) - base;
                            setSensitivityMods({...sensitivityMods, ownerChurn: newVal});
                          }}
                          className="border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4 col-span-1 md:col-span-3">
                <label className="text-sm font-medium text-slate-700">Provider Churn Rate (%) - Absolute Value</label>
                <div className="grid grid-cols-5 gap-4">
                  {years.map(y => {
                    const base = getBasePlatformMetric('Provider churn rate (%)', y);
                    const val = base + ((sensitivityMods.providerChurn && sensitivityMods.providerChurn[y]) || 0);
                    return (
                      <div key={y} className="flex flex-col space-y-1">
                        <span className="text-xs text-slate-500">Year {y+1}</span>
                        <input 
                          type="number"
                          step="1"
                          value={val.toFixed(1)}
                          onChange={e => {
                            const newVal = Array.isArray(sensitivityMods.providerChurn) ? [...sensitivityMods.providerChurn] : [0,0,0,0,0];
                            newVal[y] = Number(e.target.value) - base;
                            setSensitivityMods({...sensitivityMods, providerChurn: newVal});
                          }}
                          className="border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
`;

code = code.replace(baseVars, uiReplacement);

// We also need to remove the old owner/provider churn sliders
code = code.replace(
  `              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span>Owner Churn Rate (%)</span>
                  <span className={sensitivityMods.ownerChurn > 0 ? 'text-indigo-600 font-bold' : sensitivityMods.ownerChurn < 0 ? 'text-rose-600 font-bold' : 'text-slate-500 font-bold'}>
                    {sensitivityMods.ownerChurn > 0 ? '+' : ''}{sensitivityMods.ownerChurn}%
                  </span>
                </label>
                <input 
                  type="range"
                  min="-50"
                  max="50"
                  value={sensitivityMods.ownerChurn}
                  onChange={e => setSensitivityMods({...sensitivityMods, ownerChurn: Number(e.target.value)})}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span>Provider Churn Rate (%)</span>
                  <span className={sensitivityMods.providerChurn > 0 ? 'text-indigo-600 font-bold' : sensitivityMods.providerChurn < 0 ? 'text-rose-600 font-bold' : 'text-slate-500 font-bold'}>
                    {sensitivityMods.providerChurn > 0 ? '+' : ''}{sensitivityMods.providerChurn}%
                  </span>
                </label>
                <input 
                  type="range"
                  min="-50"
                  max="50"
                  value={sensitivityMods.providerChurn}
                  onChange={e => setSensitivityMods({...sensitivityMods, providerChurn: Number(e.target.value)})}
                  className="w-full accent-indigo-600"
                />
              </div>`,
  ''
);

fs.writeFileSync('src/App.tsx', code);
