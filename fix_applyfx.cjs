const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldCode = `              amounts: s.amounts.map((v, y) => {
                const num = Number(v);
                return isNaN(num) ? v : Number((num * getFxRate(y)).toFixed(2));
              })`;

const newCode = `              amounts: s.amounts.map((v, y) => {
                if (v === '') return '';
                const num = Number(v);
                return isNaN(num) ? v : Number((num * getFxRate(y)).toFixed(2));
              })`;

if (code.includes(oldCode)) {
  code = code.replace(oldCode, newCode);
  fs.writeFileSync('src/App.tsx', code);
  console.log('Fixed applyFxToUkFin');
} else {
  console.log('Could not find applyFxToUkFin pattern');
}
