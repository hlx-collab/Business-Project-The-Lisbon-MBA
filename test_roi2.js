const totalNetIncome = 5000000;
const totalInvestment = 1100000;
const finalValue = totalNetIncome + totalInvestment;
const cagr = Math.pow(finalValue / totalInvestment, 1 / 5) - 1;
console.log('CAGR:', cagr);
