const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `    const unitCacP = getStream(platformMetricsStreams, 'pm-cac-providers', 'Unit CAC - Providers');
    const unitCacO = getStream(platformMetricsStreams, 'pm-cac-owners', 'Unit CAC - Owners');
    const avgProviderCAC = (unitCacP.reduce((a,b)=>a+(Number(b)||0),0)/5);
    const avgOwnerCAC = (unitCacO.reduce((a,b)=>a+(Number(b)||0),0)/5);
    
    const totalNewUsers = totalNewP + totalNewO;
    const providerShare = totalNewUsers > 0 ? totalNewP / totalNewUsers : 0.5;
    const ownerShare = totalNewUsers > 0 ? totalNewO / totalNewUsers : 0.5;
    
    const totalMktgSpend = mktgSpend.reduce((a,b)=>a+(Number(b)||0),0);
    const actualProviderCAC = avgProviderCAC + (totalNewP > 0 ? (totalMktgSpend * providerShare) / totalNewP : 0);
    const actualOwnerCAC = avgOwnerCAC + (totalNewO > 0 ? (totalMktgSpend * ownerShare) / totalNewO : 0);

    const subRev = getStream(derivedRevenueStreams, 'rev-1', 'Monthly Subscriptions');
    const bookRev = getStream(derivedRevenueStreams, 'rev-2', 'Booking Fees');
    
    const totalSubRev = subRev.reduce((a,b)=>a+(Number(b)||0),0);
    const totalBookRev = bookRev.reduce((a,b)=>a+(Number(b)||0),0);
    
    const paymentProc = getStream(derivedVariableCostsStreams, 'vc-1', 'Payment Processing');
    const custSupport = getStream(derivedVariableCostsStreams, 'vc-2', 'Customer Support');
    const serverCost = getStream(derivedVariableCostsStreams, 'vc-4', 'Server/Hosting (AWS/GCP)');
    
    const totalVarCostsNoCac = paymentProc.reduce((a,b)=>a+(Number(b)||0),0) + 
                               custSupport.reduce((a,b)=>a+(Number(b)||0),0) + 
                               serverCost.reduce((a,b)=>a+(Number(b)||0),0);
                               
    const revShareProvider = (totalSubRev + totalBookRev) > 0 ? totalSubRev / (totalSubRev + totalBookRev) : 0.5;
    const revShareOwner = (totalSubRev + totalBookRev) > 0 ? totalBookRev / (totalSubRev + totalBookRev) : 0.5;
    
    const providerGrossMargin = totalSubRev - (totalVarCostsNoCac * revShareProvider);
    const ownerGrossMargin = totalBookRev - (totalVarCostsNoCac * revShareOwner);
    
    const totalActiveProviders = getStream(platformMetricsStreams, 'pm-1', 'Number of providers in the platform').reduce((a,b)=>a+(Number(b)||0),0);
    const totalActiveOwners = getStream(platformMetricsStreams, 'pm-2', 'Number of owners in the platform').reduce((a,b)=>a+(Number(b)||0),0);
    
    const gmPerProviderPerYear = totalActiveProviders > 0 ? providerGrossMargin / totalActiveProviders : 0;
    const gmPerOwnerPerYear = totalActiveOwners > 0 ? ownerGrossMargin / totalActiveOwners : 0;
    
    const providerChurn = getStream(platformMetricsStreams, 'pm-churn-providers', 'Provider churn rate (%)');
    const ownerChurn = getStream(platformMetricsStreams, 'pm-churn-owners', 'Owner churn rate (%)');
    const avgProviderChurn = (providerChurn.reduce((a,b)=>a+(Number(b)||0),0)/5) / 100;
    const avgOwnerChurn = (ownerChurn.reduce((a,b)=>a+(Number(b)||0),0)/5) / 100;
    
    const providerLifetime = avgProviderChurn > 0 ? 1 / avgProviderChurn : 0;
    const ownerLifetime = avgOwnerChurn > 0 ? 1 / avgOwnerChurn : 0;
    
    const providerCLV = gmPerProviderPerYear * providerLifetime;
    const ownerCLV = gmPerOwnerPerYear * ownerLifetime;
    
    const totalGrossMargin = providerGrossMargin + ownerGrossMargin;
    const blendedGMPerUser = (totalActiveProviders + totalActiveOwners) > 0 ? totalGrossMargin / (totalActiveProviders + totalActiveOwners) : 0;
    const blendedChurn = (totalActiveProviders + totalActiveOwners) > 0 ? (avgProviderChurn * totalActiveProviders + avgOwnerChurn * totalActiveOwners) / (totalActiveProviders + totalActiveOwners) : 0.2;
    const blendedLifetime = blendedChurn > 0 ? 1 / blendedChurn : 0;
    const blendedCLV = blendedGMPerUser * blendedLifetime;`;

const replacement = `    const unitCacP = getStream(platformMetricsStreams, 'pm-cac-providers', 'Unit CAC - Providers');
    const unitCacO = getStream(platformMetricsStreams, 'pm-cac-owners', 'Unit CAC - Owners');
    
    let totalVarCacP = 0;
    let totalVarCacO = 0;
    for (let i = 0; i < 5; i++) {
      totalVarCacP += (Number(newProviders[i]) || 0) * (Number(unitCacP[i]) || 0);
      totalVarCacO += (Number(newOwners[i]) || 0) * (Number(unitCacO[i]) || 0);
    }
    
    const totalNewUsers = totalNewP + totalNewO;
    const totalMktgSpend = mktgSpend.reduce((a,b)=>a+(Number(b)||0),0);
    
    // Allocate fixed marketing spend proportionally to the number of acquired users
    const providerMktgSpend = totalNewUsers > 0 ? totalMktgSpend * (totalNewP / totalNewUsers) : totalMktgSpend * 0.5;
    const ownerMktgSpend = totalNewUsers > 0 ? totalMktgSpend * (totalNewO / totalNewUsers) : totalMktgSpend * 0.5;

    const actualProviderCAC = totalNewP > 0 ? (totalVarCacP + providerMktgSpend) / totalNewP : 0;
    const actualOwnerCAC = totalNewO > 0 ? (totalVarCacO + ownerMktgSpend) / totalNewO : 0;

    const subRev = getStream(derivedRevenueStreams, 'rev-1', 'Monthly Subscriptions');
    const bookRev = getStream(derivedRevenueStreams, 'rev-2', 'Booking Fees');
    
    const totalSubRev = subRev.reduce((a,b)=>a+(Number(b)||0),0);
    const totalBookRev = bookRev.reduce((a,b)=>a+(Number(b)||0),0);
    
    const paymentProc = getStream(derivedVariableCostsStreams, 'vc-1', 'Payment Processing');
    const custSupport = getStream(derivedVariableCostsStreams, 'vc-2', 'Customer Support');
    const serverCost = getStream(derivedVariableCostsStreams, 'vc-4', 'Server/Hosting (AWS/GCP)');
    
    const totalVarCostsNoCac = paymentProc.reduce((a,b)=>a+(Number(b)||0),0) + 
                               custSupport.reduce((a,b)=>a+(Number(b)||0),0) + 
                               serverCost.reduce((a,b)=>a+(Number(b)||0),0);
                               
    const revShareProvider = (totalSubRev + totalBookRev) > 0 ? totalSubRev / (totalSubRev + totalBookRev) : 0.5;
    const revShareOwner = (totalSubRev + totalBookRev) > 0 ? totalBookRev / (totalSubRev + totalBookRev) : 0.5;
    
    const providerGrossMargin = totalSubRev - (totalVarCostsNoCac * revShareProvider);
    const ownerGrossMargin = totalBookRev - (totalVarCostsNoCac * revShareOwner);
    
    const activeProvidersArr = getStream(platformMetricsStreams, 'pm-1', 'Number of providers in the platform');
    const activeOwnersArr = getStream(platformMetricsStreams, 'pm-2', 'Number of owners in the platform');
    const totalActiveProviders = activeProvidersArr.reduce((a,b)=>a+(Number(b)||0),0);
    const totalActiveOwners = activeOwnersArr.reduce((a,b)=>a+(Number(b)||0),0);
    
    const gmPerProviderPerYear = totalActiveProviders > 0 ? providerGrossMargin / totalActiveProviders : 0;
    const gmPerOwnerPerYear = totalActiveOwners > 0 ? ownerGrossMargin / totalActiveOwners : 0;
    
    const providerChurn = getStream(platformMetricsStreams, 'pm-churn-providers', 'Provider churn rate (%)');
    const ownerChurn = getStream(platformMetricsStreams, 'pm-churn-owners', 'Owner churn rate (%)');
    
    // Weight churn rates by active users each year
    let weightedProviderChurnSum = 0;
    let weightedOwnerChurnSum = 0;
    for (let i = 0; i < 5; i++) {
        weightedProviderChurnSum += (Number(providerChurn[i]) || 0) * (Number(activeProvidersArr[i]) || 0);
        weightedOwnerChurnSum += (Number(ownerChurn[i]) || 0) * (Number(activeOwnersArr[i]) || 0);
    }
    const avgProviderChurn = totalActiveProviders > 0 ? (weightedProviderChurnSum / totalActiveProviders) / 100 : 0.2;
    const avgOwnerChurn = totalActiveOwners > 0 ? (weightedOwnerChurnSum / totalActiveOwners) / 100 : 0.2;
    
    const providerLifetime = avgProviderChurn > 0 ? 1 / avgProviderChurn : 0;
    const ownerLifetime = avgOwnerChurn > 0 ? 1 / avgOwnerChurn : 0;
    
    const providerCLV = gmPerProviderPerYear * providerLifetime;
    const ownerCLV = gmPerOwnerPerYear * ownerLifetime;
    
    // Weight blended CLV by new acquisitions since it reflects the value of acquiring a new user
    const blendedCLV = totalNewUsers > 0 ? ((providerCLV * totalNewP) + (ownerCLV * totalNewO)) / totalNewUsers : 0;`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Replaced successfully!");
} else {
  console.log("Could not find target block.");
}
