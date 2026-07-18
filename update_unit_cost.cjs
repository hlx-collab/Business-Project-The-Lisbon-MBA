const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Initial State
code = code.replace(/unitCustomerSupportCostOwners: 0/g, 'unitCustomerSupportCostOwners: [0, 0, 0, 0, 0]');

// 2. testScenario fallback for array
code = code.replace(/if \(modName === 'ownerChurn' \|\| modName === 'providerChurn'\) \{/g, "if (modName === 'ownerChurn' || modName === 'providerChurn' || modName === 'unitCustomerSupportCostOwners') {");

// 3. calculateFinancials
code = code.replace(/platformMetricsStreams = applyMod\(platformMetricsStreams, 'Unit Customer Support cost - Owners', mods\.unitCustomerSupportCostOwners, 'absolute'\);/g, "platformMetricsStreams = applyMod(platformMetricsStreams, 'Unit Customer Support cost - Owners', mods.unitCustomerSupportCostOwners, 'absoluteArray');");

// 4. Excel export - Move it to Absolute Overrides (Per Year)
const excelRemove = `    sensSheet.addRow(['Unit Customer Support cost - Owners', getBasePlatformMetric('Unit Customer Support cost - Owners') + (currentMods?.unitCustomerSupportCostOwners || 0)]);`;
code = code.replace(excelRemove, "");

const excelAdd = `    sensSheet.addRow(['Provider Churn Rate (%)', ...years.map(y => baseProviderChurn[y] + ((currentMods?.providerChurn && currentMods?.providerChurn[y]) || 0))]);`;
const excelReplacement = `    sensSheet.addRow(['Provider Churn Rate (%)', ...years.map(y => baseProviderChurn[y] + ((currentMods?.providerChurn && currentMods?.providerChurn[y]) || 0))]);
    sensSheet.addRow(['Unit Customer Support cost - Owners', ...years.map(y => getBasePlatformMetric('Unit Customer Support cost - Owners', y) + ((currentMods?.unitCustomerSupportCostOwners && currentMods?.unitCustomerSupportCostOwners[y]) || 0))]);`;
code = code.replace(excelAdd, excelReplacement);

// 5. UI rendering
const uiRemove = `              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between items-center">
                  <span>Unit Customer Support cost - Owners</span>
                  <div className="flex items-center">
                    <span className="text-indigo-600 font-bold mr-1">{getCurrencySymbol()}</span>
                    <input 
                      type="number" 
                      step="0.00001" 
                      className="text-indigo-600 font-bold text-right w-24 bg-transparent border-b border-indigo-200 focus:outline-none focus:border-indigo-600"
                      value={(getBasePlatformMetric('Unit Customer Support cost - Owners') + (currentMods?.unitCustomerSupportCostOwners || 0)).toFixed(5)}
                      onChange={(e) => handleModChange('unitCustomerSupportCostOwners', Number(e.target.value) - getBasePlatformMetric('Unit Customer Support cost - Owners'))}
                    />
                  </div>
                </label>
                <RangeWithButtons min={0} max={Math.max(20, getBasePlatformMetric('Unit Customer Support cost - Owners') + 20)} step={0.00001} value={getBasePlatformMetric('Unit Customer Support cost - Owners') + (currentMods?.unitCustomerSupportCostOwners || 0)} onChange={(e: any) => handleModChange('unitCustomerSupportCostOwners', Number(e.target.value) - getBasePlatformMetric('Unit Customer Support cost - Owners'))} />
              </div>`;
code = code.replace(uiRemove, "");

const uiAdd = `              <div className="space-y-4 col-span-1 md:col-span-3">
                <label className="text-sm font-medium text-slate-700">Provider Churn Rate (%) - Absolute Value</label>
                <div className="grid grid-cols-5 gap-4">
                  {years.map(y => {
                    const base = getBasePlatformMetric('Provider churn rate (%)', y);
                    const val = base + ((currentMods?.providerChurn && currentMods?.providerChurn[y]) || 0);
                    return (
                      <div key={y} className="flex flex-col space-y-1">
                        <span className="text-xs text-slate-500">Year {y+1}</span>
                        <input 
                          type="number"
                          step="1"
                          value={val.toFixed(1)}
                          onChange={e => {
                            const newVal = Array.isArray(currentMods?.providerChurn) ? [...currentMods?.providerChurn] : [0,0,0,0,0];
                            newVal[y] = Number(e.target.value) - base;
                            handleModChange('providerChurn', newVal);
                          }}
                          className="border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>`;

const uiReplacement = uiAdd + `

              <div className="space-y-4 col-span-1 md:col-span-3">
                <label className="text-sm font-medium text-slate-700 flex items-center">Unit Customer Support cost - Owners ({getCurrencySymbol()}) - Absolute Value</label>
                <div className="grid grid-cols-5 gap-4">
                  {years.map(y => {
                    const base = getBasePlatformMetric('Unit Customer Support cost - Owners', y);
                    const val = base + ((currentMods?.unitCustomerSupportCostOwners && currentMods?.unitCustomerSupportCostOwners[y]) || 0);
                    return (
                      <div key={y} className="flex flex-col space-y-1">
                        <span className="text-xs text-slate-500">Year {y+1}</span>
                        <input 
                          type="number"
                          step="0.00001"
                          value={val.toFixed(5)}
                          onChange={e => {
                            const newVal = Array.isArray(currentMods?.unitCustomerSupportCostOwners) ? [...currentMods?.unitCustomerSupportCostOwners] : [0,0,0,0,0];
                            newVal[y] = Number(e.target.value) - base;
                            handleModChange('unitCustomerSupportCostOwners', newVal);
                          }}
                          className="border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>`;

code = code.replace(uiAdd, uiReplacement);

// 6. Spider Mod (Monte Carlo) fix
const spiderFix = `          unitCustomerSupportCostOwners: mods.unitCustomerSupportCostOwners + r() * 2,`;
const spiderReplacement = `          unitCustomerSupportCostOwners: [0,0,0,0,0].map(() => (mods.unitCustomerSupportCostOwners?.[0] || 0) + r() * 2),`;
code = code.replace(spiderFix, spiderReplacement);

fs.writeFileSync('src/App.tsx', code);
console.log("Done");
