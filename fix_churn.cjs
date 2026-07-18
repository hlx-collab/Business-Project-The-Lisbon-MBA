const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  /'Provider Churn': getVal\('Provider churn rate \(%\)'\),/,
  `'Provider Churn': getVal('Provider churn rate (%)') === 0 ? null : getVal('Provider churn rate (%)'),`
);
code = code.replace(
  /'Owner Churn': getVal\('Owner churn rate \(%\)'\),/,
  `'Owner Churn': getVal('Owner churn rate (%)') === 0 ? null : getVal('Owner churn rate (%)'),`
);
fs.writeFileSync('src/App.tsx', code);
