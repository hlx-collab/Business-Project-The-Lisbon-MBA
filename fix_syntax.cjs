const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The syntax error is: {currentMods && <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">}
// And later: </div>}

// First let's remove the broken conditional braces
code = code.replace(/\{currentMods && <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">}/g, '<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">');
code = code.replace(/<\/div>}\n              \{currentMods && <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">}/g, '</div>\n              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">');
code = code.replace(/<\/div>}\n\n              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">/g, '</div>\n\n              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed syntax error');
