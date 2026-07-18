const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace('console.log("SIMULATION_RESULTS_START\\n" + out + "SIMULATION_RESULTS_END");', 
  'fetch("http://localhost:3001", { method: "POST", body: out }).catch(e=>console.log(e));');
fs.writeFileSync('src/App.tsx', code);
