const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
let openCount = (code.match(/<div/g) || []).length;
let closeCount = (code.match(/<\/div>/g) || []).length;
console.log('Open:', openCount, 'Close:', closeCount);
