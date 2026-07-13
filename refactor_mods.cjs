const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Update the useState initial value
code = code.replace(/const \[sensitivityMods, setSensitivityMods\] = useState\(\{[\s\S]*?marketing: 0\n  \}\);/, `const [sensitivityMods, setSensitivityMods] = useState({
    wacc: 0,
    Portugal: {
      newOwners: 0,
      newProviders: 0,
      ownerChurn: [0, 0, 0, 0, 0],
      providerChurn: [0, 0, 0, 0, 0],
      avgPricePerBooking: 0,
      commission: 0,
      subscriptionFee: 0,
      yearlyBookings: 0,
      itRnD: 0,
      marketing: 0
    },
    UK: {
      newOwners: 0,
      newProviders: 0,
      ownerChurn: [0, 0, 0, 0, 0],
      providerChurn: [0, 0, 0, 0, 0],
      avgPricePerBooking: 0,
      commission: 0,
      subscriptionFee: 0,
      yearlyBookings: 0,
      itRnD: 0,
      marketing: 0
    }
  });`);

fs.writeFileSync('src/App.tsx', code);
console.log('Done 1');
