const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldUI = `<div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span>WACC</span>
                  <span className={sensitivityMods.wacc > 0 ? 'text-indigo-600 font-bold' : sensitivityMods.wacc < 0 ? 'text-rose-600 font-bold' : 'text-slate-500 font-bold'}>
                    {sensitivityMods.wacc > 0 ? '+' : ''}{sensitivityMods.wacc}%
                  </span>
                </label>
                <input 
                  type="range" 
                  min="-50" 
                  max="50" 
                  value={sensitivityMods.wacc} 
                  onChange={e => setSensitivityMods({...sensitivityMods, wacc: Number(e.target.value)})}
                  className="w-full accent-indigo-600"
                />
              </div>`;

const newUI = `<div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span>WACC</span>
                  <span className="text-indigo-600 font-bold">
                    {(17.3 + sensitivityMods.wacc).toFixed(1)}%
                  </span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
                  step="0.1"
                  value={17.3 + sensitivityMods.wacc} 
                  onChange={e => setSensitivityMods({...sensitivityMods, wacc: Number(e.target.value) - 17.3})}
                  className="w-full accent-indigo-600"
                />
              </div>`;

code = code.replace(oldUI, newUI);

// Also fix the text "NPV (WACC 17.3%)" to be dynamic
code = code.replace(/<h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">NPV \(WACC 17\.3%\)<\/h3>/g, `<h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">NPV (WACC {(17.3 + sensitivityMods.wacc).toFixed(1)}%)</h3>`);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed WACC UI');
