const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldTaxes = `    const TAX_RATE = 0.21;

    let accumulatedLoss = 0;
    const netIncomeByYear: number[] = [];
    const taxByYear: number[] = [];

    for (let i = 0; i < 5; i++) {
        const ebit = opProfitByYear[i];
        if (ebit < 0) {
            taxByYear[i] = 0;
            accumulatedLoss += Math.abs(ebit);
            netIncomeByYear[i] = ebit;
        } else {
            let taxableIncome = 0;
            if (accumulatedLoss > 0) {
                if (ebit <= accumulatedLoss) {
                    taxableIncome = 0;
                    accumulatedLoss -= ebit;
                } else {
                    taxableIncome = ebit - accumulatedLoss;
                    accumulatedLoss = 0;
                }
            } else {
                taxableIncome = ebit;
            }
            const tax = taxableIncome * TAX_RATE;
            taxByYear[i] = tax;
            netIncomeByYear[i] = ebit - tax;
        }
    }`;

const newTaxes = `    const taxByYear: number[] = years.map(i => ptFin.taxByYear[i] + ukFin.taxByYear[i]);
    const netIncomeByYear: number[] = years.map(i => ptFin.netIncomeByYear[i] + ukFin.netIncomeByYear[i]);`;

code = code.replace(oldTaxes, newTaxes);

fs.writeFileSync('src/App.tsx', code);
