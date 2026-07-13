const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const prefix = code.substring(0, code.indexOf('return ('));
const returnBody = code.substring(code.indexOf('return ('));
let depth = 0;
const lines = returnBody.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  depth += opens - closes;
  if (depth < 0) {
    console.log('Removing extra </div> at return line', i + 1);
    lines[i] = lines[i].replace(/<\/div>/, ''); // remove one </div>
    depth++;
  }
}

fs.writeFileSync('src/App.tsx', prefix + lines.join('\n'));
