const fs = require('fs');
let code = fs.readFileSync('tester_new.ts', 'utf8');
code = code.replace('  });\n\n  useEffect(() => {', '');
code = code.replace(/  \}\);\s*$/m, '');
code = code.replace(/\}\);\s*$/m, '');

// just replacing the last });
const lines = code.split('\n');
const idx = lines.findIndex(l => l.includes('return { Portugal: defaultMarketData('));
// we want to remove lines after 149
code = lines.slice(0, idx + 1).join('\n') + '\n\n' + lines.slice(idx + 5).join('\n'); // skip }); useEffect etc

fs.writeFileSync('tester_fixed.ts', code);
