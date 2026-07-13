const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetOpen = '<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">';
const idx = code.indexOf(targetOpen);

if (idx > -1) {
  // Let's find the closing tag.
  // Actually, I can just replace `targetOpen` with `{currentMods ? (<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">`
  // and then replace `</div>\n            <div className="overflow-x-auto">` with `</div>) : (<div className="flex flex-col items-center justify-center p-12 bg-slate-50 border border-slate-100 rounded-xl mb-10"><p className="text-slate-500 font-medium mb-2">Sensitivity modifiers are applied per market.</p><p className="text-slate-400 text-sm">Please select Portugal or UK from the market selector above to edit sensitivity variables.</p></div>)}\n            <div className="overflow-x-auto">`
  code = code.replace(targetOpen, '{currentMods ? (' + targetOpen);
  code = code.replace(/<\/div>\s*<div className="overflow-x-auto">/, '</div>) : (<div className="flex flex-col items-center justify-center p-12 bg-slate-50 border border-slate-100 rounded-xl mb-10"><p className="text-slate-500 font-medium mb-2">Sensitivity modifiers are applied per market.</p><p className="text-slate-400 text-sm">Please select Portugal or UK from the market selector above to edit sensitivity variables.</p></div>)}\n            <div className="overflow-x-auto">');
  
  fs.writeFileSync('src/App.tsx', code);
  console.log('Fixed wrapper');
} else {
  console.log('Target not found');
}
