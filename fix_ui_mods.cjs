const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `    sensSheet.addRow(['# of yearly bookings per pet owners', getBasePlatformMetric('# of yearly bookings per pet owners') + (currentMods?.yearlyBookings || 0)]);`;
const replacement1 = `    sensSheet.addRow(['# of yearly bookings per pet owners', getBasePlatformMetric('# of yearly bookings per pet owners') + (currentMods?.yearlyBookings || 0)]);
    sensSheet.addRow(['Unit Customer Support cost - Owners', getBasePlatformMetric('Unit Customer Support cost - Owners') + (currentMods?.unitCustomerSupportCostOwners || 0)]);`;
code = code.replace(target1, replacement1);

const target2 = `              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span># of Yearly Bookings per Owner</span>
                  <span className="text-indigo-600 font-bold">
                    {(getBasePlatformMetric('# of yearly bookings per pet owners') + (currentMods?.yearlyBookings || 0)).toFixed(1)}
                  </span>
                </label>
                <RangeWithButtons min={0} max={Math.max(10, getBasePlatformMetric('# of yearly bookings per pet owners') + 10)} step={0.5} value={getBasePlatformMetric('# of yearly bookings per pet owners') + (currentMods?.yearlyBookings || 0)} onChange={(e: any) => handleModChange('yearlyBookings', Number(e.target.value) - getBasePlatformMetric('# of yearly bookings per pet owners'))} />
              </div>`;

const replacement2 = `              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span># of Yearly Bookings per Owner</span>
                  <span className="text-indigo-600 font-bold">
                    {(getBasePlatformMetric('# of yearly bookings per pet owners') + (currentMods?.yearlyBookings || 0)).toFixed(1)}
                  </span>
                </label>
                <RangeWithButtons min={0} max={Math.max(10, getBasePlatformMetric('# of yearly bookings per pet owners') + 10)} step={0.5} value={getBasePlatformMetric('# of yearly bookings per pet owners') + (currentMods?.yearlyBookings || 0)} onChange={(e: any) => handleModChange('yearlyBookings', Number(e.target.value) - getBasePlatformMetric('# of yearly bookings per pet owners'))} />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span>Unit Customer Support cost - Owners</span>
                  <span className="text-indigo-600 font-bold">
                    {formatCurrency(getBasePlatformMetric('Unit Customer Support cost - Owners') + (currentMods?.unitCustomerSupportCostOwners || 0))}
                  </span>
                </label>
                <RangeWithButtons min={0} max={Math.max(20, getBasePlatformMetric('Unit Customer Support cost - Owners') + 20)} step={0.1} value={getBasePlatformMetric('Unit Customer Support cost - Owners') + (currentMods?.unitCustomerSupportCostOwners || 0)} onChange={(e: any) => handleModChange('unitCustomerSupportCostOwners', Number(e.target.value) - getBasePlatformMetric('Unit Customer Support cost - Owners'))} />
              </div>`;

code = code.replace(target2, replacement2);

fs.writeFileSync('src/App.tsx', code);
