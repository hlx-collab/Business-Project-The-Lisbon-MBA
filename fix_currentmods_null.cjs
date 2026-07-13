const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/currentMods\.ownerChurn/g, 'currentMods?.ownerChurn');
code = code.replace(/currentMods\.providerChurn/g, 'currentMods?.providerChurn');

// Note: other fields were replaced using: code.replace(new RegExp(`sensitivityMods\\.${key}`, 'g'), `(currentMods?.${key} ?? 0)`);
// Wait! Let's check what happened to the text spans like `className={currentMods.newOwners > 0 ...`

code = code.replace(/currentMods\.newOwners/g, '(currentMods?.newOwners || 0)');
code = code.replace(/currentMods\.newProviders/g, '(currentMods?.newProviders || 0)');
code = code.replace(/currentMods\.itRnD/g, '(currentMods?.itRnD || 0)');
code = code.replace(/currentMods\.marketing/g, '(currentMods?.marketing || 0)');

// Also handleModChange must be used for ownerChurn and providerChurn!
// Because currently it's doing: setSensitivityMods({...sensitivityMods, ownerChurn: newVal});
// Let's replace those with handleModChange
code = code.replace(/setSensitivityMods\(\{\.\.\.sensitivityMods, ownerChurn: newVal\}\);/g, "handleModChange('ownerChurn', newVal);");
code = code.replace(/setSensitivityMods\(\{\.\.\.sensitivityMods, providerChurn: newVal\}\);/g, "handleModChange('providerChurn', newVal);");

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed currentMods safe access');
