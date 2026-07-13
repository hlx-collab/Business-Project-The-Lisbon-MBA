const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldUI = `              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span>Avg Price per Booking</span>
                  <span className={sensitivityMods.avgPricePerBooking > 0 ? 'text-indigo-600 font-bold' : sensitivityMods.avgPricePerBooking < 0 ? 'text-rose-600 font-bold' : 'text-slate-500 font-bold'}>
                    {sensitivityMods.avgPricePerBooking > 0 ? '+' : ''}{sensitivityMods.avgPricePerBooking}%
                  </span>
                </label>
                <input 
                  type="range"
                  min="-50"
                  max="50"
                  value={sensitivityMods.avgPricePerBooking}
                  onChange={e => setSensitivityMods({...sensitivityMods, avgPricePerBooking: Number(e.target.value)})}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span>% of Bookings Commission</span>
                  <span className={sensitivityMods.commission > 0 ? 'text-indigo-600 font-bold' : sensitivityMods.commission < 0 ? 'text-rose-600 font-bold' : 'text-slate-500 font-bold'}>
                    {sensitivityMods.commission > 0 ? '+' : ''}{sensitivityMods.commission}%
                  </span>
                </label>
                <input 
                  type="range"
                  min="-50"
                  max="50"
                  value={sensitivityMods.commission}
                  onChange={e => setSensitivityMods({...sensitivityMods, commission: Number(e.target.value)})}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span>Monthly Subscription Fee</span>
                  <span className={sensitivityMods.subscriptionFee > 0 ? 'text-indigo-600 font-bold' : sensitivityMods.subscriptionFee < 0 ? 'text-rose-600 font-bold' : 'text-slate-500 font-bold'}>
                    {sensitivityMods.subscriptionFee > 0 ? '+' : ''}{sensitivityMods.subscriptionFee}%
                  </span>
                </label>
                <input 
                  type="range"
                  min="-50"
                  max="50"
                  value={sensitivityMods.subscriptionFee}
                  onChange={e => setSensitivityMods({...sensitivityMods, subscriptionFee: Number(e.target.value)})}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span># of Yearly Bookings per Owner</span>
                  <span className={sensitivityMods.yearlyBookings > 0 ? 'text-indigo-600 font-bold' : sensitivityMods.yearlyBookings < 0 ? 'text-rose-600 font-bold' : 'text-slate-500 font-bold'}>
                    {sensitivityMods.yearlyBookings > 0 ? '+' : ''}{sensitivityMods.yearlyBookings}%
                  </span>
                </label>
                <input 
                  type="range"
                  min="-50"
                  max="50"
                  value={sensitivityMods.yearlyBookings}
                  onChange={e => setSensitivityMods({...sensitivityMods, yearlyBookings: Number(e.target.value)})}
                  className="w-full accent-indigo-600"
                />
              </div>`;

const newUI = `              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span>Avg Price per Booking</span>
                  <span className="text-indigo-600 font-bold">
                    {formatCurrency(getBasePlatformMetric('Avg price per booking') + sensitivityMods.avgPricePerBooking)}
                  </span>
                </label>
                <input 
                  type="range"
                  min={Math.max(0, getBasePlatformMetric('Avg price per booking') - 50)}
                  max={getBasePlatformMetric('Avg price per booking') + 50}
                  value={getBasePlatformMetric('Avg price per booking') + sensitivityMods.avgPricePerBooking}
                  onChange={e => setSensitivityMods({...sensitivityMods, avgPricePerBooking: Number(e.target.value) - getBasePlatformMetric('Avg price per booking')})}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span>% of Bookings Commission</span>
                  <span className="text-indigo-600 font-bold">
                    {(getBasePlatformMetric('% of bookings commission') + sensitivityMods.commission).toFixed(1)}%
                  </span>
                </label>
                <input 
                  type="range"
                  min={0}
                  max={100}
                  step={0.5}
                  value={getBasePlatformMetric('% of bookings commission') + sensitivityMods.commission}
                  onChange={e => setSensitivityMods({...sensitivityMods, commission: Number(e.target.value) - getBasePlatformMetric('% of bookings commission')})}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span>Monthly Subscription Fee</span>
                  <span className="text-indigo-600 font-bold">
                    {formatCurrency(getBasePlatformMetric('Monthly Subscription fee') + sensitivityMods.subscriptionFee)}
                  </span>
                </label>
                <input 
                  type="range"
                  min={0}
                  max={getBasePlatformMetric('Monthly Subscription fee') + 100}
                  value={getBasePlatformMetric('Monthly Subscription fee') + sensitivityMods.subscriptionFee}
                  onChange={e => setSensitivityMods({...sensitivityMods, subscriptionFee: Number(e.target.value) - getBasePlatformMetric('Monthly Subscription fee')})}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span># of Yearly Bookings per Owner</span>
                  <span className="text-indigo-600 font-bold">
                    {(getBasePlatformMetric('# of yearly bookings per pet owners') + sensitivityMods.yearlyBookings).toFixed(1)}
                  </span>
                </label>
                <input 
                  type="range"
                  min={0}
                  max={Math.max(10, getBasePlatformMetric('# of yearly bookings per pet owners') + 10)}
                  step={0.5}
                  value={getBasePlatformMetric('# of yearly bookings per pet owners') + sensitivityMods.yearlyBookings}
                  onChange={e => setSensitivityMods({...sensitivityMods, yearlyBookings: Number(e.target.value) - getBasePlatformMetric('# of yearly bookings per pet owners')})}
                  className="w-full accent-indigo-600"
                />
              </div>`;

code = code.replace(oldUI, newUI);

fs.writeFileSync('src/App.tsx', code);
