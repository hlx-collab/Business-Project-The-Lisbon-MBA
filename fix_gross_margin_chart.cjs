const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target4 = `                  <BarChart
                    data={years.map(y => ({
                      name: \`Year \${y + 1}\`,
                      margin: Number(grossMarginPercentByYear[y].toFixed(1))
                    }))}
                    margin={{ top: 30, right: 10, left: 10, bottom: 0 }}`;

const replace4 = `                  <BarChart
                    data={React.useMemo(() => years.map(y => ({
                      name: \`Year \${y + 1}\`,
                      margin: Number(grossMarginPercentByYear[y].toFixed(1))
                    })), [grossMarginPercentByYear])}
                    margin={{ top: 30, right: 10, left: 10, bottom: 0 }}`;

code = code.replace(target4, replace4);
fs.writeFileSync('src/App.tsx', code);
