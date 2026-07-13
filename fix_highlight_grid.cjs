const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const broken = `<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              </div>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Operating Profit</h3>`;
                
const fixed = `<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Operating Profit</h3>`;
                
code = code.replace(broken, fixed);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed highlight grid');
