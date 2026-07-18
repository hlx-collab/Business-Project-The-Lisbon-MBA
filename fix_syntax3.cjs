const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `Target: > 3.0x`,
  `Target: &gt; 3.0x`
);

fs.writeFileSync('src/App.tsx', code);
