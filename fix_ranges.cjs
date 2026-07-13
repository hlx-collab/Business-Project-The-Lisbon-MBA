const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const rangeWithButtonsDefinition = `
const RangeWithButtons = ({ value, onChange, min, max, step = 1 }: any) => {
  return (
    <div className="flex items-center space-x-3 w-full">
      <button 
        type="button" 
        onClick={() => onChange({ target: { value: Math.max(Number(min), Number(value) - Number(step)) }})}
        className="w-7 h-7 flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 focus:outline-none"
      >
        -
      </button>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step}
        value={value} 
        onChange={onChange}
        className="flex-1 accent-indigo-600"
      />
      <button 
        type="button" 
        onClick={() => onChange({ target: { value: Math.min(Number(max), Number(value) + Number(step)) }})}
        className="w-7 h-7 flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 focus:outline-none"
      >
        +
      </button>
    </div>
  );
};

export default function App() {`;

code = code.replace(/export default function App\(\) \{/, rangeWithButtonsDefinition);

// The replacement logic:
// We look for `<input type="range" ... />`
// And replace it with `<RangeWithButtons ... />`

const ranges = [
  {
    regex: /<input\s+type="range"\s+min="-50"\s+max="50"\s+value=\{sensitivityMods\.newOwners\}\s+onChange=\{e => setSensitivityMods\(\{\.\.\.sensitivityMods,\s+newOwners: Number\(e\.target\.value\)\}\)\}\s+className="w-full accent-indigo-600"\s+\/>/m,
    repl: `<RangeWithButtons min="-50" max="50" value={sensitivityMods.newOwners} onChange={(e: any) => setSensitivityMods({...sensitivityMods, newOwners: Number(e.target.value)})} />`
  },
  {
    regex: /<input\s+type="range"\s+min="-50"\s+max="50"\s+value=\{sensitivityMods\.newProviders\}\s+onChange=\{e => setSensitivityMods\(\{\.\.\.sensitivityMods,\s+newProviders: Number\(e\.target\.value\)\}\)\}\s+className="w-full accent-indigo-600"\s+\/>/m,
    repl: `<RangeWithButtons min="-50" max="50" value={sensitivityMods.newProviders} onChange={(e: any) => setSensitivityMods({...sensitivityMods, newProviders: Number(e.target.value)})} />`
  },
  {
    regex: /<input\s+type="range"\s+min="0"\s+max="50"\s+step="0\.1"\s+value=\{17\.3 \+ sensitivityMods\.wacc\}\s+onChange=\{e => setSensitivityMods\(\{\.\.\.sensitivityMods,\s+wacc: Number\(e\.target\.value\) - 17\.3\}\)\}\s+className="w-full accent-indigo-600"\s+\/>/m,
    repl: `<RangeWithButtons min="0" max="50" step="0.1" value={17.3 + sensitivityMods.wacc} onChange={(e: any) => setSensitivityMods({...sensitivityMods, wacc: Number(e.target.value) - 17.3})} />`
  },
  {
    regex: /<input\s+type="range"\s+min=\{Math\.max\(0, getBasePlatformMetric\('Avg price per booking'\) - 50\)\}\s+max=\{getBasePlatformMetric\('Avg price per booking'\) \+ 50\}\s+value=\{getBasePlatformMetric\('Avg price per booking'\) \+ sensitivityMods\.avgPricePerBooking\}\s+onChange=\{e => setSensitivityMods\(\{\.\.\.sensitivityMods,\s+avgPricePerBooking: Number\(e\.target\.value\) - getBasePlatformMetric\('Avg price per booking'\)\}\)\}\s+className="w-full accent-indigo-600"\s+\/>/m,
    repl: `<RangeWithButtons min={Math.max(0, getBasePlatformMetric('Avg price per booking') - 50)} max={getBasePlatformMetric('Avg price per booking') + 50} value={getBasePlatformMetric('Avg price per booking') + sensitivityMods.avgPricePerBooking} onChange={(e: any) => setSensitivityMods({...sensitivityMods, avgPricePerBooking: Number(e.target.value) - getBasePlatformMetric('Avg price per booking')})} />`
  },
  {
    regex: /<input\s+type="range"\s+min=\{0\}\s+max=\{100\}\s+step=\{0\.5\}\s+value=\{getBasePlatformMetric\('% of bookings commission'\) \+ sensitivityMods\.commission\}\s+onChange=\{e => setSensitivityMods\(\{\.\.\.sensitivityMods,\s+commission: Number\(e\.target\.value\) - getBasePlatformMetric\('% of bookings commission'\)\}\)\}\s+className="w-full accent-indigo-600"\s+\/>/m,
    repl: `<RangeWithButtons min={0} max={100} step={0.5} value={getBasePlatformMetric('% of bookings commission') + sensitivityMods.commission} onChange={(e: any) => setSensitivityMods({...sensitivityMods, commission: Number(e.target.value) - getBasePlatformMetric('% of bookings commission')})} />`
  },
  {
    regex: /<input\s+type="range"\s+min=\{0\}\s+max=\{getBasePlatformMetric\('Monthly Subscription fee'\) \+ 100\}\s+value=\{getBasePlatformMetric\('Monthly Subscription fee'\) \+ sensitivityMods\.subscriptionFee\}\s+onChange=\{e => setSensitivityMods\(\{\.\.\.sensitivityMods,\s+subscriptionFee: Number\(e\.target\.value\) - getBasePlatformMetric\('Monthly Subscription fee'\)\}\)\}\s+className="w-full accent-indigo-600"\s+\/>/m,
    repl: `<RangeWithButtons min={0} max={getBasePlatformMetric('Monthly Subscription fee') + 100} value={getBasePlatformMetric('Monthly Subscription fee') + sensitivityMods.subscriptionFee} onChange={(e: any) => setSensitivityMods({...sensitivityMods, subscriptionFee: Number(e.target.value) - getBasePlatformMetric('Monthly Subscription fee')})} />`
  },
  {
    regex: /<input\s+type="range"\s+min=\{0\}\s+max=\{Math\.max\(10, getBasePlatformMetric\('# of yearly bookings per pet owners'\) \+ 10\)\}\s+step=\{0\.5\}\s+value=\{getBasePlatformMetric\('# of yearly bookings per pet owners'\) \+ sensitivityMods\.yearlyBookings\}\s+onChange=\{e => setSensitivityMods\(\{\.\.\.sensitivityMods,\s+yearlyBookings: Number\(e\.target\.value\) - getBasePlatformMetric\('# of yearly bookings per pet owners'\)\}\)\}\s+className="w-full accent-indigo-600"\s+\/>/m,
    repl: `<RangeWithButtons min={0} max={Math.max(10, getBasePlatformMetric('# of yearly bookings per pet owners') + 10)} step={0.5} value={getBasePlatformMetric('# of yearly bookings per pet owners') + sensitivityMods.yearlyBookings} onChange={(e: any) => setSensitivityMods({...sensitivityMods, yearlyBookings: Number(e.target.value) - getBasePlatformMetric('# of yearly bookings per pet owners')})} />`
  },
  {
    regex: /<input\s+type="range"\s+min="-50"\s+max="50"\s+value=\{sensitivityMods\.itRnD\}\s+onChange=\{e => setSensitivityMods\(\{\.\.\.sensitivityMods,\s+itRnD: Number\(e\.target\.value\)\}\)\}\s+className="w-full accent-indigo-600"\s+\/>/m,
    repl: `<RangeWithButtons min="-50" max="50" value={sensitivityMods.itRnD} onChange={(e: any) => setSensitivityMods({...sensitivityMods, itRnD: Number(e.target.value)})} />`
  },
  {
    regex: /<input\s+type="range"\s+min="-50"\s+max="50"\s+value=\{sensitivityMods\.marketing\}\s+onChange=\{e => setSensitivityMods\(\{\.\.\.sensitivityMods,\s+marketing: Number\(e\.target\.value\)\}\)\}\s+className="w-full accent-indigo-600"\s+\/>/m,
    repl: `<RangeWithButtons min="-50" max="50" value={sensitivityMods.marketing} onChange={(e: any) => setSensitivityMods({...sensitivityMods, marketing: Number(e.target.value)})} />`
  }
];

ranges.forEach(r => {
  code = code.replace(r.regex, r.repl);
});

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed ranges!');
