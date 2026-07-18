const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /const bfIndex = revenueUnion\.indexOf\('Booking Fees'\);\s*const bfRef = bfIndex >= 0 \? getCellRef\(2 \+ y, revenueStartRowIdx \+ bfIndex\) : '0';\s*return \{ formula: \`\$\{getCellRef\(2 \+ y, revenueTotalRowIdx\)\}-\$\{bfRef\}\+\$\{getCellRef\(2 \+ y, bookVolRowIdx\)\}\` \};/g,
  `const bfNames = Array.from(new Set([
            markets.Portugal.revenueStreams.find(s => s.id === 'rev-2')?.name,
            markets.UK.revenueStreams.find(s => s.id === 'rev-2')?.name
          ])).filter(Boolean) as string[];
          const bfRefs = bfNames.map(name => {
            const idx = revenueUnion.indexOf(name);
            return idx >= 0 ? getCellRef(2 + y, revenueStartRowIdx + idx) : '0';
          }).filter(ref => ref !== '0');
          const bfRefStr = bfRefs.length > 0 ? bfRefs.join('-') : '0';
          return { formula: \`\${getCellRef(2 + y, revenueTotalRowIdx)}-\${bfRefStr}+\${getCellRef(2 + y, bookVolRowIdx)}\` };`
);

fs.writeFileSync('src/App.tsx', code);
