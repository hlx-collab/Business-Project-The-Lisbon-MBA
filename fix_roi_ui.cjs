const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /Return on Investment \(ROI\)/g,
  `Average Annual ROI`
);
code = code.replace(
  /'ROI'/g,
  `'Average Annual ROI'`
);
code = code.replace(
  /ROI \(\%\)/g,
  `Average Annual ROI (%)`
);
code = code.replace(
  /ROI:/g,
  `Average Annual ROI:`
);

fs.writeFileSync('src/App.tsx', code);
