const netIncome = [-100, -50, 50, 100, 200];
const investment = 150;
const totalNetIncome = netIncome.reduce((a, b) => a + b, 0); // 200
const totalROI = totalNetIncome / investment; // 200 / 150 = 1.33 (133%)
const annualizedROI = Math.pow((totalNetIncome + investment) / investment, 1/5) - 1; // (350 / 150)^0.2 - 1 = 18.4%
console.log({ totalROI, annualizedROI });
