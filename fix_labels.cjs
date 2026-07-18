const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// For Provider and Owner labels
code = code.replace(
  /<Line type="monotone" dataKey="Total Providers" stroke="#0ea5e9" strokeWidth=\{3\} dot=\{\{ r: 4 \}\} activeDot=\{\{ r: 6 \}\} label=\{\{ position: 'top', fill: '#0ea5e9', fontSize: 10, fontWeight: 500, formatter: \(val: any\) => val != null \? new Intl\.NumberFormat\('en-US'\)\.format\(Math\.round\(val\)\) : '' \}\} \/>/g,
  `<Line type="monotone" dataKey="Total Providers" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} label={{ position: 'top', fill: '#0ea5e9', fontSize: 12, fontWeight: 500, formatter: (val: any) => val != null ? new Intl.NumberFormat('en-US').format(Math.round(val)) : '' }} />`
);
code = code.replace(
  /<Line type="monotone" dataKey="New Providers" stroke="#7dd3fc" strokeWidth=\{2\} strokeDasharray="5 5" dot=\{\{ r: 3 \}\} label=\{\{ position: 'bottom', fill: '#7dd3fc', fontSize: 10, fontWeight: 500, formatter: \(val: any\) => val != null \? new Intl\.NumberFormat\('en-US'\)\.format\(Math\.round\(val\)\) : '' \}\} \/>/g,
  `<Line type="monotone" dataKey="New Providers" stroke="#7dd3fc" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} label={{ position: 'bottom', fill: '#7dd3fc', fontSize: 12, fontWeight: 500, formatter: (val: any) => val != null ? new Intl.NumberFormat('en-US').format(Math.round(val)) : '' }} />`
);
code = code.replace(
  /<Line type="monotone" dataKey="Total Owners" stroke="#10b981" strokeWidth=\{3\} dot=\{\{ r: 4 \}\} activeDot=\{\{ r: 6 \}\} label=\{\{ position: 'top', fill: '#10b981', fontSize: 10, fontWeight: 500, formatter: \(val: any\) => val != null \? new Intl\.NumberFormat\('en-US'\)\.format\(Math\.round\(val\)\) : '' \}\} \/>/g,
  `<Line type="monotone" dataKey="Total Owners" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} label={{ position: 'top', fill: '#10b981', fontSize: 12, fontWeight: 500, formatter: (val: any) => val != null ? new Intl.NumberFormat('en-US').format(Math.round(val)) : '' }} />`
);
code = code.replace(
  /<Line type="monotone" dataKey="New Owners" stroke="#6ee7b7" strokeWidth=\{2\} strokeDasharray="5 5" dot=\{\{ r: 3 \}\} label=\{\{ position: 'bottom', fill: '#6ee7b7', fontSize: 10, fontWeight: 500, formatter: \(val: any\) => val != null \? new Intl\.NumberFormat\('en-US'\)\.format\(Math\.round\(val\)\) : '' \}\} \/>/g,
  `<Line type="monotone" dataKey="New Owners" stroke="#6ee7b7" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} label={{ position: 'bottom', fill: '#6ee7b7', fontSize: 12, fontWeight: 500, formatter: (val: any) => val != null ? new Intl.NumberFormat('en-US').format(Math.round(val)) : '' }} />`
);

fs.writeFileSync('src/App.tsx', code);
