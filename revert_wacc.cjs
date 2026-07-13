const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/0\.137/g, '0.173');
code = code.replace(/13\.7/g, '17.3');

fs.writeFileSync('src/App.tsx', code);
console.log('Reverted WACC to 17.3%');
