const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove the misplaced definitions from computeAllFinancials
const badDefs = `  const currentMods = activeMarket === 'Aggregated' ? null : sensitivityMods[activeMarket as 'Portugal' | 'UK'];
  const handleModChange = (key: string, value: any) => {
    if (!currentMods) return;
    setSensitivityMods({
      ...sensitivityMods,
      [activeMarket]: {
        ...sensitivityMods[activeMarket as 'Portugal' | 'UK'],
        [key]: value
      }
    });
  };`;
code = code.replace(badDefs, '');

// 2. Put them in the App component, right after `const [sensitivityMods, setSensitivityMods] = useState(...)`
const target = `const providerAnalysisRef = useRef<HTMLDivElement>(null);`;
const goodDefs = `const currentMods = activeMarket === 'Aggregated' ? null : sensitivityMods[activeMarket as 'Portugal' | 'UK'];
  const handleModChange = (key: string, value: any) => {
    if (!currentMods) return;
    setSensitivityMods({
      ...sensitivityMods,
      [activeMarket]: {
        ...sensitivityMods[activeMarket as 'Portugal' | 'UK'],
        [key]: value
      }
    });
  };

  const providerAnalysisRef = useRef<HTMLDivElement>(null);`;
code = code.replace(target, goodDefs);

// 3. Fix exportToExcel. It was using currentMods, but it should use exportMods!
const exportRegex = /sensSheet\.addRow\(\['New Owners Added', currentMods\.newOwners\]\);/g;
// Wait, I can just redefine exportMods as currentMods inside exportToExcel, BUT it loops over markets!
// So it should be defined inside the export!
// Wait, no, the sensitivity sheet is just a single sheet.
// In exportToExcel:
const oldExportDef = `const exportMods = activeMarket === 'Aggregated' ? sensitivityMods.Portugal : sensitivityMods[activeMarket as 'Portugal' | 'UK'];`;
const newExportDef = `const exportMods = activeMarket === 'Aggregated' ? sensitivityMods.Portugal : sensitivityMods[activeMarket as 'Portugal' | 'UK'];
    const currentMods = exportMods; // alias for the sheet rows`;
code = code.replace(oldExportDef, newExportDef);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed scoping issues');
