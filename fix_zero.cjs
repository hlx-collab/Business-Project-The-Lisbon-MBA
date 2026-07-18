const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /'New Providers': getVal\('New providers added'\),/,
  `'New Providers': getVal('New providers added') === 0 ? null : getVal('New providers added'),`
);
code = code.replace(
  /'Total Providers': getVal\('Number of providers in the platform'\),/,
  `'Total Providers': getVal('Number of providers in the platform') === 0 ? null : getVal('Number of providers in the platform'),`
);
code = code.replace(
  /'New Owners': getVal\('New owners added'\),/,
  `'New Owners': getVal('New owners added') === 0 ? null : getVal('New owners added'),`
);
code = code.replace(
  /'Total Owners': getVal\('Number of owners in the platform'\),/,
  `'Total Owners': getVal('Number of owners in the platform') === 0 ? null : getVal('Number of owners in the platform'),`
);
code = code.replace(
  /'Number of Bookings': getVal\('Number of owners in the platform'\) \* getVal\('# of yearly bookings per pet owners'\),/,
  `'Number of Bookings': (getVal('Number of owners in the platform') * getVal('# of yearly bookings per pet owners')) === 0 ? null : (getVal('Number of owners in the platform') * getVal('# of yearly bookings per pet owners')),`
);

fs.writeFileSync('src/App.tsx', code);
