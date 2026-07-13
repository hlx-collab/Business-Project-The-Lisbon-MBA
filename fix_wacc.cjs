const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/0\.173/g, '0.137');
code = code.replace(/17\.3/g, '13.7');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed WACC to 13.7%');
