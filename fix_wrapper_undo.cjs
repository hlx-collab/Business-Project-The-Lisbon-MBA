const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Undo the wrong replacement at line 3003
const wrongString = `</div>) : (<div className="flex flex-col items-center justify-center p-12 bg-slate-50 border border-slate-100 rounded-xl mb-10"><p className="text-slate-500 font-medium mb-2">Sensitivity modifiers are applied per market.</p><p className="text-slate-400 text-sm">Please select Portugal or UK from the market selector above to edit sensitivity variables.</p></div>)}\n            <div className="overflow-x-auto">`;
code = code.replace(wrongString, '</div>\n            <div className="overflow-x-auto">');

// Now, replace the correct one. The correct one is right after the Advertisement & Promotion range button.
// Let's use a more specific regex for the end.
const regex = /<RangeWithButtons min="-50" max="50" value=\{\(currentMods\?\.marketing \|\| 0\)\} onChange=\{\(e: any\) => handleModChange\('marketing', Number\(e\.target\.value\)\)\} \/>\s*<\/div>\s*<\/div>\s*<div className="overflow-x-auto">/;
const replacement = `<RangeWithButtons min="-50" max="50" value={(currentMods?.marketing || 0)} onChange={(e: any) => handleModChange('marketing', Number(e.target.value))} />
              </div>
            </div>) : (<div className="flex flex-col items-center justify-center p-12 bg-slate-50 border border-slate-100 rounded-xl mb-10"><p className="text-slate-500 font-medium mb-2">Sensitivity modifiers are applied per market.</p><p className="text-slate-400 text-sm">Please select Portugal or UK from the market selector above to edit sensitivity variables.</p></div>)}
            <div className="overflow-x-auto">`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed wrapper undo');
