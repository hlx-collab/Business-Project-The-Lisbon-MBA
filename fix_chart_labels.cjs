const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Fix fontSize 24 -> 20
code = code.replace(/fontSize: 24/g, 'fontSize: 20');

// Fix margins for the main charts
code = code.replace(/margin=\{\{ top: 20, right: 30, left: 10, bottom: 5 \}\}/g, 'margin={{ top: 20, right: 50, left: 10, bottom: 5 }}');

fs.writeFileSync('src/App.tsx', code);
console.log("Done");
