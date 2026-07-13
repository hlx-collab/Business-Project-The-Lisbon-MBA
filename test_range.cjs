const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');
const matches = code.match(/<input\s+type="range"[\s\S]*?\/>/g);
console.log(matches.join('\n\n'));
