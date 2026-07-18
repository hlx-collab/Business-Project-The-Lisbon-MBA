const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<LabelList dataKey="Number of Bookings" position="top" fill="#8b5cf6" fontSize=\{10\} fontWeight=\{500\} formatter=\{\(val: number\) => val != null \? \`\\\$\{\(val \/ 1000\)\.toFixed\(1\)\}k\` : ''\} \/>/g,
  `<LabelList dataKey="Number of Bookings" position="top" fill="#8b5cf6" fontSize={12} fontWeight={500} formatter={(val: number) => val != null ? \`\${(val / 1000).toFixed(1)}k\` : ''} />`
);

fs.writeFileSync('src/App.tsx', code);
