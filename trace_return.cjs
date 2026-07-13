const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');

const returnBody = code.substring(code.indexOf('return ('));
let depth = 0;
const lines = returnBody.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  depth += opens - closes;
  if (depth < 0) {
    console.log('Negative depth at line in return', i + 1, ':', line);
    break; // stop at first negative
  }
}
