const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const calcStr = `
  const { providerCAC, ownerCAC, blendedCAC, providerCLV, ownerCLV, blendedCLV, clvCacRatio } = React.useMemo(() => {
    const getStream = (arr, id, name) => arr.find(s => s.id === id || s.name === name)?.amounts || [0,0,0,0,0];
    
    const newProviders = getStream(platformMetricsStreams, 'pm-new-providers', 'New providers added');
    const newOwners = getStream(platformMetricsStreams, 'pm-new-owners', 'New owners added');
    const mktgSpend = getStream(derivedFixedCostsStreams, 'fc-3', 'Advertisement & Promotion');
    const varCac = getStream(derivedVariableCostsStreams, 'vc-3', 'Customer acquisition costs');
    
    let totalAcqCost = 0;
    let totalNewP = 0;
    let totalNewO = 0;
    
    for (let i = 0; i < 5; i++) {
      totalAcqCost += (Number(mktgSpend[i]) || 0) + (Number(varCac[i]) || 0);
      totalNewP += Number(newProviders[i]) || 0;
      totalNewO += Number(newOwners[i]) || 0;
    }
    
    const blendedCAC = (totalNewP + totalNewO) > 0 ? totalAcqCost / (totalNewP + totalNewO) : 0;
    
    const unitCacP = getStream(platformMetricsStreams, 'pm-cac-providers', 'Unit CAC - Providers');
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
    const blendedCLV = blendedGMPerUser * blendedLifetime;

    return { 
      providerCAC: actualProviderCAC, 
      ownerCAC: actualOwnerCAC, 
      blendedCAC, 
      providerCLV, 
      ownerCLV, 
      blendedCLV,
      clvCacRatio: blendedCAC > 0 ? blendedCLV / blendedCAC : 0
    };
  }, [platformMetricsStreams, derivedFixedCostsStreams, derivedVariableCostsStreams, derivedRevenueStreams]);
`;

code = code.replace(
  /const getBookingsTotal = \(marketCode: 'Portugal' | 'UK', adjustedDerived\?: any\) => \{/,
  calcStr + '\n  const getBookingsTotal = (marketCode: \'Portugal\' | \'UK\', adjustedDerived?: any) => {'
);

const jsxStr = `              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Blended CLV</h3>
                <div className="flex items-baseline space-x-3">
                  <span className="text-3xl font-bold text-slate-800">
                    {formatCurrency(blendedCLV)}
                  </span>
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Blended CAC</h3>
                <div className="flex items-baseline space-x-3">
                  <span className="text-3xl font-bold text-slate-800">
                    {formatCurrency(blendedCAC)}
                  </span>
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">CLV:CAC Ratio</h3>
                <div className="flex items-baseline space-x-3">
                  <span className={\`text-3xl font-bold \${clvCacRatio >= 3 ? 'text-emerald-600' : clvCacRatio >= 1 ? 'text-indigo-600' : 'text-red-600'}\`}>
                    {clvCacRatio.toFixed(1)}x
                  </span>
                  <span className="text-sm font-medium text-slate-500">Target: > 3.0x</span>
                </div>
              </div>`;

code = code.replace(
  /              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">\s*<h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Return on Investment \(ROI\)<\/h3>/,
  jsxStr + '\n              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">\n                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Return on Investment (ROI)</h3>'
);

fs.writeFileSync('src/App.tsx', code);
