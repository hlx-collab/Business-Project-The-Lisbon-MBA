const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /equityInjection\[2\] = 1600000;/g,
  `equityInjection[2] = 1800000;`
);

code = code.replace(
  /if \(market === 'UK'\) \{\n\s*if \(y === 2\) return 1600000;/g,
  `if (market === 'UK') {\n            if (y === 2) return 1800000;`
);

fs.writeFileSync('src/App.tsx', code);
