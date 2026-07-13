const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<div className="space-y-4">\s*<label className="text-sm font-medium text-slate-700 flex justify-between">\s*<span>Owner Churn Rate \(%\)<\/span>[\s\S]*?<\/div>\s*<div className="space-y-4">\s*<label className="text-sm font-medium text-slate-700 flex justify-between">\s*<span>Provider Churn Rate \(%\)<\/span>[\s\S]*?<\/div>/m;

const replacement = `<div className="space-y-4 col-span-1 md:col-span-3">
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
              </div>`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Replaced churn UI successfully.");
} else {
    console.log("Could not find churn UI to replace.");
}

