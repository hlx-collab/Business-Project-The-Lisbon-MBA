const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `<div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold text-slate-900 rounded-tl-lg">Modified P&L</th>`;

const replacement = `<div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">NPV</span>
                <span className="text-lg font-bold text-slate-900">{formatCurrency(sensitivityData.metrics.npv)}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">IRR</span>
                <span className="text-lg font-bold text-slate-900">{sensitivityData.metrics.irr !== null ? (sensitivityData.metrics.irr * 100).toFixed(1) + '%' : 'N/A'}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">ROI</span>
                <span className="text-lg font-bold text-slate-900">{(sensitivityData.metrics.roi * 100).toFixed(1)}%</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Payback Period</span>
                <span className="text-lg font-bold text-slate-900">{sensitivityData.metrics.paybackPeriod !== null ? sensitivityData.metrics.paybackPeriod.toFixed(1) + ' Yrs' : '> 5 Yrs'}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Discounted Payback</span>
                <span className="text-lg font-bold text-slate-900">{sensitivityData.metrics.discountedPaybackPeriod !== null ? sensitivityData.metrics.discountedPaybackPeriod.toFixed(1) + ' Yrs' : '> 5 Yrs'}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold text-slate-900 rounded-tl-lg">Modified P&L</th>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
