const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span>Unit Customer Support cost - Owners</span>
                  <span className="text-indigo-600 font-bold">
                    {formatCurrency(getBasePlatformMetric('Unit Customer Support cost - Owners') + (currentMods?.unitCustomerSupportCostOwners || 0))}
                  </span>
                </label>
                <RangeWithButtons min={0} max={Math.max(20, getBasePlatformMetric('Unit Customer Support cost - Owners') + 20)} step={0.1} value={getBasePlatformMetric('Unit Customer Support cost - Owners') + (currentMods?.unitCustomerSupportCostOwners || 0)} onChange={(e: any) => handleModChange('unitCustomerSupportCostOwners', Number(e.target.value) - getBasePlatformMetric('Unit Customer Support cost - Owners'))} />
              </div>`;

const replacement1 = `              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between items-center">
                  <span>Unit Customer Support cost - Owners</span>
                  <div className="flex items-center">
                    <span className="text-indigo-600 font-bold mr-1">{getCurrencySymbol()}</span>
                    <input 
                      type="number" 
                      step="0.00001" 
                      className="text-indigo-600 font-bold text-right w-24 bg-transparent border-b border-indigo-200 focus:outline-none focus:border-indigo-600"
                      value={Number((getBasePlatformMetric('Unit Customer Support cost - Owners') + (currentMods?.unitCustomerSupportCostOwners || 0)).toFixed(5))}
                      onChange={(e) => handleModChange('unitCustomerSupportCostOwners', Number(e.target.value) - getBasePlatformMetric('Unit Customer Support cost - Owners'))}
                    />
                  </div>
                </label>
                <RangeWithButtons min={0} max={Math.max(20, getBasePlatformMetric('Unit Customer Support cost - Owners') + 20)} step={0.00001} value={getBasePlatformMetric('Unit Customer Support cost - Owners') + (currentMods?.unitCustomerSupportCostOwners || 0)} onChange={(e: any) => handleModChange('unitCustomerSupportCostOwners', Number(e.target.value) - getBasePlatformMetric('Unit Customer Support cost - Owners'))} />
              </div>`;

code = code.replace(target1, replacement1);

const target2 = `              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span>Advertisement & Promotion</span>
                  <span className={(currentMods?.marketing || 0) > 0 ? 'text-indigo-600 font-bold' : (currentMods?.marketing || 0) < 0 ? 'text-rose-600 font-bold' : 'text-slate-500 font-bold'}>
                    {(currentMods?.marketing || 0) > 0 ? '+' : ''}{(currentMods?.marketing || 0)}%
                  </span>
                </label>
                <RangeWithButtons min="-50" max="50" value={(currentMods?.marketing || 0)} onChange={(e: any) => handleModChange('marketing', Number(e.target.value))} />
              </div>`;

const replacement2 = `              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between items-center">
                  <span>Advertisement & Promotion</span>
                  <div className="flex items-center">
                    <input 
                      type="number" 
                      step="0.00001"
                      className={\`text-right w-24 bg-transparent border-b focus:outline-none \${ (currentMods?.marketing || 0) > 0 ? 'text-indigo-600 font-bold border-indigo-200 focus:border-indigo-600' : (currentMods?.marketing || 0) < 0 ? 'text-rose-600 font-bold border-rose-200 focus:border-rose-600' : 'text-slate-500 font-bold border-slate-200 focus:border-slate-500'}\`}
                      value={Number((currentMods?.marketing || 0).toFixed(5))}
                      onChange={(e) => handleModChange('marketing', Number(e.target.value))}
                    />
                    <span className={(currentMods?.marketing || 0) > 0 ? 'text-indigo-600 font-bold ml-1' : (currentMods?.marketing || 0) < 0 ? 'text-rose-600 font-bold ml-1' : 'text-slate-500 font-bold ml-1'}>%</span>
                  </div>
                </label>
                <RangeWithButtons min="-50" max="50" step={0.00001} value={(currentMods?.marketing || 0)} onChange={(e: any) => handleModChange('marketing', Number(e.target.value))} />
              </div>`;

code = code.replace(target2, replacement2);

fs.writeFileSync('src/App.tsx', code);
console.log("Done");
