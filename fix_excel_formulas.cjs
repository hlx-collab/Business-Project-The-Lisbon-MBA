const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /if \(market === 'Consolidated'\) \{\s*years\.forEach\(y => \{\s*const col = getColLetter\(2 \+ y\);\s*const getUkFxMulti = \(c: string\) => fxRateIdxInUnion >= 0 \? \`'UK'!\$\{c\}\$\{platformStartRowIdx \+ fxRateIdxInUnion \+ 1\}\` : "1";\s*rowData\.push\(\{ formula: \`'Portugal'!\$\{col\}\$\{currentRow \+ 1\} \+ \('UK'!\$\{col\}\$\{currentRow \+ 1\} \* \$\{getUkFxMulti\(col\)\}\)\` \}\);\s*\}\);\s*\} else if \(name === 'Monthly Subscriptions'\) \{/g,
  `const streamId = ptFin.derivedRevenueStreams.find(s => s.name === name)?.id || ukFin.derivedRevenueStreams.find(s => s.name === name)?.id;
        if (market === 'Consolidated') {
          years.forEach(y => {
            const col = getColLetter(2 + y);
            const getUkFxMulti = (c: string) => fxRateIdxInUnion >= 0 ? \`'UK'!\${c}\${platformStartRowIdx + fxRateIdxInUnion + 1}\` : "1";
            rowData.push({ formula: \`'Portugal'!\${col}\${currentRow + 1} + ('UK'!\${col}\${currentRow + 1} * \${getUkFxMulti(col)})\` });
          });
        } else if (streamId === 'rev-1' || name === 'Monthly Subscriptions') {`
);

code = code.replace(
  /\} else if \(name === 'Booking Fees'\) \{/g,
  `} else if (streamId === 'rev-2' || name === 'Booking Fees') {`
);

fs.writeFileSync('src/App.tsx', code);
