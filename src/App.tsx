import React, { useState, useEffect, useRef } from 'react';
import { Calculator, DollarSign, TrendingUp, Activity, Plus, Trash2, Percent, Download, Camera, Copy, Check } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import { toPng, toBlob } from 'html-to-image';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface FinancialStream {
  id: string;
  name: string;
  amounts: (number | '')[];
  isPermanent?: boolean;
  isCalculated?: boolean;
}

type Market = 'Portugal' | 'UK' | 'Consolidated';

interface MarketData {
  platformMetricsStreams: FinancialStream[];
  revenueStreams: FinancialStream[];
  variableCostsStreams: FinancialStream[];
  fixedCostsStreams: FinancialStream[];
  chargeSubscription: boolean[];
  chargeBookingFees: boolean[];
}

const DEFAULT_PLATFORM_METRICS: FinancialStream[] = [
  { id: 'pm-new-providers', name: 'New providers added', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'pm-churn-providers', name: 'Provider churn rate (%)', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'pm-1', name: 'Number of providers in the platform', amounts: ['', '', '', '', ''], isPermanent: true, isCalculated: true },
  { id: 'pm-new-owners', name: 'New owners added', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'pm-churn-owners', name: 'Owner churn rate (%)', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'pm-2', name: 'Number of owners in the platform', amounts: ['', '', '', '', ''], isPermanent: true, isCalculated: true },
  { id: 'pm-3', name: 'Avg price per booking', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'pm-4', name: '% of bookings commission', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'pm-5', name: 'Monthly Subscription fee', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'pm-6', name: '# of yearly bookings per pet owners', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'pm-cac-providers', name: 'Unit CAC - Providers', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'pm-cac-owners', name: 'Unit CAC - Owners', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'pm-cs-providers', name: 'Unit Customer Support cost - Providers', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'pm-cs-owners', name: 'Unit Customer Support cost - Owners', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'pm-payment-fee-percent', name: 'Payment Fee %', amounts: [2.9, 2.9, 2.9, 2.9, 2.9], isPermanent: true },
  { id: 'pm-payment-fee-per-tx', name: 'Payment Fee per Transaction', amounts: [0.30, 0.30, 0.30, 0.30, 0.30], isPermanent: true },
  { id: 'pm-cross-charge', name: 'Cross-charge to UK (%)', amounts: ['', '', '', '', ''], isPermanent: true }
];

const DEFAULT_REVENUE_STREAMS: FinancialStream[] = [
  { id: 'rev-1', name: 'Monthly Subscriptions', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'rev-2', name: 'Booking Fees', amounts: ['', '', '', '', ''], isPermanent: true }
];

const DEFAULT_VARIABLE_COSTS_STREAMS: FinancialStream[] = [
  { id: 'vc-1', name: 'Payment Processing', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'vc-2', name: 'Customer Support', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'vc-3', name: 'Customer acquisition costs', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'vc-4', name: 'Server/Hosting (AWS/GCP)', amounts: ['', '', '', '', ''], isPermanent: true }
];

const DEFAULT_FIXED_COSTS_STREAMS: FinancialStream[] = [
  { id: 'fc-1', name: 'Rent', amounts: ['', '', '', '', ''] },
  { id: 'fc-2', name: 'Salaries', amounts: ['', '', '', '', ''] },
  { id: 'fc-3', name: 'Advertisement & Promotion', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'fc-4', name: 'IT R&D and Support', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'fc-ga', name: 'G&A expenses', amounts: ['', '', '', '', ''], isPermanent: true }
];


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

export default function App() {
  const [activeTab, setActiveTab] = useState<'financials' | 'platform' | 'gross-margin' | 'cash-flow' | 'balance-sheet' | 'sensitivity' | 'highlights' | 'monte-carlo'>('financials');
  const [activeMarket, setActiveMarket] = useState<Market>('Portugal');
  const [mcIsRunning, setMcIsRunning] = useState(false);
  const [mcResults, setMcResults] = useState<{npv: number[]; irr: number[]; roi: number[]; totalRoi: number[]; payback: number[]; opProfit: number[]; netProfit: number[];} | null>(null);
  const [mcIterations, setMcIterations] = useState(1000);
  const [copiedChart, setCopiedChart] = useState<string | null>(null);
  
  // Sensitivity Analysis Modifiers (Percentages)
  const [sensitivityMods, setSensitivityMods] = useState({
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
      marketing: 0,
      unitCustomerSupportCostOwners: [0, 0, 0, 0, 0]
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
      marketing: 0,
      unitCustomerSupportCostOwners: [0, 0, 0, 0, 0]
    }
  });

  const currentMods = activeMarket === 'Consolidated' ? null : sensitivityMods[activeMarket as 'Portugal' | 'UK'];
  const handleModChange = (key: string, value: any) => {
    if (!currentMods) return;
    setSensitivityMods({
      ...sensitivityMods,
      [activeMarket]: {
        ...sensitivityMods[activeMarket as 'Portugal' | 'UK'],
        [key]: value
      }
    });
  };

  const providerAnalysisRef = useRef<HTMLDivElement>(null);
  const ownerAnalysisRef = useRef<HTMLDivElement>(null);
  const providerChurnRef = useRef<HTMLDivElement>(null);
  const ownerChurnRef = useRef<HTMLDivElement>(null);
  const financialSummaryRef = useRef<HTMLDivElement>(null);
  const aggregatedPnLRef = useRef<HTMLDivElement>(null);
  const revenueStreamsRef = useRef<HTMLDivElement>(null);
  const cogsRef = useRef<HTMLDivElement>(null);
  const fixedCostsRef = useRef<HTMLDivElement>(null);
  const platformMetricsRef = useRef<HTMLDivElement>(null);
  const platformSettingsRef = useRef<HTMLDivElement>(null);
  const grossMarginTableRef = useRef<HTMLDivElement>(null);
  const grossMarginChartRef = useRef<HTMLDivElement>(null);
  const financialOverviewChartRef = useRef<HTMLDivElement>(null);
  const viabilityComparisonChartRef = useRef<HTMLDivElement>(null);
  const bookingsChartRef = useRef<HTMLDivElement>(null);
  const cashFlowRef = useRef<HTMLDivElement>(null);
  const balanceSheetRef = useRef<HTMLDivElement>(null);
  const aggregatedCashFlowRef = useRef<HTMLDivElement>(null);
  const aggregatedBalanceSheetRef = useRef<HTMLDivElement>(null);

  const downloadChart = async (ref: React.RefObject<HTMLDivElement>, filename: string) => {
    if (ref.current) {
      try {
        const filter = (node: HTMLElement) => !node.hasAttribute?.('data-export-exclude');
        const dataUrl = await toPng(ref.current, { 
          backgroundColor: '#ffffff', 
          quality: 1, 
          pixelRatio: 2,
          filter: filter as any 
        });
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('oops, something went wrong!', err);
      }
    }
  };

  const copyChart = async (ref: React.RefObject<HTMLDivElement>, chartId: string) => {
    if (ref.current) {
      try {
        const filter = (node: HTMLElement) => !node.hasAttribute?.('data-export-exclude');
        const blob = await toBlob(ref.current, { 
          backgroundColor: '#ffffff', 
          quality: 1, 
          pixelRatio: 2,
          filter: filter as any
        });
        if (blob) {
          if (document.hasFocus()) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            setCopiedChart(chartId);
            setTimeout(() => setCopiedChart(null), 2000);
          } else {
            console.warn('Document is not focused. Unable to write to clipboard.');
            // Fallback: download the image instead
            saveAs(blob, `${chartId}.png`);
            setCopiedChart(chartId);
            setTimeout(() => setCopiedChart(null), 2000);
          }
        }
      } catch (err) {
        console.warn('Failed to copy image:', err);
        // Fallback: don't crash, just log warning
      }
    }
  };

  const MarketFlags = ({ market }: { market: Market }) => {
    const flags = {
      Portugal: [{ url: 'https://flagcdn.com/pt.svg', alt: 'Portugal' }],
      UK: [{ url: 'https://flagcdn.com/gb.svg', alt: 'UK' }],
      Consolidated: [
        { url: 'https://flagcdn.com/pt.svg', alt: 'Portugal' },
        { url: 'https://flagcdn.com/gb.svg', alt: 'UK' }
      ]
    };

    return (
      <div className="flex -space-x-2 items-center">
        {flags[market].map((f, i) => (
          <img 
            key={i} 
            src={f.url} 
            alt={f.alt} 
            className="w-6 h-6 rounded-full border-2 border-white shadow-sm object-cover"
            referrerPolicy="no-referrer"
          />
        ))}
      </div>
    );
  };

  const [markets, setMarkets] = useState<Record<'Portugal' | 'UK', MarketData>>(() => {
    const defaultMarketData = (marketName: 'Portugal' | 'UK'): MarketData => {
      const pm = [...DEFAULT_PLATFORM_METRICS];
      if (marketName === 'UK') {
        pm.push({ id: 'pm-fx-rate', name: 'FX rate (GBP / EUR)', amounts: [1.16, 1.16, 1.16, 1.16, 1.16], isPermanent: true });
      }
      return {
        platformMetricsStreams: pm,
        revenueStreams: [...DEFAULT_REVENUE_STREAMS],
        variableCostsStreams: [...DEFAULT_VARIABLE_COSTS_STREAMS],
        fixedCostsStreams: [...DEFAULT_FIXED_COSTS_STREAMS],
        chargeSubscription: [false, false, false, false, false],
        chargeBookingFees: [false, false, false, false, false],
      };
    };

    const saved = localStorage.getItem('marketsData');
    if (saved) {
      const parsed = JSON.parse(saved);
      const upgrade = (market: MarketData, marketName: 'Portugal' | 'UK'): MarketData => {
        const syncStreams = (current: FinancialStream[], defaults: FinancialStream[]) => {
          const result: FinancialStream[] = [];
          
          // 1. Add defaults in order, using current values if available
          defaults.forEach(def => {
            const existing = (current || []).find(s => s.name === def.name);
            if (existing) {
              result.push({
                ...existing,
                isCalculated: def.isCalculated,
                isPermanent: def.isPermanent,
                id: def.id // Ensure IDs match for internal logic
              });
            } else {
              result.push({ ...def });
            }
          });

          // 2. Add any custom streams from current that aren't in defaults
          (current || []).forEach(s => {
            if (!defaults.find(d => d.name === s.name)) {
              result.push(s);
            }
          });

          return result;
        };

        const base = market || defaultMarketData(marketName);
        if (base.fixedCostsStreams) {
          base.fixedCostsStreams.forEach(s => {
            if (s.name === 'Advertisement') s.name = 'Advertisement & Promotion';
          });
        }
        const defaultsForMarket = [...DEFAULT_PLATFORM_METRICS];
        if (marketName === 'UK') {
          defaultsForMarket.push({ id: 'pm-fx-rate', name: 'FX rate (GBP / EUR)', amounts: [1.16, 1.16, 1.16, 1.16, 1.16], isPermanent: true });
        }

        return {
          ...base,
          platformMetricsStreams: syncStreams(base.platformMetricsStreams, defaultsForMarket),
          revenueStreams: syncStreams(base.revenueStreams, DEFAULT_REVENUE_STREAMS).filter(s => s.name !== 'Others'),
          variableCostsStreams: syncStreams(base.variableCostsStreams, DEFAULT_VARIABLE_COSTS_STREAMS),
          fixedCostsStreams: syncStreams(base.fixedCostsStreams, DEFAULT_FIXED_COSTS_STREAMS),
        };
      };

      return {
        Portugal: upgrade(parsed.Portugal, 'Portugal'),
        UK: upgrade(parsed.UK, 'UK')
      };
    }

    // Migration logic for old data
    const oldPlatform = localStorage.getItem('platformMetricsStreams');
    const oldRevenue = localStorage.getItem('revenueStreams');
    const oldVariable = localStorage.getItem('variableCostsStreams');
    const oldFixed = localStorage.getItem('fixedCostsStreams');
    const oldChargeSub = localStorage.getItem('chargeSubscription');
    const oldChargeBooking = localStorage.getItem('chargeBookingFees');

    if (oldPlatform || oldRevenue || oldVariable || oldFixed) {
      const portugal: MarketData = {
        platformMetricsStreams: oldPlatform ? JSON.parse(oldPlatform) : [...DEFAULT_PLATFORM_METRICS],
        revenueStreams: (oldRevenue ? JSON.parse(oldRevenue) : [...DEFAULT_REVENUE_STREAMS]).filter((s: FinancialStream) => s.name !== 'Others'),
        variableCostsStreams: oldVariable ? JSON.parse(oldVariable) : [...DEFAULT_VARIABLE_COSTS_STREAMS],
        fixedCostsStreams: oldFixed ? JSON.parse(oldFixed) : [...DEFAULT_FIXED_COSTS_STREAMS],
        chargeSubscription: oldChargeSub ? JSON.parse(oldChargeSub) : [false, false, false, false, false],
        chargeBookingFees: oldChargeBooking ? JSON.parse(oldChargeBooking) : [false, false, false, false, false],
      };
      return { Portugal: portugal, UK: defaultMarketData('UK') };
    }

    return { Portugal: defaultMarketData('Portugal'), UK: defaultMarketData('UK') };
  });

  useEffect(() => {
    localStorage.setItem('marketsData', JSON.stringify(markets));
  }, [markets]);

  const years = [0, 1, 2, 3, 4];

  const baseFinancialsNoMods = React.useMemo(() => computeAllFinancials(markets, activeMarket), [markets, activeMarket]);
  

const getPercentile = (arr, p) => arr && arr.length > 0 ? arr[Math.floor(arr.length * p)] : 0;
const getMean = (arr) => arr && arr.length > 0 ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;

  const runMonteCarlo = () => {
    setMcIsRunning(true);
    // run async to not block UI
    setTimeout(() => {
      const npvArr = [];
      const irrArr = [];
      const roiArr = [];
      const totalRoiArr = [];
      const paybackArr = [];
      const opProfitArr = [];
      const netProfitArr = [];

      // We use current settings
      const mods = sensitivityMods[activeMarket === 'Consolidated' ? 'Portugal' : activeMarket as 'Portugal'|'UK'];
      
      const randNormal = () => {
        let u = 0, v = 0;
        while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
        while(v === 0) v = Math.random();
        return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
      };

      for(let i = 0; i < mcIterations; i++) {
        // Uniform distribution: baseMod + variance
        // Let's assume the current mods are the base, and we add a uniform variance +/- 10%
        // Actually, let's use a standard distribution logic. We can use randNormal for a better distribution, with stdDev = 15% of the base value.
        // Wait, for absolute values like subscription fee, +/- 10% might mean something else.
        // Let's do simple uniform variance between -20% and +20% of the mod's absolute scale, or just let's do random normal around the mod value.
        // To be safe, let's apply a +/- 15% variation on the sensitivity mod range or base value.
        
        // Simpler: random uniform between 0.8 and 1.2 for all inputs.
        // But the modifiers are additive absolute values (like commission + 2, ownerChurn + 5).
        // Let's just create a randomized mod object:
        const r = () => (Math.random() * 2 - 1); // -1 to 1

        const rMod = {
          newOwners: mods.newOwners + r() * 20, // +/- 20
          newProviders: mods.newProviders + r() * 20,
          ownerChurn: [0,0,0,0,0].map(() => mods.ownerChurn[0] + r() * 5),
          providerChurn: [0,0,0,0,0].map(() => mods.providerChurn[0] + r() * 5),
          avgPricePerBooking: mods.avgPricePerBooking + r() * 5,
          commission: mods.commission + r() * 2,
          subscriptionFee: mods.subscriptionFee + r() * 5,
          yearlyBookings: mods.yearlyBookings + r() * 1,
          unitCustomerSupportCostOwners: [0,0,0,0,0].map(() => (mods.unitCustomerSupportCostOwners?.[0] || 0) + r() * 2),
          itRnD: mods.itRnD + r() * 10,
          marketing: mods.marketing + r() * 10
        };

        const result = computeAllFinancials(markets, activeMarket, 
          activeMarket === 'Portugal' || activeMarket === 'Consolidated' ? rMod : undefined,
          activeMarket === 'UK' || activeMarket === 'Consolidated' ? rMod : undefined,
          sensitivityMods.wacc + r() * 2
        );

        npvArr.push(result.npv);
        irrArr.push(result.irr || 0);
        roiArr.push(result.roi || 0);
        totalRoiArr.push(result.totalRoi || 0);
        paybackArr.push(result.paybackPeriod || 0);
        opProfitArr.push(result.operatingProfit);
        netProfitArr.push(result.totalNetIncome);
      }

      setMcResults({
        npv: npvArr.sort((a,b)=>a-b),
        irr: irrArr.sort((a,b)=>a-b),
        roi: roiArr.sort((a,b)=>a-b),
        totalRoi: totalRoiArr.sort((a,b)=>a-b),
        payback: paybackArr.sort((a,b)=>a-b),
        opProfit: opProfitArr.sort((a,b)=>a-b),
        netProfit: netProfitArr.sort((a,b)=>a-b)
      });
      setMcIsRunning(false);
    }, 50);
  };

  const getBasePlatformMetric = (name: string, yearIdx?: number) => {
    let yIdx = yearIdx;
    if (yIdx === undefined) {
      yIdx = activeMarket === 'UK' ? 2 : 0;
    }
    const stream = baseFinancialsNoMods.platformMetricsStreams.find(s => s.name === name);
    const val = Number(stream?.amounts?.[yIdx]);
    return isNaN(val) ? 0 : val;
  };

  function calculateFinancials(data: MarketData, marketName: 'Portugal' | 'UK', mods?: typeof sensitivityMods.Portugal, waccMod: number = 0) {
    let { platformMetricsStreams, revenueStreams, variableCostsStreams, fixedCostsStreams, chargeSubscription, chargeBookingFees } = data;
    if (mods) {
      const applyMod = (streams: FinancialStream[], nameToMatch: string, modValue: number | number[], type: 'relative' | 'absolute' | 'absoluteArray' = 'relative') => {
        return streams.map(s => {
          if (s.name === nameToMatch) {
            return {
              ...s,
              amounts: s.amounts.map((v, i) => {
                const num = Number(v);
                if (isNaN(num)) return v;
                // For UK, only apply modifiers to Y3, Y4, Y5 (indices 2, 3, 4)
                if (marketName === 'UK' && i < 2) return num;
                if (type === 'absoluteArray' && Array.isArray(modValue)) {
                  return num + (modValue[i] || 0);
                } else if (type === 'absolute' && typeof modValue === 'number') {
                  return num + modValue;
                }
                return num * (1 + (modValue as number) / 100);
              })
            };
          }
          return s;
        });
      };
      platformMetricsStreams = applyMod(platformMetricsStreams, 'New owners added', mods.newOwners, 'relative');
      platformMetricsStreams = applyMod(platformMetricsStreams, 'New providers added', mods.newProviders, 'relative');
      platformMetricsStreams = applyMod(platformMetricsStreams, 'Owner churn rate (%)', mods.ownerChurn, 'absoluteArray');
      platformMetricsStreams = applyMod(platformMetricsStreams, 'Provider churn rate (%)', mods.providerChurn, 'absoluteArray');
      platformMetricsStreams = applyMod(platformMetricsStreams, 'Avg price per booking', mods.avgPricePerBooking, 'absolute');
      platformMetricsStreams = applyMod(platformMetricsStreams, '% of bookings commission', mods.commission, 'absolute');
      platformMetricsStreams = applyMod(platformMetricsStreams, 'Monthly Subscription fee', mods.subscriptionFee, 'absolute');
      platformMetricsStreams = applyMod(platformMetricsStreams, '# of yearly bookings per pet owners', mods.yearlyBookings, 'absolute');
      platformMetricsStreams = applyMod(platformMetricsStreams, 'Unit Customer Support cost - Owners', mods.unitCustomerSupportCostOwners, 'absoluteArray');
      fixedCostsStreams = applyMod(fixedCostsStreams, 'IT R&D and Support', mods.itRnD, 'relative');
      fixedCostsStreams = applyMod(fixedCostsStreams, 'Advertisement & Promotion', mods.marketing, 'relative');
    }


    const derivedPlatformMetricsStreams = platformMetricsStreams.map(stream => {
      if (stream.id === 'pm-1' || stream.name === 'Number of providers in the platform') {
        const newProvidersStream = platformMetricsStreams.find(s => s.id === 'pm-new-providers' || s.name === 'New providers added');
        const churnProvidersStream = platformMetricsStreams.find(s => s.id === 'pm-churn-providers' || s.name === 'Provider churn rate (%)');
        
        const amounts: (number | '')[] = [];
        let runningTotal = 0;
        
        years.forEach(y => {
          const newProviders = Number(newProvidersStream?.amounts?.[y]) || 0;
          const churnRate = (Number(churnProvidersStream?.amounts?.[y]) || 0) / 100;
          
          // Formula: Total(t) = Total(t-1) * (1 - Churn(t)) + New(t)
          runningTotal = (runningTotal * (1 - churnRate)) + newProviders;
          amounts.push(Math.round(runningTotal));
        });
        
        return { ...stream, amounts, isCalculated: true };
      }
      if (stream.id === 'pm-2' || stream.name === 'Number of owners in the platform') {
        const newOwnersStream = platformMetricsStreams.find(s => s.id === 'pm-new-owners' || s.name === 'New owners added');
        const churnOwnersStream = platformMetricsStreams.find(s => s.id === 'pm-churn-owners' || s.name === 'Owner churn rate (%)');
        
        const amounts: (number | '')[] = [];
        let runningTotal = 0;
        
        years.forEach(y => {
          const newOwners = Number(newOwnersStream?.amounts?.[y]) || 0;
          const churnRate = (Number(churnOwnersStream?.amounts?.[y]) || 0) / 100;
          
          // Formula: Total(t) = Total(t-1) * (1 - Churn(t)) + New(t)
          runningTotal = (runningTotal * (1 - churnRate)) + newOwners;
          amounts.push(Math.round(runningTotal));
        });
        
        return { ...stream, amounts, isCalculated: true };
      }
      return stream;
    });

    const derivedRevenueStreams = revenueStreams.map(stream => {
      if (stream.id === 'rev-1' || stream.name === 'Monthly Subscriptions') {
        const providersStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-1' || s.name === 'Number of providers in the platform');
        const subFeeStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-5' || s.name === 'Monthly Subscription fee');
        
        const amounts = years.map(y => {
          const providers = Number(providersStream?.amounts?.[y]) || 0;
          const subFee = Number(subFeeStream?.amounts?.[y]) || 0;
          const charge = chargeSubscription[y] ? 1 : 0;
          const total = providers * subFee * charge * 12;
          return total;
        });
        return { ...stream, amounts, isCalculated: true };
      }
      if (stream.id === 'rev-2' || stream.name === 'Booking Fees') {
        const ownersStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-2' || s.name === 'Number of owners in the platform');
        const bookingsPerOwnerStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-6' || s.name === '# of yearly bookings per pet owners');
        const avgPriceStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-3' || s.name === 'Avg price per booking');
        const commissionStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-4' || s.name === '% of bookings commission');
        
        const amounts = years.map(y => {
          const owners = Number(ownersStream?.amounts?.[y]) || 0;
          const bookingsPerOwner = Number(bookingsPerOwnerStream?.amounts?.[y]) || 0;
          const avgPrice = Number(avgPriceStream?.amounts?.[y]) || 0;
          const commission = Number(commissionStream?.amounts?.[y]) || 0;
          const charge = chargeBookingFees[y] ? 1 : 0;
          
          const total = owners * bookingsPerOwner * avgPrice * (commission / 100) * charge;
          return total;
        });
        return { ...stream, amounts, isCalculated: true };
      }
      return stream;
    });

    const derivedVariableCostsStreams = variableCostsStreams.map(stream => {
      if (stream.id === 'vc-1' || stream.name === 'Payment Processing') {
        const providersStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-1' || s.name === 'Number of providers in the platform');
        const subFeeStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-5' || s.name === 'Monthly Subscription fee');
        const ownersStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-2' || s.name === 'Number of owners in the platform');
        const bookingsPerOwnerStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-6' || s.name === '# of yearly bookings per pet owners');
        const avgPriceStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-3' || s.name === 'Avg price per booking');
        const paymentFeePctStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-payment-fee-percent' || s.name === 'Payment Fee %');
        const paymentFeePerTxStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-payment-fee-per-tx' || s.name === 'Payment Fee per Transaction');
        
        const amounts = years.map(y => {
          const providers = Number(providersStream?.amounts?.[y]) || 0;
          const subFee = Number(subFeeStream?.amounts?.[y]) || 0;
          const chargeSub = chargeSubscription[y] ? 1 : 0;
          const subTransactions = providers * 12 * chargeSub;
          const subVolume = subTransactions * subFee;

          const owners = Number(ownersStream?.amounts?.[y]) || 0;
          const bookingsPerOwner = Number(bookingsPerOwnerStream?.amounts?.[y]) || 0;
          const avgPrice = Number(avgPriceStream?.amounts?.[y]) || 0;
          
          const bookingTransactions = owners * bookingsPerOwner;
          const bookingVolume = bookingTransactions * avgPrice;

          const totalTransactions = subTransactions + bookingTransactions;
          const totalVolume = subVolume + bookingVolume;

          const feePctVal = paymentFeePctStream?.amounts?.[y];
          const feePct = (feePctVal !== undefined && feePctVal !== null)
            ? (feePctVal === '' ? 0 : Number(feePctVal) / 100)
            : 0.029;

          const feePerTxVal = paymentFeePerTxStream?.amounts?.[y];
          const feePerTx = (feePerTxVal !== undefined && feePerTxVal !== null)
            ? (feePerTxVal === '' ? 0 : Number(feePerTxVal))
            : 0.30;

          const cost = (totalVolume * feePct) + (totalTransactions * feePerTx);
          return cost;
        });
        return { ...stream, amounts, isCalculated: true };
      }
      if (stream.id === 'vc-3' || stream.name === 'Customer acquisition costs') {
        const newProvidersStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-new-providers' || s.name === 'New providers added');
        const newOwnersStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-new-owners' || s.name === 'New owners added');
        const unitCacProvidersStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-cac-providers' || s.name === 'Unit CAC - Providers');
        const unitCacOwnersStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-cac-owners' || s.name === 'Unit CAC - Owners');
        
        const amounts = years.map(y => {
          const newProviders = Number(newProvidersStream?.amounts?.[y]) || 0;
          const newOwners = Number(newOwnersStream?.amounts?.[y]) || 0;
          
          const unitCacProviders = Number(unitCacProvidersStream?.amounts?.[y]) || 0;
          const unitCacOwners = Number(unitCacOwnersStream?.amounts?.[y]) || 0;
          
          return (newProviders * unitCacProviders) + (newOwners * unitCacOwners);
        });
        return { ...stream, amounts, isCalculated: true };
      }
      if (stream.id === 'vc-2' || stream.name === 'Customer Support') {
        const providersStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-1' || s.name === 'Number of providers in the platform');
        const ownersStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-2' || s.name === 'Number of owners in the platform');
        const unitSupportProvidersStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-cs-providers' || s.name === 'Unit Customer Support cost - Providers');
        const unitSupportOwnersStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-cs-owners' || s.name === 'Unit Customer Support cost - Owners');
        
        const amounts = years.map(y => {
          const providers = Number(providersStream?.amounts?.[y]) || 0;
          const owners = Number(ownersStream?.amounts?.[y]) || 0;
          const unitCostProviders = Number(unitSupportProvidersStream?.amounts?.[y]) || 0;
          const unitCostOwners = Number(unitSupportOwnersStream?.amounts?.[y]) || 0;
          
          return (providers * unitCostProviders) + (owners * unitCostOwners);
        });
        return { ...stream, amounts, isCalculated: true };
      }
      return stream;
    });

    const totalRevenueByYear = years.map(y => derivedRevenueStreams.reduce((sum, stream) => sum + (Number(stream.amounts[y]) || 0), 0));
    const totalGrossRevenueByYear = years.map(y => {
      const ownersStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-2' || s.name === 'Number of owners in the platform');
      const bookingsPerOwnerStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-6' || s.name === '# of yearly bookings per pet owners');
      const avgPriceStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-3' || s.name === 'Avg price per booking');
      
      const owners = Number(ownersStream?.amounts?.[y]) || 0;
      const bookingsPerOwner = Number(bookingsPerOwnerStream?.amounts?.[y]) || 0;
      const avgPrice = Number(avgPriceStream?.amounts?.[y]) || 0;
      
      const bookingVolume = owners * bookingsPerOwner * avgPrice;
      
      const subscriptionsRevenue = derivedRevenueStreams.find(s => s.id === 'rev-1' || s.name === 'Monthly Subscriptions')?.amounts?.[y] || 0;
      const otherRevenue = derivedRevenueStreams
        .filter(s => !(s.id === 'rev-1' || s.name === 'Monthly Subscriptions') && !(s.id === 'rev-2' || s.name === 'Booking Fees'))
        .reduce((sum, s) => sum + (Number(s.amounts[y]) || 0), 0);
        
      return bookingVolume + Number(subscriptionsRevenue) + otherRevenue;
    });

    const totalVarCostsByYear = years.map(y => derivedVariableCostsStreams.reduce((sum, stream) => sum + (Number(stream.amounts[y]) || 0), 0));

    const derivedFixedCostsStreams = fixedCostsStreams.map(stream => ({ ...stream }));

    if (marketName === 'Portugal') {
        const itStream = fixedCostsStreams.find(s => s.name === 'IT R&D and Support');
        const salaryStream = fixedCostsStreams.find(s => s.name === 'Salaries');
        const crossChargeStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-cross-charge' || s.name === 'Cross-charge to UK (%)');
        
        const amounts = years.map(y => {
            const it = Number(itStream?.amounts?.[y]) || 0;
            const salary = Number(salaryStream?.amounts?.[y]) || 0;
            const pct = (Number(crossChargeStream?.amounts?.[y]) || 0) / 100;
            return Number((-((it + salary) * pct)).toFixed(6));
        });
        derivedFixedCostsStreams.push({
            id: 'fc-cross-charge-pt',
            name: 'Service Recovery (IT/Salaries Cross-charge to UK)',
            amounts,
            isCalculated: true,
            isPermanent: true
        });
    } else if (marketName === 'UK') {
        const ptData = markets.Portugal;
        const itStream = ptData.fixedCostsStreams.find(s => s.name === 'IT R&D and Support');
        const salaryStream = ptData.fixedCostsStreams.find(s => s.name === 'Salaries');
        const crossChargeStream = ptData.platformMetricsStreams.find(s => s.id === 'pm-cross-charge' || s.name === 'Cross-charge to UK (%)');
        
        const fxRateStream = derivedPlatformMetricsStreams.find(s => s.id === 'pm-fx-rate');

        const amounts = years.map(y => {
            const it = Number(itStream?.amounts?.[y]) || 0;
            const salary = Number(salaryStream?.amounts?.[y]) || 0;
            const pct = (Number(crossChargeStream?.amounts?.[y]) || 0) / 100;
            const ptRecoveryEur = ((it + salary) * pct);
            const fx = Number(fxRateStream?.amounts?.[y]) || 1.16;
            return Number((ptRecoveryEur / fx).toFixed(6));
        });
        derivedFixedCostsStreams.push({
            id: 'fc-cross-charge-uk',
            name: 'IT & Shared Services Fee (Paid to PT)',
            amounts,
            isCalculated: true,
            isPermanent: true
        });
    }

    const totalFixedCostsByYear = years.map(y => derivedFixedCostsStreams.reduce((sum, stream) => sum + (Number(stream.amounts[y]) || 0), 0));
    const totalPlatformMetricsByYear = years.map(y => derivedPlatformMetricsStreams.reduce((sum, stream) => sum + (Number(stream.amounts[y]) || 0), 0));

    const grossMarginByYear = years.map(y => totalRevenueByYear[y] - totalVarCostsByYear[y]);
    const grossMarginPercentByYear = years.map(y => totalRevenueByYear[y] > 0 ? (grossMarginByYear[y] / totalRevenueByYear[y]) * 100 : 0);
    const opProfitByYear = years.map(y => grossMarginByYear[y] - totalFixedCostsByYear[y]);
    const opProfitPercentByYear = years.map(y => totalRevenueByYear[y] > 0 ? (opProfitByYear[y] / totalRevenueByYear[y]) * 100 : 0);

    const totalRevenue = totalRevenueByYear.reduce((a, b) => a + b, 0);
    const totalGrossRevenue = totalGrossRevenueByYear.reduce((a, b) => a + b, 0);
    const totalVariableCosts = totalVarCostsByYear.reduce((a, b) => a + b, 0);
    const fixedCosts = totalFixedCostsByYear.reduce((a, b) => a + b, 0);
    const totalPlatformMetrics = totalPlatformMetricsByYear.reduce((a, b) => a + b, 0);
    const grossMargin = grossMarginByYear.reduce((a, b) => a + b, 0);
    const operatingProfit = opProfitByYear.reduce((a, b) => a + b, 0);
    const calculatedMarginPercent = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;
    const calculatedOpProfitPercent = totalRevenue > 0 ? (operatingProfit / totalRevenue) * 100 : 0;

    const TAX_RATE = 0.21;
    const equityInjection = [0, 0, 0, 0, 0];
    if (marketName === 'Portugal') {
        equityInjection[0] = 600000;
        equityInjection[1] = 500000;
    } else if (marketName === 'UK') {
        equityInjection[2] = 1800000;
    }

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
    }

    const totalTaxes = taxByYear.reduce((a, b) => a + b, 0);
    const totalNetIncome = netIncomeByYear.reduce((a, b) => a + b, 0);

    const defRevBalance = years.map(y => totalGrossRevenueByYear[y] * 0.01);
    const accruedFeesBalance = years.map(y => totalGrossRevenueByYear[y] * 0.03);

    const increaseDefRev: number[] = [];
    const increaseAccruedFees: number[] = [];
    const cashFromOp: number[] = [];

    for (let i = 0; i < 5; i++) {
        increaseDefRev[i] = i === 0 ? defRevBalance[i] : defRevBalance[i] - defRevBalance[i - 1];
        increaseAccruedFees[i] = i === 0 ? accruedFeesBalance[i] : accruedFeesBalance[i] - accruedFeesBalance[i - 1];
        cashFromOp[i] = netIncomeByYear[i] + increaseDefRev[i] + increaseAccruedFees[i]; 
    }

    const cashFromFinancing = [...equityInjection];

    const netIncreaseInCash: number[] = [];
    const cashBalanceBeginning: number[] = [];
    const cashBalanceEnd: number[] = [];

    let currentCash = 0;
    for (let i = 0; i < 5; i++) {
        cashBalanceBeginning[i] = currentCash;
        netIncreaseInCash[i] = cashFromOp[i] + cashFromFinancing[i];
        currentCash += netIncreaseInCash[i];
        cashBalanceEnd[i] = currentCash;
    }

    const shareCapital: number[] = [];
    let cumulativeEquity = 0;
    for (let i = 0; i < 5; i++) {
        cumulativeEquity += equityInjection[i];
        shareCapital[i] = cumulativeEquity;
    }

    const retainedEarnings: number[] = [];
    let currentRE = 0;
    
    for (let i = 0; i < 5; i++) {
        retainedEarnings[i] = currentRE;
        currentRE += netIncomeByYear[i];
    }

    const totalEquity = years.map(i => shareCapital[i] + retainedEarnings[i] + netIncomeByYear[i]);
    const totalLiabilities = years.map(i => defRevBalance[i] + accruedFeesBalance[i]);

    const WACC = (17.3 + (waccMod || 0)) / 100;
    const npv = cashFromOp.reduce((acc, cf, t) => acc + cf / Math.pow(1 + WACC, t + 1), 0);
    
    let irr = 0;
    const maxTries = 1000;
    const tolerance = 1e-5;
    let rate = 0.1;
    for (let i = 0; i < maxTries; i++) {
        let npvCalc = 0;
        let dNpv = 0;
        for (let t = 0; t < 5; t++) {
            npvCalc += cashFromOp[t] / Math.pow(1 + rate, t + 1);
            dNpv -= (t + 1) * cashFromOp[t] / Math.pow(1 + rate, t + 2);
        }
        if (Math.abs(dNpv) < 1e-8) break;
        const newRate = rate - npvCalc / dNpv;
        if (Math.abs(newRate - rate) < tolerance) {
            irr = newRate;
            break;
        }
        rate = newRate;
    }

    let paybackPeriod: number | null = null;
    let cumCf = 0;
    for (let t = 0; t < 5; t++) {
        const nextCumCf = cumCf + cashFromOp[t];
        if (cumCf < 0 && nextCumCf >= 0 && paybackPeriod === null) {
            paybackPeriod = t + Math.abs(cumCf) / cashFromOp[t];
        }
        cumCf = nextCumCf;
    }

    let discountedPaybackPeriod: number | null = null;
    let cumDcf = 0;
    for (let t = 0; t < 5; t++) {
        const dcf = cashFromOp[t] / Math.pow(1 + WACC, t + 1);
        const nextCumDcf = cumDcf + dcf;
        if (cumDcf < 0 && nextCumDcf >= 0 && discountedPaybackPeriod === null) {
            discountedPaybackPeriod = t + Math.abs(cumDcf) / dcf;
        }
        cumDcf = nextCumDcf;
    }

    const calculatedNetIncomePercent = totalRevenue > 0 ? (totalNetIncome / totalRevenue) * 100 : 0;

    const totalInvestment = equityInjection.reduce((a, b) => a + b, 0);
    const roi = totalInvestment > 0 ? ((totalNetIncome / 5) / totalInvestment) : 0;
    const totalRoi = totalInvestment > 0 ? (totalNetIncome / totalInvestment) : 0;

    return {
      equityInjection,
      platformMetricsStreams: derivedPlatformMetricsStreams,
      derivedRevenueStreams,
      derivedVariableCostsStreams,
      derivedFixedCostsStreams,
      totalRevenueByYear,
      totalGrossRevenueByYear,
      totalVarCostsByYear,
      totalFixedCostsByYear,
      totalPlatformMetricsByYear,
      grossMarginByYear,
      grossMarginPercentByYear,
      opProfitByYear,
      opProfitPercentByYear,
      netIncomeByYear,
      taxByYear,
      defRevBalance,
      accruedFeesBalance,
      increaseDefRev,
      increaseAccruedFees,
      cashFromOp,
      cashFromFinancing,
      netIncreaseInCash,
      cashBalanceBeginning,
      cashBalanceEnd,
      shareCapital,
      retainedEarnings,
      totalEquity,
      totalLiabilities,
      totalRevenue,
      totalGrossRevenue,
      totalVariableCosts,
      fixedCosts,
      totalPlatformMetrics,
      grossMargin,
      operatingProfit,
      totalTaxes,
      totalNetIncome,
      calculatedMarginPercent,
      calculatedOpProfitPercent,
      calculatedNetIncomePercent,
      npv,
      irr,
      roi,
      totalRoi,
      paybackPeriod,
      discountedPaybackPeriod
    };
  };

  
  useEffect(() => {
    if (activeMarket !== 'Consolidated') return;
    const base = computeAllFinancials(markets, 'Consolidated', undefined, undefined, 0);

    function testScenario(modName, modValue, waccMod = 0) {
      const mods = {
        newOwners: 0,
        newProviders: 0,
        ownerChurn: [0, 0, 0, 0, 0],
        providerChurn: [0, 0, 0, 0, 0],
        avgPricePerBooking: 0,
        commission: 0,
        subscriptionFee: 0,
        yearlyBookings: 0,
        unitCustomerSupportCostOwners: [0, 0, 0, 0, 0],
        itRnD: 0,
        marketing: 0
      };
      
      if (modName !== 'wacc') {
        if (modName === 'ownerChurn' || modName === 'providerChurn' || modName === 'unitCustomerSupportCostOwners') {
          mods[modName] = [modValue, modValue, modValue, modValue, modValue];
        } else {
          mods[modName] = modValue;
        }
      }

      const result = computeAllFinancials(markets, 'Consolidated', mods, mods, waccMod);
      return {
        opProfit: result.operatingProfit - base.operatingProfit,
        netProfit: result.totalNetIncome - base.totalNetIncome,
        npv: result.npv - base.npv,
        irr: (result.irr || 0) - (base.irr || 0),
        roi: (result.roi || 0) - (base.roi || 0),
        totalRoi: (result.totalRoi || 0) - (base.totalRoi || 0),
        payback: (result.paybackPeriod || 0) - (base.paybackPeriod || 0),
      };
    }

    const scenarios = [
      { name: 'New Owners +10%', mod: 'newOwners', val: 10 },
      { name: 'New Providers +10%', mod: 'newProviders', val: 10 },
      { name: 'Owner Churn +5%', mod: 'ownerChurn', val: 5 },
      { name: 'Provider Churn +5%', mod: 'providerChurn', val: 5 },
      { name: 'Avg Price +5 (abs)', mod: 'avgPricePerBooking', val: 5 },
      { name: 'Commission +2% (abs)', mod: 'commission', val: 2 },
      { name: 'Subscription Fee +5 (abs)', mod: 'subscriptionFee', val: 5 },
      { name: 'Yearly Bookings +1 (abs)', mod: 'yearlyBookings', val: 1 },
      { name: 'Unit CS Owners +1 (abs)', mod: 'unitCustomerSupportCostOwners', val: 1 },
      { name: 'IT R&D +10%', mod: 'itRnD', val: 10 },
      { name: 'Marketing +10%', mod: 'marketing', val: 10 },
      { name: 'WACC +2%', mod: 'wacc', val: 0, wacc: 2 },
    ];

    let out = "Baseline:\n";
    out += "OpProfit: " + base.operatingProfit + "\n";
    out += "NetProfit: " + base.totalNetIncome + "\n";
    out += "NPV: " + base.npv + "\n";
    out += "IRR: " + base.irr + "\n";
    out += "Average Annual ROI: " + base.roi + "\n";
    out += "Payback: " + base.paybackPeriod + "\n\nImpacts:\n";
    
    for (const s of scenarios) {
      const res = testScenario(s.mod, s.val, s.wacc || 0);
      out += s.name + "\n";
      out += "  OpProfit: " + Math.round(res.opProfit) + "\n";
      out += "  NetProfit: " + Math.round(res.netProfit) + "\n";
      out += "  NPV: " + Math.round(res.npv) + "\n";
      out += "  IRR: " + (res.irr * 100).toFixed(2) + "%\n";
      out += "  Average Annual ROI: " + (res.roi * 100).toFixed(2) + "%\n";
      out += "  Payback: " + res.payback.toFixed(2) + "\n";
    }
    fetch("http://localhost:3001", { method: "POST", body: out }).catch(e=>console.log(e));
  }, [markets, activeMarket]);

  const updateMarketData = (updater: (prev: MarketData) => MarketData) => {
    if (activeMarket === 'Consolidated') return;
    setMarkets(prev => ({
      ...prev,
      [activeMarket]: updater(prev[activeMarket])
    }));
  };

  
  function computeAllFinancials(markets: any, activeMarket: string, modsPt?: typeof sensitivityMods.Portugal, modsUk?: typeof sensitivityMods.UK, waccMod: number = 0) {
    const pt = markets.Portugal;
    let uk = { ...markets.UK };
    
    const fillEmptyWithY3 = (streams: FinancialStream[]) => {
      return streams.map(s => {
        const y3Val = s.amounts[2];
        return {
          ...s,
          amounts: s.amounts.map(v => (v === '' || v === undefined) ? (y3Val === '' ? 0 : y3Val) : v)
        };
      });
    };
    
    uk.platformMetricsStreams = fillEmptyWithY3(uk.platformMetricsStreams);
    uk.revenueStreams = fillEmptyWithY3(uk.revenueStreams);
    uk.variableCostsStreams = fillEmptyWithY3(uk.variableCostsStreams);
    uk.fixedCostsStreams = fillEmptyWithY3(uk.fixedCostsStreams);
    // Note: boolean arrays chargeSubscription and chargeBookingFees don't have "empty" states, they are false by default.
    
    const marketsFilled = { Portugal: pt, UK: uk, Consolidated: undefined };


    if (activeMarket === 'Consolidated') {
      const pt = marketsFilled.Portugal;
      const uk = marketsFilled.UK;
      const ptFin = { ...pt, ...calculateFinancials(pt, 'Portugal', modsPt, waccMod) };
      const rawUkFin = { ...uk, ...calculateFinancials(uk, 'UK', modsUk, waccMod) };

      const applyFxToUkFin = (fin: typeof rawUkFin): typeof rawUkFin => {
        const getFxRate = (y: number) => {
          const fxRateStream = fin.platformMetricsStreams.find(s => s.id === 'pm-fx-rate');
          return fxRateStream ? (Number(fxRateStream.amounts[y]) || 1.16) : 1.16;
        };

        const convertArr = (arr: number[]) => arr.map((v, y) => v * getFxRate(y));

        const convertStreams = (streams: FinancialStream[], checkCurrency = false) => 
          streams.map(s => {
            const isCurr = checkCurrency ? ['Avg price per booking', 'Monthly Subscription fee', 'Unit CAC - Providers', 'Unit CAC - Owners', 'Unit Customer Support cost - Providers', 'Unit Customer Support cost - Owners', 'Payment Fee per Transaction'].includes(s.name) : true;
            if (!isCurr || s.id === 'pm-fx-rate') return s;
            return {
              ...s,
              amounts: s.amounts.map((v, y) => {
                if (v === '') return '';
                const num = Number(v);
                return isNaN(num) ? v : Number((num * getFxRate(y)).toFixed(2));
              })
            };
          });

        return {
          ...fin,
          platformMetricsStreams: convertStreams(fin.platformMetricsStreams, true),
          revenueStreams: convertStreams(fin.revenueStreams),
          derivedRevenueStreams: convertStreams(fin.derivedRevenueStreams),
          variableCostsStreams: convertStreams(fin.variableCostsStreams),
          fixedCostsStreams: convertStreams(fin.fixedCostsStreams),
          derivedVariableCostsStreams: convertStreams(fin.derivedVariableCostsStreams),
          derivedFixedCostsStreams: convertStreams(fin.derivedFixedCostsStreams),
          
          totalRevenueByYear: convertArr(fin.totalRevenueByYear),
          totalGrossRevenueByYear: convertArr(fin.totalGrossRevenueByYear),
          totalVarCostsByYear: convertArr(fin.totalVarCostsByYear),
          totalFixedCostsByYear: convertArr(fin.totalFixedCostsByYear),
          grossMarginByYear: convertArr(fin.grossMarginByYear),
          opProfitByYear: convertArr(fin.opProfitByYear),
          netIncomeByYear: convertArr(fin.netIncomeByYear),
          taxByYear: convertArr(fin.taxByYear),
          defRevBalance: convertArr(fin.defRevBalance),
          accruedFeesBalance: convertArr(fin.accruedFeesBalance),
          increaseDefRev: convertArr(fin.increaseDefRev),
          increaseAccruedFees: convertArr(fin.increaseAccruedFees),
          cashFromOp: convertArr(fin.cashFromOp),
          cashFromFinancing: convertArr(fin.cashFromFinancing),
          netIncreaseInCash: convertArr(fin.netIncreaseInCash),
          cashBalanceBeginning: convertArr(fin.cashBalanceBeginning),
          cashBalanceEnd: convertArr(fin.cashBalanceEnd),
          equityInjection: convertArr(fin.equityInjection),
          shareCapital: convertArr(fin.shareCapital),
          retainedEarnings: convertArr(fin.retainedEarnings),
          totalEquity: convertArr(fin.totalEquity),
          totalLiabilities: convertArr(fin.totalLiabilities),

          totalRevenue: convertArr(fin.totalRevenueByYear).reduce((a,b)=>a+b,0),
          totalGrossRevenue: convertArr(fin.totalGrossRevenueByYear).reduce((a,b)=>a+b,0),
          totalVariableCosts: convertArr(fin.totalVarCostsByYear).reduce((a,b)=>a+b,0),
          fixedCosts: convertArr(fin.totalFixedCostsByYear).reduce((a,b)=>a+b,0),
          grossMargin: convertArr(fin.grossMarginByYear).reduce((a,b)=>a+b,0),
          operatingProfit: convertArr(fin.opProfitByYear).reduce((a,b)=>a+b,0),
          totalTaxes: convertArr(fin.taxByYear).reduce((a,b)=>a+b,0),
          totalNetIncome: convertArr(fin.netIncomeByYear).reduce((a,b)=>a+b,0),
          totalInvestment: convertArr(fin.equityInjection).reduce((a,b)=>a+b,0)
        };
      };

      const ukFin = applyFxToUkFin(rawUkFin);

      const aggregateStreams = (s1: FinancialStream[], s2: FinancialStream[], isPlatformMetrics = false) => {
        const allNames = Array.from(new Set([...s1.map(s => s.name), ...s2.map(s => s.name)]));
        return allNames.map(name => {
          const st1 = s1.find(s => s.name === name);
          const st2 = s2.find(s => s.name === name);
          
          const amounts = years.map(y => {
            const metricVal1 = Number(st1?.amounts?.[y]) || 0;
            const metricVal2 = Number(st2?.amounts?.[y]) || 0;

            if (isPlatformMetrics) {
              const getMetric = (fin: any, metricName: string) => 
                fin.platformMetricsStreams.find((s: any) => s.name === metricName);
              
              const getVal = (fin: any, metricName: string, year: number) => 
                Number(getMetric(fin, metricName)?.amounts?.[year]) || 0;

              let result = 0;
              if (name === '% of bookings commission') {
                const vol1 = getVal(ptFin, 'Number of owners in the platform', y) * 
                             getVal(ptFin, '# of yearly bookings per pet owners', y) * 
                             getVal(ptFin, 'Avg price per booking', y);
                const vol2 = getVal(ukFin, 'Number of owners in the platform', y) * 
                             getVal(ukFin, '# of yearly bookings per pet owners', y) * 
                             getVal(ukFin, 'Avg price per booking', y);
                const totalVol = vol1 + vol2;
                result = totalVol > 0 ? (metricVal1 * vol1 + metricVal2 * vol2) / totalVol : 0;
              } else if (name === 'Avg price per booking') {
                const w1 = getVal(ptFin, 'Number of owners in the platform', y) * 
                           getVal(ptFin, '# of yearly bookings per pet owners', y);
                const w2 = getVal(ukFin, 'Number of owners in the platform', y) * 
                           getVal(ukFin, '# of yearly bookings per pet owners', y);
                const totalW = w1 + w2;
                result = totalW > 0 ? (metricVal1 * w1 + metricVal2 * w2) / totalW : 0;
              } else if (name === 'Monthly Subscription fee' || name === 'Unit Customer Support cost - Providers') {
                const w1 = getVal(ptFin, 'Number of providers in the platform', y);
                const w2 = getVal(ukFin, 'Number of providers in the platform', y);
                const totalW = w1 + w2;
                result = totalW > 0 ? (metricVal1 * w1 + metricVal2 * w2) / totalW : 0;
              } else if (name === '# of yearly bookings per pet owners' || name === 'Unit Customer Support cost - Owners') {
                const w1 = getVal(ptFin, 'Number of owners in the platform', y);
                const w2 = getVal(ukFin, 'Number of owners in the platform', y);
                const totalW = w1 + w2;
                result = totalW > 0 ? (metricVal1 * w1 + metricVal2 * w2) / totalW : 0;
              } else if (name === 'Unit CAC - Providers') {
                const w1 = getVal(ptFin, 'New providers added', y);
                const w2 = getVal(ukFin, 'New providers added', y);
                const totalW = w1 + w2;
                result = totalW > 0 ? (metricVal1 * w1 + metricVal2 * w2) / totalW : 0;
              } else if (name === 'Unit CAC - Owners') {
                const w1 = getVal(ptFin, 'New owners added', y);
                const w2 = getVal(ukFin, 'New owners added', y);
                const totalW = w1 + w2;
                result = totalW > 0 ? (metricVal1 * w1 + metricVal2 * w2) / totalW : 0;
              } else if (name === 'Provider churn rate (%)') {
                const w1 = y > 0 ? getVal(ptFin, 'Number of providers in the platform', y - 1) : getVal(ptFin, 'Number of providers in the platform', y);
                const w2 = y > 0 ? getVal(ukFin, 'Number of providers in the platform', y - 1) : getVal(ukFin, 'Number of providers in the platform', y);
                const totalW = w1 + w2;
                result = totalW > 0 ? (metricVal1 * w1 + metricVal2 * w2) / totalW : (metricVal1 + metricVal2) / 2;
              } else if (name === 'Owner churn rate (%)') {
                const w1 = y > 0 ? getVal(ptFin, 'Number of owners in the platform', y - 1) : getVal(ptFin, 'Number of owners in the platform', y);
                const w2 = y > 0 ? getVal(ukFin, 'Number of owners in the platform', y - 1) : getVal(ukFin, 'Number of owners in the platform', y);
                const totalW = w1 + w2;
                result = totalW > 0 ? (metricVal1 * w1 + metricVal2 * w2) / totalW : (metricVal1 + metricVal2) / 2;
              } else {
                result = metricVal1 + metricVal2;
                if (name === 'FX rate (GBP / EUR)') {
                  result = metricVal2; // Only UK has this, return its value
                }
              }
              return Number(result.toFixed(2));
            }

            return metricVal1 + metricVal2;
          });

          return {
            id: `agg-${name}`,
            name,
            amounts,
            isPermanent: st1?.isPermanent || st2?.isPermanent,
            isCalculated: st1?.isCalculated || st2?.isCalculated
          };
        });
      };

      const totalRevenueByYear = years.map(y => ptFin.totalRevenueByYear[y] + ukFin.totalRevenueByYear[y]);
      const totalGrossRevenueByYear = years.map(y => (ptFin.totalGrossRevenueByYear?.[y] || 0) + (ukFin.totalGrossRevenueByYear?.[y] || 0));
      const totalVarCostsByYear = years.map(y => ptFin.totalVarCostsByYear[y] + ukFin.totalVarCostsByYear[y]);
      const totalFixedCostsByYear = years.map(y => ptFin.totalFixedCostsByYear[y] + ukFin.totalFixedCostsByYear[y]);
      const totalPlatformMetricsByYear = years.map(y => ptFin.totalPlatformMetricsByYear[y] + ukFin.totalPlatformMetricsByYear[y]);
      const grossMarginByYear = years.map(y => ptFin.grossMarginByYear[y] + ukFin.grossMarginByYear[y]);
      const opProfitByYear = years.map(y => ptFin.opProfitByYear[y] + ukFin.opProfitByYear[y]);

      const totalRevenue = ptFin.totalRevenue + ukFin.totalRevenue;
      const totalGrossRevenue = ptFin.totalGrossRevenue + ukFin.totalGrossRevenue;
      const totalVariableCosts = ptFin.totalVariableCosts + ukFin.totalVariableCosts;
      const fixedCosts = ptFin.fixedCosts + ukFin.fixedCosts;
      const totalPlatformMetrics = ptFin.totalPlatformMetrics + ukFin.totalPlatformMetrics;
      const grossMargin = ptFin.grossMargin + ukFin.grossMargin;
      const operatingProfit = ptFin.operatingProfit + ukFin.operatingProfit;

      const calculatedMarginPercent = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;
      const calculatedOpProfitPercent = totalRevenue > 0 ? (operatingProfit / totalRevenue) * 100 : 0;
      const grossMarginPercentByYear = years.map(y => totalRevenueByYear[y] > 0 ? (grossMarginByYear[y] / totalRevenueByYear[y]) * 100 : 0);
      const opProfitPercentByYear = years.map(y => totalRevenueByYear[y] > 0 ? (opProfitByYear[y] / totalRevenueByYear[y]) * 100 : 0);

    const taxByYear: number[] = years.map(i => ptFin.taxByYear[i] + ukFin.taxByYear[i]);
    const netIncomeByYear: number[] = years.map(i => ptFin.netIncomeByYear[i] + ukFin.netIncomeByYear[i]);

    const totalTaxes = taxByYear.reduce((a, b) => a + b, 0);
    const totalNetIncome = netIncomeByYear.reduce((a, b) => a + b, 0);

    const defRevBalance = years.map(y => totalGrossRevenueByYear[y] * 0.01);
    const accruedFeesBalance = years.map(y => totalGrossRevenueByYear[y] * 0.03);

    const increaseDefRev: number[] = [];
    const increaseAccruedFees: number[] = [];
    const cashFromOp: number[] = [];

    for (let i = 0; i < 5; i++) {
        increaseDefRev[i] = i === 0 ? defRevBalance[i] : defRevBalance[i] - defRevBalance[i - 1];
        increaseAccruedFees[i] = i === 0 ? accruedFeesBalance[i] : accruedFeesBalance[i] - accruedFeesBalance[i - 1];
        cashFromOp[i] = netIncomeByYear[i] + increaseDefRev[i] + increaseAccruedFees[i]; 
    }

    const cashFromFinancing = years.map(i => ptFin.cashFromFinancing[i] + ukFin.cashFromFinancing[i]);

    const netIncreaseInCash: number[] = [];
    const cashBalanceBeginning: number[] = [];
    const cashBalanceEnd: number[] = [];

    let currentCash = 0;
    for (let i = 0; i < 5; i++) {
        cashBalanceBeginning[i] = currentCash;
        netIncreaseInCash[i] = cashFromOp[i] + cashFromFinancing[i];
        currentCash += netIncreaseInCash[i];
        cashBalanceEnd[i] = currentCash;
    }

    const shareCapital = years.map(i => ptFin.shareCapital[i] + ukFin.shareCapital[i]);
    const retainedEarnings: number[] = [];
    let currentRE = 0;
    for (let i = 0; i < 5; i++) {
        retainedEarnings[i] = currentRE;
        currentRE += netIncomeByYear[i];
    }

    const totalEquity = years.map(i => shareCapital[i] + retainedEarnings[i] + netIncomeByYear[i]);
    const totalLiabilities = years.map(i => defRevBalance[i] + accruedFeesBalance[i]);

    const WACC = (17.3 + (waccMod || 0)) / 100;
    const npv = cashFromOp.reduce((acc, cf, t) => acc + cf / Math.pow(1 + WACC, t + 1), 0);
    
    let irr = 0;
    const maxTries = 1000;
    const tolerance = 1e-5;
    let rate = 0.1;
    for (let i = 0; i < maxTries; i++) {
        let npvCalc = 0;
        let dNpv = 0;
        for (let t = 0; t < 5; t++) {
            npvCalc += cashFromOp[t] / Math.pow(1 + rate, t + 1);
            dNpv -= (t + 1) * cashFromOp[t] / Math.pow(1 + rate, t + 2);
        }
        if (Math.abs(dNpv) < 1e-8) break;
        const newRate = rate - npvCalc / dNpv;
        if (Math.abs(newRate - rate) < tolerance) {
            irr = newRate;
            break;
        }
        rate = newRate;
    }

    let paybackPeriod: number | null = null;
    let cumCf = 0;
    for (let t = 0; t < 5; t++) {
        const nextCumCf = cumCf + cashFromOp[t];
        if (cumCf < 0 && nextCumCf >= 0 && paybackPeriod === null) {
            paybackPeriod = t + Math.abs(cumCf) / cashFromOp[t];
        }
        cumCf = nextCumCf;
    }

    let discountedPaybackPeriod: number | null = null;
    let cumDcf = 0;
    for (let t = 0; t < 5; t++) {
        const dcf = cashFromOp[t] / Math.pow(1 + WACC, t + 1);
        const nextCumDcf = cumDcf + dcf;
        if (cumDcf < 0 && nextCumDcf >= 0 && discountedPaybackPeriod === null) {
            discountedPaybackPeriod = t + Math.abs(cumDcf) / dcf;
        }
        cumDcf = nextCumDcf;
    }

    const calculatedNetIncomePercent = totalRevenue > 0 ? (totalNetIncome / totalRevenue) * 100 : 0;

      const totalInvestment = ptFin.equityInjection.reduce((a, b) => a + b, 0) + ukFin.equityInjection.reduce((a, b) => a + b, 0);
      const roi = totalInvestment > 0 ? ((totalNetIncome / 5) / totalInvestment) : 0;
    const totalRoi = totalInvestment > 0 ? (totalNetIncome / totalInvestment) : 0;

      return {
        platformMetricsStreams: aggregateStreams(ptFin.platformMetricsStreams, ukFin.platformMetricsStreams, true),
        revenueStreams: aggregateStreams(ptFin.revenueStreams, ukFin.revenueStreams),
        variableCostsStreams: aggregateStreams(ptFin.variableCostsStreams, ukFin.variableCostsStreams),
        fixedCostsStreams: aggregateStreams(ptFin.fixedCostsStreams, ukFin.fixedCostsStreams),
        derivedRevenueStreams: aggregateStreams(ptFin.derivedRevenueStreams, ukFin.derivedRevenueStreams),
        derivedVariableCostsStreams: aggregateStreams(ptFin.derivedVariableCostsStreams, ukFin.derivedVariableCostsStreams),
        derivedFixedCostsStreams: aggregateStreams(ptFin.derivedFixedCostsStreams, ukFin.derivedFixedCostsStreams),
        chargeSubscription: ptFin.chargeSubscription.map((v, i) => v || ukFin.chargeSubscription[i]),
        chargeBookingFees: ptFin.chargeBookingFees.map((v, i) => v || ukFin.chargeBookingFees[i]),
        totalRevenueByYear,
        totalGrossRevenueByYear,
        totalVarCostsByYear,
        totalFixedCostsByYear,
        totalPlatformMetricsByYear,
        grossMarginByYear,
        grossMarginPercentByYear,
        opProfitByYear,
        opProfitPercentByYear,
        netIncomeByYear,
        taxByYear,
        defRevBalance,
        accruedFeesBalance,
        increaseDefRev,
    increaseAccruedFees,
    cashFromOp,
        cashFromFinancing,
        netIncreaseInCash,
        cashBalanceBeginning,
        cashBalanceEnd,
        shareCapital,
        retainedEarnings,
        totalEquity,
        totalLiabilities,
        totalRevenue,
        totalGrossRevenue,
        totalVariableCosts,
        fixedCosts,
        totalPlatformMetrics,
        grossMargin,
        operatingProfit,
        totalTaxes,
        totalNetIncome,
        calculatedMarginPercent,
        calculatedOpProfitPercent,
        calculatedNetIncomePercent,
        npv,
        irr,
        roi,
        totalRoi,
        paybackPeriod,
        discountedPaybackPeriod
      };
    }
    const currentMarketData = marketsFilled[activeMarket as 'Portugal' | 'UK'];


    return {
      ...currentMarketData,
      ...calculateFinancials(currentMarketData, activeMarket as 'Portugal' | 'UK', activeMarket === 'Portugal' ? modsPt : modsUk, waccMod)
    };

  };

  const {

    platformMetricsStreams,
    revenueStreams,
    variableCostsStreams,
    fixedCostsStreams,
    chargeSubscription,
    chargeBookingFees,
    derivedRevenueStreams,
    derivedVariableCostsStreams,
    derivedFixedCostsStreams,
    totalRevenueByYear,
    totalGrossRevenueByYear,
    totalVarCostsByYear,
    totalFixedCostsByYear,
    totalPlatformMetricsByYear,
    grossMarginByYear,
    grossMarginPercentByYear,
    opProfitByYear,
    opProfitPercentByYear,
    netIncomeByYear,
    taxByYear,
    defRevBalance,
    accruedFeesBalance,
    increaseDefRev,
    increaseAccruedFees,
    cashFromOp,
    cashFromFinancing,
    netIncreaseInCash,
    cashBalanceBeginning,
    cashBalanceEnd,
    shareCapital,
    retainedEarnings,
    totalEquity,
    totalLiabilities,
    totalRevenue,
    totalGrossRevenue,
    totalVariableCosts,
    totalInvestment,
    fixedCosts,
    totalPlatformMetrics,
    grossMargin,
    operatingProfit,
    totalTaxes,
    totalNetIncome,
    calculatedMarginPercent,
    calculatedOpProfitPercent,
    calculatedNetIncomePercent,
    npv,
    irr,
    roi,
    totalRoi,
    paybackPeriod,
    discountedPaybackPeriod
  } = React.useMemo(() => computeAllFinancials(markets, activeMarket), [activeMarket, markets]);


  
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
    const blendedCLV = totalNewUsers > 0 ? ((providerCLV * totalNewP) + (ownerCLV * totalNewO)) / totalNewUsers : 0;

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

  const getBookingsTotal = (marketCode: 'Portugal' | 'UK', adjustedDerived?: any) => {
    const derived = adjustedDerived ? adjustedDerived : calculateFinancials(markets[marketCode], marketCode);
    const owners = derived.platformMetricsStreams.find((s: any) => s.name === 'Number of owners in the platform');
    const bp = derived.platformMetricsStreams.find((s: any) => s.name === '# of yearly bookings per pet owners');
    let sum = 0;
    for (let i = 0; i < 5; i++) {
      sum += (Number(owners?.amounts?.[i]) || 0) * (Number(bp?.amounts?.[i]) || 0);
    }
    return sum;
  };

  const sensitivityData = React.useMemo(() => {
    const adjusted = computeAllFinancials(markets, activeMarket, sensitivityMods.Portugal, sensitivityMods.UK, sensitivityMods.wacc);

    // If it's aggregated, we still want ptBookings and ukBookings. 
    // We can run calculateFinancials directly for each market if we want,
    // or just rely on the fact that aggregated doesn't have ptBookings easily accessible in 'adjusted'.
    // Actually, let's just do:
    const ptAdj = activeMarket === 'Consolidated' ? calculateFinancials(markets.Portugal, 'Portugal', sensitivityMods) : (activeMarket === 'Portugal' ? adjusted : null);
    const ukAdj = activeMarket === 'Consolidated' ? calculateFinancials(markets.UK, 'UK', sensitivityMods) : (activeMarket === 'UK' ? adjusted : null);

    return { 
      data: {
        grossRev: adjusted.totalGrossRevenueByYear,
        netRev: adjusted.totalRevenueByYear,
        cogs: adjusted.totalVarCostsByYear,
        margin: adjusted.grossMarginByYear,
        fixedCosts: adjusted.totalFixedCostsByYear,
        opProfit: adjusted.opProfitByYear,
        netIncome: adjusted.netIncomeByYear
      },
      totals: {
        grossRev: adjusted.totalGrossRevenue,
        netRev: adjusted.totalRevenue,
        cogs: adjusted.totalVariableCosts,
        margin: adjusted.grossMargin,
        fixedCosts: adjusted.fixedCosts,
        opProfit: adjusted.operatingProfit,
        netIncome: adjusted.totalNetIncome
      },
      metrics: {
        npv: adjusted.npv,
        irr: adjusted.irr,
        roi: adjusted.roi,
        totalRoi: adjusted.totalRoi,
        paybackPeriod: adjusted.paybackPeriod,
        discountedPaybackPeriod: adjusted.discountedPaybackPeriod
      },
      ptBookings: ptAdj ? getBookingsTotal('Portugal', ptAdj) : 0, 
      ukBookings: ukAdj ? getBookingsTotal('UK', ukAdj) : 0
    };
  }, [markets, activeMarket, sensitivityMods]);

  const getCurrencySymbol = () => activeMarket === 'UK' ? '£' : '€';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: activeMarket === 'UK' ? 'GBP' : 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const addStream = (streams: FinancialStream[], prefix: string, key: keyof MarketData) => {
    if (activeMarket === 'Consolidated') return;
    const sectionId = prefix.toLowerCase().replace(/\s+/g, '-');
    const newStream = { id: `${sectionId}-${Date.now()}`, name: `${prefix} ${streams.length + 1}`, amounts: ['', '', '', '', ''] };
    updateMarketData(prev => ({
      ...prev,
      [key]: [...(prev[key] as FinancialStream[]), newStream]
    }));
  };

  const updateStreamName = (streams: FinancialStream[], id: string, name: string, key: keyof MarketData) => {
    if (activeMarket === 'Consolidated') return;
    updateMarketData(prev => ({
      ...prev,
      [key]: (prev[key] as FinancialStream[]).map(stream => stream.id === id ? { ...stream, name } : stream)
    }));
  };

  const updateStreamAmount = (streams: FinancialStream[], id: string, yearIndex: number, value: number | '', key: keyof MarketData) => {
    if (activeMarket === 'Consolidated') return;
    updateMarketData(prev => ({
      ...prev,
      [key]: (prev[key] as FinancialStream[]).map(stream => {
        if (stream.id === id) {
          const newAmounts = [...stream.amounts];
          newAmounts[yearIndex] = value;
          return { ...stream, amounts: newAmounts };
        }
        return stream;
      })
    }));
  };

  const removeStream = (streams: FinancialStream[], id: string, key: keyof MarketData) => {
    if (activeMarket === 'Consolidated') return;
    updateMarketData(prev => ({
      ...prev,
      [key]: (prev[key] as FinancialStream[]).filter(stream => stream.id !== id)
    }));
  };

  const toggleCharge = (yearIndex: number, key: 'chargeSubscription' | 'chargeBookingFees') => {
    if (activeMarket === 'Consolidated') return;
    updateMarketData(prev => {
      const newVal = [...prev[key]];
      newVal[yearIndex] = !newVal[yearIndex];
      return { ...prev, [key]: newVal };
    });
  };

  const chartData = [...years.map(y => ({
    name: `Year ${y + 1}`,
    'Gross Revenues': totalGrossRevenueByYear[y],
    'Net Revenues': totalRevenueByYear[y],
    'COGS': totalVarCostsByYear[y],
    'Gross Margin': grossMarginByYear[y],
    'Fixed Costs': totalFixedCostsByYear[y],
    'Op. Profit': opProfitByYear[y]
  })), {
    name: 'Total',
    'Gross Revenues': totalGrossRevenue,
    'Net Revenues': totalRevenue,
    'COGS': totalVariableCosts,
    'Gross Margin': grossMargin,
    'Fixed Costs': fixedCosts,
    'Op. Profit': operatingProfit
  }];

  const viabilityChartData = React.useMemo(() => {
    return [
      ...years.map(y => {
        const retailSales = totalGrossRevenueByYear[y] || 0;
        const operatingCosts = (totalVarCostsByYear[y] || 0) + (totalFixedCostsByYear[y] || 0);
        const operatingProfit = opProfitByYear[y] || 0;
        return {
          name: `Year ${y + 1}`,
          'Retail Sales': retailSales,
          'Operating Costs': operatingCosts,
          'Operating Profit': operatingProfit,
        };
      }),
      {
        name: 'Total',
        'Retail Sales': totalGrossRevenue || 0,
        'Operating Costs': (totalVariableCosts || 0) + (fixedCosts || 0),
        'Operating Profit': operatingProfit || 0,
      }
    ];
  }, [years, totalGrossRevenueByYear, totalVarCostsByYear, totalFixedCostsByYear, opProfitByYear, totalGrossRevenue, totalVariableCosts, fixedCosts, operatingProfit]);

  const platformChartData = years.map(y => {
    const getVal = (name: string) => {
      const stream = platformMetricsStreams.find(s => s.name === name);
      return Number(stream?.amounts?.[y]) || 0;
    };
    return {
      name: `Year ${y + 1}`,
      'New Providers': getVal('New providers added') === 0 ? null : getVal('New providers added'),
      'Total Providers': getVal('Number of providers in the platform') === 0 ? null : getVal('Number of providers in the platform'),
      'Provider Churn': getVal('Provider churn rate (%)') === 0 ? null : getVal('Provider churn rate (%)'),
      'New Owners': getVal('New owners added') === 0 ? null : getVal('New owners added'),
      'Total Owners': getVal('Number of owners in the platform') === 0 ? null : getVal('Number of owners in the platform'),
      'Owner Churn': getVal('Owner churn rate (%)') === 0 ? null : getVal('Owner churn rate (%)'),
      'Number of Bookings': (getVal('Number of owners in the platform') * getVal('# of yearly bookings per pet owners')) === 0 ? null : (getVal('Number of owners in the platform') * getVal('# of yearly bookings per pet owners')),
    };
  });

  const formatTooltip = (value: any, name: any) => {
    const numValue = typeof value === 'number' ? value : Number(value);
    return [formatCurrency(numValue), name];
  };

  const formatCompactCurrency = (value: number) => {
    const sym = getCurrencySymbol();
    if (value === 0) return `${sym}0`;
    const absVal = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (absVal >= 1000000) return `${sign}${sym}${(absVal / 1000000).toFixed(1)}M`;
    if (absVal >= 1000) return `${sign}${sym}${(absVal / 1000).toFixed(0)}k`;
    return `${sign}${sym}${absVal}`;
  };

  const exportToCSV = () => {
    const rows: string[][] = [];
    
    // Header
    rows.push(['Category', 'Stream Name', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Total']);
    
    // Revenue Streams
    derivedRevenueStreams.forEach(stream => {
      rows.push(['Revenue', stream.name, ...stream.amounts.map(a => String(a || 0)), String(getStreamTotal(stream))]);
    });
    rows.push(['Revenue Total', '', ...totalRevenueByYear.map(String), String(totalRevenue)]);
    
    // COGS
    derivedVariableCostsStreams.forEach(stream => {
      rows.push(['COGS', stream.name, ...stream.amounts.map(a => String(a || 0)), String(getStreamTotal(stream))]);
    });
    rows.push(['COGS Total', '', ...totalVarCostsByYear.map(String), String(totalVariableCosts)]);
    
    // Fixed Costs
    derivedFixedCostsStreams.forEach(stream => {
      rows.push(['Fixed Cost', stream.name, ...stream.amounts.map(a => String(a || 0)), String(getStreamTotal(stream))]);
    });
    rows.push(['Fixed Cost Total', '', ...totalFixedCostsByYear.map(String), String(fixedCosts)]);
    
    // Summary
    rows.push(['Summary', 'Gross Margin', ...grossMarginByYear.map(String), String(grossMargin)]);
    rows.push(['Summary', 'Operating Profit', ...opProfitByYear.map(String), String(operatingProfit)]);
    
    // Platform Metrics
    rows.push([]);
    rows.push(['Platform Metrics', 'Stream Name', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Total']);
    platformMetricsStreams.forEach(stream => {
      rows.push(['Platform Metric', stream.name, ...stream.amounts.map(a => String(a || 0)), String(getStreamTotal(stream))]);
    });
    rows.push(['Platform Metric Total', '', ...totalPlatformMetricsByYear.map(String), String(totalPlatformMetrics)]);
    
    // Platform Settings
    rows.push([]);
    rows.push(['Platform Settings', 'Setting', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']);
    rows.push(['Platform Setting', 'Charge Subscription', ...chargeSubscription.map(v => v ? 'Yes' : 'No')]);
    rows.push(['Platform Setting', 'Charge Booking Fees', ...chargeBookingFees.map(v => v ? 'Yes' : 'No')]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.map(item => `"${String(item).replace(/"/g, '""')}"`).join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "financial_viability_tracker.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStreamTotal = (stream: FinancialStream) => stream.amounts.reduce((sum, val) => (sum as number) + (Number(val) || 0), 0) as number;

  const exportToXLSX = async () => {
    // 1. Capture charts
    const capturedImages: { name: string, data: string }[] = [];
    const filter = (node: HTMLElement) => !node.hasAttribute?.('data-export-exclude');
    
    const chartRefs = [
      { ref: financialOverviewChartRef, name: 'Financial Overview' },
      { ref: viabilityComparisonChartRef, name: 'Financial Viability Comparison' },
      { ref: providerAnalysisRef, name: 'Provider Analysis' },
      { ref: ownerAnalysisRef, name: 'Owner Analysis' },
      { ref: bookingsChartRef, name: 'Bookings Analysis' },
      { ref: providerChurnRef, name: 'Provider Churn Trend' },
      { ref: ownerChurnRef, name: 'Owner Churn Trend' },
      { ref: grossMarginChartRef, name: 'Gross Margin Trend' }
    ];

    for (const item of chartRefs) {
      if (item.ref?.current) {
        try {
          const dataUrl = await toPng(item.ref.current, { 
            backgroundColor: '#ffffff', 
            quality: 0.8,
            pixelRatio: 1.5,
            filter: filter as any
          });
          capturedImages.push({ name: item.name, data: dataUrl });
        } catch (err) {
          console.error(`Failed to capture ${item.name}:`, err);
        }
      }
    }

    const workbook = new ExcelJS.Workbook();
    const marketsToExport: Market[] = ['Portugal', 'UK', 'Consolidated'];

    const getColLetter = (col: number) => String.fromCharCode(65 + col);
    const getCellRef = (col: number, row: number | undefined) => {
      if (row === undefined || isNaN(row)) return '0';
      return `${getColLetter(col)}${row + 1}`;
    };

    const ptFin = { ...markets.Portugal, ...calculateFinancials(markets.Portugal, 'Portugal') };
    const ukFin = { ...markets.UK, ...calculateFinancials(markets.UK, 'UK') };

    const getUnion = (s1: FinancialStream[], s2: FinancialStream[], defaults: FinancialStream[]) => {
      const names = Array.from(new Set([...s1.map(s => s.name), ...s2.map(s => s.name)]));
      return names.sort((a, b) => {
        const idxA = defaults.findIndex(d => d.name === a);
        const idxB = defaults.findIndex(d => d.name === b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });
    };

    const platformUnion = getUnion(ptFin.platformMetricsStreams, ukFin.platformMetricsStreams, DEFAULT_PLATFORM_METRICS);
    const revenueUnion = getUnion(ptFin.derivedRevenueStreams, ukFin.derivedRevenueStreams, DEFAULT_REVENUE_STREAMS);
    const cogsUnion = getUnion(ptFin.derivedVariableCostsStreams, ukFin.derivedVariableCostsStreams, DEFAULT_VARIABLE_COSTS_STREAMS);
    const fixedUnion = getUnion(ptFin.derivedFixedCostsStreams, ukFin.derivedFixedCostsStreams, DEFAULT_FIXED_COSTS_STREAMS);

    marketsToExport.forEach(market => {
      const sheet = workbook.addWorksheet(market);
      let currentRow = 0;

      // Header
      sheet.addRow([`Market: ${market}`]); currentRow++;
      sheet.getRow(currentRow).font = { bold: true, size: 14 };
      sheet.addRow([]); currentRow++;
      sheet.addRow(['Category', 'Stream Name', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Total']); currentRow++;
      sheet.getRow(currentRow).font = { bold: true };

      const getStreamValue = (marketName: Market, category: string, streamName: string, yearIdx: number) => {
        const mData = marketName === 'Portugal' ? ptFin : ukFin;
        let streams: FinancialStream[] = [];
        if (category === 'Platform Metric') streams = mData.platformMetricsStreams;
        if (category === 'Revenue') streams = mData.derivedRevenueStreams;
        if (category === 'COGS') streams = mData.derivedVariableCostsStreams;
        if (category === 'Fixed Cost') streams = mData.derivedFixedCostsStreams;
        
        const stream = streams.find(s => s.name === streamName);
        return Number(stream?.amounts?.[yearIdx]) || 0;
      };

      // Platform Metrics
      const metricRowMap: Record<string, number> = {};
      const platformStartRowIdx = currentRow;
      const fxRateIdxInUnion = platformUnion.indexOf('FX rate (GBP / EUR)');

      platformUnion.forEach(name => {
        metricRowMap[name] = currentRow;
        const rowData: any[] = ['Platform Metric', name];
        years.forEach(y => {
          if (market === 'Consolidated') {
            const weightedMetrics = [
              '% of bookings commission',
              'Avg price per booking',
              'Monthly Subscription fee',
              '# of yearly bookings per pet owners',
              'Unit CAC - Providers',
              'Unit CAC - Owners',
              'Unit Customer Support cost - Providers',
              'Unit Customer Support cost - Owners',
              'Provider churn rate (%)',
              'Owner churn rate (%)',
              'Payment Fee %',
              'Payment Fee per Transaction'
            ];

            const col = getColLetter(2 + y);
            const getUkFxMulti = (colLetter: string) => fxRateIdxInUnion >= 0 ? `'UK'!${colLetter}${platformStartRowIdx + fxRateIdxInUnion + 1}` : "1";
            const fxMult = getUkFxMulti(col);

            if (weightedMetrics.includes(name)) {
              const row = currentRow + 1;
              const vPt = `'Portugal'!${col}${row}`;
              let vUk = `'UK'!${col}${row}`;
              
              if (['Avg price per booking', 'Monthly Subscription fee', 'Unit CAC - Providers', 'Unit CAC - Owners', 'Unit Customer Support cost - Providers', 'Unit Customer Support cost - Owners', 'Payment Fee per Transaction'].includes(name)) {
                vUk = `(${vUk} * ${fxMult})`;
              }

              let wPt = "";
              let wUk = "";

              if (name === '% of bookings commission') {
                const oRow = metricRowMap['Number of owners in the platform'];
                const bRow = metricRowMap['# of yearly bookings per pet owners'];
                const aRow = metricRowMap['Avg price per booking'];
                if (oRow !== undefined && bRow !== undefined && aRow !== undefined) {
                  wPt = `'Portugal'!${col}${oRow+1}*'Portugal'!${col}${bRow+1}*'Portugal'!${col}${aRow+1}`;
                  wUk = `(('UK'!${col}${oRow+1}*'UK'!${col}${bRow+1}*'UK'!${col}${aRow+1}) * ${fxMult})`;
                } else { wPt = "0"; wUk = "0"; }
              } else if (name === 'Avg price per booking') {
                const oRow = metricRowMap['Number of owners in the platform'];
                const bRow = metricRowMap['# of yearly bookings per pet owners'];
                if (oRow !== undefined && bRow !== undefined) {
                  wPt = `'Portugal'!${col}${oRow+1}*'Portugal'!${col}${bRow+1}`;
                  wUk = `'UK'!${col}${oRow+1}*'UK'!${col}${bRow+1}`;
                } else { wPt = "0"; wUk = "0"; }
              } else if (name === 'Monthly Subscription fee' || name === 'Unit Customer Support cost - Providers') {
                const wRow = metricRowMap['Number of providers in the platform'];
                if (wRow !== undefined) {
                  wPt = `'Portugal'!${col}${wRow+1}`;
                  wUk = `'UK'!${col}${wRow+1}`;
                } else { wPt = "0"; wUk = "0"; }
              } else if (name === '# of yearly bookings per pet owners' || name === 'Unit Customer Support cost - Owners') {
                const wRow = metricRowMap['Number of owners in the platform'];
                if (wRow !== undefined) {
                  wPt = `'Portugal'!${col}${wRow+1}`;
                  wUk = `'UK'!${col}${wRow+1}`;
                } else { wPt = "0"; wUk = "0"; }
              } else if (name === 'Unit CAC - Providers') {
                const wRow = metricRowMap['New providers added'];
                if (wRow !== undefined) {
                  wPt = `'Portugal'!${col}${wRow+1}`;
                  wUk = `'UK'!${col}${wRow+1}`;
                } else { wPt = "0"; wUk = "0"; }
              } else if (name === 'Unit CAC - Owners') {
                const wRow = metricRowMap['New owners added'];
                if (wRow !== undefined) {
                  wPt = `'Portugal'!${col}${wRow+1}`;
                  wUk = `'UK'!${col}${wRow+1}`;
                } else { wPt = "0"; wUk = "0"; }
              } else if (name === 'Provider churn rate (%)') {
                const wRow = metricRowMap['Number of providers in the platform'];
                if (wRow !== undefined) {
                  const prevCol = y > 0 ? getColLetter(1 + y) : col;
                  wPt = `'Portugal'!${prevCol}${wRow+1}`;
                  wUk = `'UK'!${prevCol}${wRow+1}`;
                } else { wPt = "0"; wUk = "0"; }
              } else if (name === 'Owner churn rate (%)') {
                const wRow = metricRowMap['Number of owners in the platform'];
                if (wRow !== undefined) {
                  const prevCol = y > 0 ? getColLetter(1 + y) : col;
                  wPt = `'Portugal'!${prevCol}${wRow+1}`;
                  wUk = `'UK'!${prevCol}${wRow+1}`;
                } else { wPt = "0"; wUk = "0"; }
              } else if (name === 'Payment Fee %' || name === 'Payment Fee per Transaction') {
                wPt = "1";
                wUk = "1";
              }
              rowData.push({ formula: `IF((${wPt}+${wUk})>0, (${vPt}*${wPt} + ${vUk}*${wUk})/(${wPt}+${wUk}), 0)` });
            } else {
              const isCurr = ['FX rate (GBP / EUR)'].includes(name) ? false : true; 
              // Wait, FX rate itself shouldn't be multiplied by FX rate! And regular metrics like # providers shouldn't either?
              // Existing logic just summed them!
              if (name === 'FX rate (GBP / EUR)') {
                rowData.push({ formula: `'UK'!${col}${currentRow+1}` });
              } else {
                rowData.push({ formula: `'Portugal'!${col}${currentRow+1} + 'UK'!${col}${currentRow+1}` });
              }
            }
          } else {
            const val = getStreamValue(market as Market, 'Platform Metric', name, y);
            if (name === 'Number of providers in the platform') {
              const newRow = metricRowMap['New providers added'];
              const churnRow = metricRowMap['Provider churn rate (%)'];
              const col = getColLetter(2 + y);
              const prevCol = y > 0 ? getColLetter(1 + y) : null;
              if (newRow !== undefined && churnRow !== undefined) {
                const newRef = `${col}${newRow+1}`;
                const churnRef = `${col}${churnRow+1}`;
                const prevRef = prevCol ? `${prevCol}${currentRow+1}` : "0";
                rowData.push({ formula: `ROUND(${prevRef} * (1 - ${churnRef}) + ${newRef}, 0)` });
              } else { rowData.push(val); }
            } else if (name === 'Number of owners in the platform') {
              const newRow = metricRowMap['New owners added'];
              const churnRow = metricRowMap['Owner churn rate (%)'];
              const col = getColLetter(2 + y);
              const prevCol = y > 0 ? getColLetter(1 + y) : null;
              if (newRow !== undefined && churnRow !== undefined) {
                const newRef = `${col}${newRow+1}`;
                const churnRef = `${col}${churnRow+1}`;
                const prevRef = prevCol ? `${prevCol}${currentRow+1}` : "0";
                rowData.push({ formula: `ROUND(${prevRef} * (1 - ${churnRef}) + ${newRef}, 0)` });
              } else { rowData.push(val); }
            } else {
              const sensCell: Record<string, string> = {
                'New owners added': 'B4',
                'New providers added': 'B5',
                'Owner churn rate (%)': 'B6',
                'Provider churn rate (%)': 'B7',
                'Avg price per booking': 'B9',
                '% of bookings commission': 'B10',
                'Monthly Subscription fee': 'B11',
                '# of yearly bookings per pet owners': 'B12'
              };
              const cell = sensCell[name];
              let baseVal = name.includes('%') ? val / 100 : val;
              if (cell) {
                rowData.push({ formula: `${baseVal} * (1 + 'Sensitivity Analysis'!${cell}/100)` });
              } else {
                rowData.push(baseVal);
              }
            }
          }
        });
        sheet.addRow(rowData);
        const addedRow = sheet.getRow(currentRow + 1);
        if (name.includes('%') || name.includes('rate')) {
          for (let i = 3; i <= 7; i++) {
            addedRow.getCell(i).numFmt = '0.0%';
          }
        }
        currentRow++;
      });

      const providersRow = metricRowMap['Number of providers in the platform'];
      const subFeeRow = metricRowMap['Monthly Subscription fee'];
      const ownersRow = metricRowMap['Number of owners in the platform'];
      const bookingsPerOwnerRow = metricRowMap['# of yearly bookings per pet owners'];
      const avgPriceRow = metricRowMap['Avg price per booking'];

      sheet.addRow([]); currentRow++;

      // Platform Settings
      sheet.addRow(['Platform Settings', 'Setting', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']); currentRow++;
      sheet.getRow(currentRow).font = { bold: true };
      
      const chargeSubRowIdx = currentRow;
      const ptSub = markets.Portugal.chargeSubscription;
      const ukSub = markets.UK.chargeSubscription;
      sheet.addRow(['Platform Setting', 'Charge Subscription', ...years.map(y => {
        if (market === 'Consolidated') return { formula: `MAX('Portugal'!${getCellRef(2 + y, chargeSubRowIdx)}, 'UK'!${getCellRef(2 + y, chargeSubRowIdx)})` };
        return (market === 'Portugal' ? ptSub[y] : ukSub[y]) ? 1 : 0;
      })]); currentRow++;
      
      const chargeBookingRowIdx = currentRow;
      const ptBook = markets.Portugal.chargeBookingFees;
      const ukBook = markets.UK.chargeBookingFees;
      sheet.addRow(['Platform Setting', 'Charge Booking Fees', ...years.map(y => {
        if (market === 'Consolidated') return { formula: `MAX('Portugal'!${getCellRef(2 + y, chargeBookingRowIdx)}, 'UK'!${getCellRef(2 + y, chargeBookingRowIdx)})` };
        return (market === 'Portugal' ? ptBook[y] : ukBook[y]) ? 1 : 0;
      })]); currentRow++;

      sheet.addRow([]); currentRow++;

      const revenueRowsCount = revenueUnion.length + 3;
      const cogsRowsCount = cogsUnion.length + 3;
      const fixedRowsCount = fixedUnion.length + 3;
      const summaryRowsCount = 15;
      
      const breakdownStartRowIdx = currentRow + revenueRowsCount + cogsRowsCount + fixedRowsCount + summaryRowsCount;
      const feePctRowIdx = breakdownStartRowIdx + 1;
      const feeFixedRowIdx = breakdownStartRowIdx + 2;
      const subVolRowIdx = breakdownStartRowIdx + 3;
      const bookVolRowIdx = breakdownStartRowIdx + 4;
      const subTransRowIdx = breakdownStartRowIdx + 5;
      const bookTransRowIdx = breakdownStartRowIdx + 6;

      // Revenue Streams
      sheet.addRow(['Category', 'Stream Name', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Total']); currentRow++;
      sheet.getRow(currentRow).font = { bold: true };
      const revenueStartRowIdx = currentRow;
      revenueUnion.forEach(name => {
        const rowData: any[] = ['Revenue', name];
        const streamId = ptFin.derivedRevenueStreams.find(s => s.name === name)?.id || ukFin.derivedRevenueStreams.find(s => s.name === name)?.id;
        if (market === 'Consolidated') {
          years.forEach(y => {
            const col = getColLetter(2 + y);
            const getUkFxMulti = (c: string) => fxRateIdxInUnion >= 0 ? `'UK'!${c}${platformStartRowIdx + fxRateIdxInUnion + 1}` : "1";
            rowData.push({ formula: `'Portugal'!${col}${currentRow + 1} + ('UK'!${col}${currentRow + 1} * ${getUkFxMulti(col)})` });
          });
        } else if (streamId === 'rev-1' || name === 'Monthly Subscriptions') {
          years.forEach(y => rowData.push({ formula: `${getCellRef(2 + y, providersRow)}*${getCellRef(2 + y, subFeeRow)}*${getCellRef(2 + y, chargeSubRowIdx)}*12` }));
        } else if (streamId === 'rev-2' || name === 'Booking Fees') {
          const commissionRow = metricRowMap['% of bookings commission'];
          years.forEach(y => rowData.push({ formula: `${getCellRef(2 + y, ownersRow)}*${getCellRef(2 + y, bookingsPerOwnerRow)}*${getCellRef(2 + y, avgPriceRow)}*${getCellRef(2 + y, commissionRow)}*${getCellRef(2 + y, chargeBookingRowIdx)}` }));
        } else {
          years.forEach(y => rowData.push(getStreamValue(market as Market, 'Revenue', name, y)));
        }
        rowData.push({ formula: `SUM(C${currentRow + 1}:G${currentRow + 1})` });
        sheet.addRow(rowData); currentRow++;
      });
      const revenueEndRowIdx = currentRow - 1;
      const revenueTotalRowIdx = currentRow;
      sheet.addRow([
        'Revenue Total', 
        '', 
        ...years.map(y => ({ formula: `SUM(${getCellRef(2 + y, revenueStartRowIdx)}:${getCellRef(2 + y, revenueEndRowIdx)})` })),
        { formula: `SUM(C${currentRow + 1}:G${currentRow + 1})` }
      ]);
      sheet.getRow(currentRow + 1).font = { bold: true };
      currentRow++;

      sheet.addRow([]); currentRow++;

      // COGS
      sheet.addRow(['Category', 'Stream Name', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Total']); currentRow++;
      sheet.getRow(currentRow).font = { bold: true };
      const cogsStartRowIdx = currentRow;
      cogsUnion.forEach(name => {
        const rowData: any[] = ['COGS', name];
        if (market === 'Consolidated') {
          years.forEach(y => {
            const col = getColLetter(2 + y);
            const getUkFxMulti = (c: string) => fxRateIdxInUnion >= 0 ? `'UK'!${c}${platformStartRowIdx + fxRateIdxInUnion + 1}` : "1";
            rowData.push({ formula: `'Portugal'!${col}${currentRow + 1} + ('UK'!${col}${currentRow + 1} * ${getUkFxMulti(col)})` });
          });
        } else if (name === 'Payment Processing') {
          years.forEach(y => {
            const colIdx = 2 + y;
            const vol = `(${getCellRef(colIdx, subVolRowIdx)}+${getCellRef(colIdx, bookVolRowIdx)})`;
            const trans = `(${getCellRef(colIdx, subTransRowIdx)}+${getCellRef(colIdx, bookTransRowIdx)})`;
            rowData.push({ formula: `(${vol}*${getCellRef(colIdx, feePctRowIdx)}) + (${trans}*${getCellRef(colIdx, feeFixedRowIdx)})` });
          });
        } else if (name === 'Customer acquisition costs') {
          const unitCacProvidersRow = metricRowMap['Unit CAC - Providers'];
          const unitCacOwnersRow = metricRowMap['Unit CAC - Owners'];
          const newProvidersRow = metricRowMap['New providers added'];
          const newOwnersRow = metricRowMap['New owners added'];
          years.forEach(y => {
            const colIdx = 2 + y;
            const ucp = getCellRef(colIdx, unitCacProvidersRow);
            const uco = getCellRef(colIdx, unitCacOwnersRow);
            const newP = getCellRef(colIdx, newProvidersRow);
            const newO = getCellRef(colIdx, newOwnersRow);
            rowData.push({ formula: `(${newP}*${ucp}) + (${newO}*${uco})` });
          });
        } else if (name === 'Customer Support') {
          const unitCsProvidersRow = metricRowMap['Unit Customer Support cost - Providers'];
          const unitCsOwnersRow = metricRowMap['Unit Customer Support cost - Owners'];
          years.forEach(y => {
            const colIdx = 2 + y;
            const p = getCellRef(colIdx, providersRow);
            const o = getCellRef(colIdx, ownersRow);
            const ucp = getCellRef(colIdx, unitCsProvidersRow);
            const uco = getCellRef(colIdx, unitCsOwnersRow);
            rowData.push({ formula: `(${p}*${ucp}) + (${o}*${uco})` });
          });
        } else {
          years.forEach(y => rowData.push(getStreamValue(market as Market, 'COGS', name, y)));
        }
        rowData.push({ formula: `SUM(C${currentRow + 1}:G${currentRow + 1})` });
        sheet.addRow(rowData); currentRow++;
      });
      const cogsEndRowIdx = currentRow - 1;
      const cogsTotalRowIdx = currentRow;
      sheet.addRow([
        'COGS Total', 
        '', 
        ...years.map(y => ({ formula: `SUM(${getCellRef(2 + y, cogsStartRowIdx)}:${getCellRef(2 + y, cogsEndRowIdx)})` })),
        { formula: `SUM(C${currentRow + 1}:G${currentRow + 1})` }
      ]);
      sheet.getRow(currentRow + 1).font = { bold: true };
      currentRow++;

      sheet.addRow([]); currentRow++;

      // Fixed Costs
      sheet.addRow(['Category', 'Stream Name', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Total']); currentRow++;
      sheet.getRow(currentRow).font = { bold: true };
      const fixedStartRowIdx = currentRow;
      fixedUnion.forEach(name => {
        const rowData: any[] = ['Fixed Cost', name];
        years.forEach(y => {
          if (market === 'Consolidated') {
            const col = getColLetter(2 + y);
            const getUkFxMulti = (c: string) => fxRateIdxInUnion >= 0 ? `'UK'!${c}${platformStartRowIdx + fxRateIdxInUnion + 1}` : "1";
            rowData.push({ formula: `'Portugal'!${col}${currentRow + 1} + ('UK'!${col}${currentRow + 1} * ${getUkFxMulti(col)})` });
          } else {
            const val = getStreamValue(market as Market, 'Fixed Cost', name, y);
            const sensCell: Record<string, string> = {
              'IT R&D and Support': 'B8',
              'Advertisement & Promotion': 'B9'
            };
            const cell = sensCell[name];
            if (cell) {
              rowData.push({ formula: `${val} * (1 + 'Sensitivity Analysis'!${cell}/100)` });
            } else {
              rowData.push(val);
            }
          }
        });
        rowData.push({ formula: `SUM(C${currentRow + 1}:G${currentRow + 1})` });
        sheet.addRow(rowData); currentRow++;
      });
      const fixedEndRowIdx = currentRow - 1;
      const fixedTotalRowIdx = currentRow;
      sheet.addRow([
        'Fixed Cost Total', 
        '', 
        ...years.map(y => ({ formula: `SUM(${getCellRef(2 + y, fixedStartRowIdx)}:${getCellRef(2 + y, fixedEndRowIdx)})` })),
        { formula: `SUM(C${currentRow + 1}:G${currentRow + 1})` }
      ]);
      sheet.getRow(currentRow + 1).font = { bold: true };
      currentRow++;

      sheet.addRow([]); currentRow++;

      // Summary
      sheet.addRow(['Summary', 'Metric', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Total']); currentRow++;
      sheet.getRow(currentRow).font = { bold: true };
      
      // Gross Revenues
      const grossRevRowIdx = currentRow;
      sheet.addRow([
        'Summary',
        'Gross Revenues',
        ...years.map(y => {
          const bfNames = Array.from(new Set([
            markets.Portugal.revenueStreams.find(s => s.id === 'rev-2')?.name,
            markets.UK.revenueStreams.find(s => s.id === 'rev-2')?.name
          ])).filter(Boolean) as string[];
          const bfRefs = bfNames.map(name => {
            const idx = revenueUnion.indexOf(name);
            return idx >= 0 ? getCellRef(2 + y, revenueStartRowIdx + idx) : '0';
          }).filter(ref => ref !== '0');
          const bfRefStr = bfRefs.length > 0 ? bfRefs.join('-') : '0';
          return { formula: `${getCellRef(2 + y, revenueTotalRowIdx)}-${bfRefStr}+${getCellRef(2 + y, bookVolRowIdx)}` };
        }),
        { formula: `SUM(C${currentRow + 1}:G${currentRow + 1})` }
      ]); currentRow++;

      // Net Revenues
      sheet.addRow([
        'Summary', 
        'Net Revenues', 
        ...years.map(y => ({ formula: getCellRef(2 + y, revenueTotalRowIdx) })),
        { formula: getCellRef(7, revenueTotalRowIdx) }
      ]); currentRow++;

      // COGS
      sheet.addRow([
        'Summary', 
        'COGS', 
        ...years.map(y => ({ formula: getCellRef(2 + y, cogsTotalRowIdx) })),
        { formula: getCellRef(7, cogsTotalRowIdx) }
      ]); currentRow++;

      // Gross Margin
      const gmRowIdx = currentRow;
      sheet.addRow([
        'Summary', 
        'Gross Margin', 
        ...years.map(y => ({ formula: `${getCellRef(2 + y, gmRowIdx - 2)}-${getCellRef(2 + y, gmRowIdx - 1)}` })),
        { formula: `${getCellRef(7, gmRowIdx - 2)}-${getCellRef(7, gmRowIdx - 1)}` }
      ]); currentRow++;

      // Gross Margin %
      sheet.addRow([
        'Summary', 
        'Gross Margin %', 
        ...years.map(y => ({ formula: `IF(${getCellRef(2 + y, gmRowIdx - 2)}>0, ${getCellRef(2 + y, gmRowIdx)}/${getCellRef(2 + y, gmRowIdx - 2)}, 0)` })),
        { formula: `IF(${getCellRef(7, gmRowIdx - 2)}>0, ${getCellRef(7, gmRowIdx)}/${getCellRef(7, gmRowIdx - 2)}, 0)` }
      ]); 
      sheet.getRow(currentRow).getCell(3).numFmt = '0.0%';
      sheet.getRow(currentRow).getCell(4).numFmt = '0.0%';
      sheet.getRow(currentRow).getCell(5).numFmt = '0.0%';
      sheet.getRow(currentRow).getCell(6).numFmt = '0.0%';
      sheet.getRow(currentRow).getCell(7).numFmt = '0.0%';
      sheet.getRow(currentRow).getCell(8).numFmt = '0.0%';
      currentRow++;

      // Fixed Costs
      sheet.addRow([
        'Summary', 
        'Fixed Costs', 
        ...years.map(y => ({ formula: getCellRef(2 + y, fixedTotalRowIdx) })),
        { formula: getCellRef(7, fixedTotalRowIdx) }
      ]); currentRow++;

      // Operating Profit
      const opRowIdx = currentRow;
      sheet.addRow([
        'Summary', 
        'Operating Profit', 
        ...years.map(y => ({ formula: `${getCellRef(2 + y, opRowIdx - 3)}-${getCellRef(2 + y, opRowIdx - 1)}` })),
        { formula: `${getCellRef(7, opRowIdx - 3)}-${getCellRef(7, opRowIdx - 1)}` }
      ]); currentRow++;

      // Operating Profit %
      sheet.addRow([
        'Summary', 
        'Operating Profit %', 
        ...years.map(y => ({ formula: `IF(${getCellRef(2 + y, gmRowIdx - 2)}>0, ${getCellRef(2 + y, opRowIdx)}/${getCellRef(2 + y, gmRowIdx - 2)}, 0)` })),
        { formula: `IF(${getCellRef(7, gmRowIdx - 2)}>0, ${getCellRef(7, opRowIdx)}/${getCellRef(7, gmRowIdx - 2)}, 0)` }
      ]);
      sheet.getRow(currentRow + 1).getCell(3).numFmt = '0.0%';
      sheet.getRow(currentRow + 1).getCell(4).numFmt = '0.0%';
      sheet.getRow(currentRow + 1).getCell(5).numFmt = '0.0%';
      sheet.getRow(currentRow + 1).getCell(6).numFmt = '0.0%';
      sheet.getRow(currentRow + 1).getCell(7).numFmt = '0.0%';
      sheet.getRow(currentRow + 1).getCell(8).numFmt = '0.0%';
      currentRow++;

      const accLossBegRowIdx = currentRow;
      sheet.addRow([
        'Summary',
        'Accumulated Loss (Beginning)',
        ...years.map(y => {
          if (market === 'Consolidated') {
            const col = getColLetter(2 + y);
            const getUkFxMulti = (c: string) => fxRateIdxInUnion >= 0 ? `'UK'!${c}${platformStartRowIdx + fxRateIdxInUnion + 1}` : "1";
            return { formula: `'Portugal'!${col}${currentRow + 1} + ('UK'!${col}${currentRow + 1} * ${getUkFxMulti(col)})` };
          }
          if (y === 0) return 0;
          return { formula: getCellRef(2 + y - 1, accLossBegRowIdx + 2) };
        }),
        { formula: `SUM(C${currentRow + 1}:G${currentRow + 1})` }
      ]); currentRow++;

      const taxableIncomeRowIdx = currentRow;
      sheet.addRow([
        'Summary',
        'Taxable Income',
        ...years.map(y => {
          if (market === 'Consolidated') {
            const col = getColLetter(2 + y);
            const getUkFxMulti = (c: string) => fxRateIdxInUnion >= 0 ? `'UK'!${c}${platformStartRowIdx + fxRateIdxInUnion + 1}` : "1";
            return { formula: `'Portugal'!${col}${currentRow + 1} + ('UK'!${col}${currentRow + 1} * ${getUkFxMulti(col)})` };
          }
          return { formula: `MAX(0, ${getCellRef(2 + y, opRowIdx)}+${getCellRef(2 + y, accLossBegRowIdx)})` };
        }),
        { formula: `SUM(C${currentRow + 1}:G${currentRow + 1})` }
      ]); currentRow++;

      const accLossEndRowIdx = currentRow;
      sheet.addRow([
        'Summary',
        'Accumulated Loss (Ending)',
        ...years.map(y => {
          if (market === 'Consolidated') {
            const col = getColLetter(2 + y);
            const getUkFxMulti = (c: string) => fxRateIdxInUnion >= 0 ? `'UK'!${c}${platformStartRowIdx + fxRateIdxInUnion + 1}` : "1";
            return { formula: `'Portugal'!${col}${currentRow + 1} + ('UK'!${col}${currentRow + 1} * ${getUkFxMulti(col)})` };
          }
          return { formula: `MIN(0, ${getCellRef(2 + y, opRowIdx)}+${getCellRef(2 + y, accLossBegRowIdx)})` };
        }),
        { formula: `SUM(C${currentRow + 1}:G${currentRow + 1})` }
      ]); currentRow++;

      sheet.addRow([
        'Summary',
        'Taxes',
        ...years.map(y => {
          if (market === 'Consolidated') {
            const col = getColLetter(2 + y);
            const getUkFxMulti = (c: string) => fxRateIdxInUnion >= 0 ? `'UK'!${c}${platformStartRowIdx + fxRateIdxInUnion + 1}` : "1";
            return { formula: `'Portugal'!${col}${currentRow + 1} + ('UK'!${col}${currentRow + 1} * ${getUkFxMulti(col)})` };
          }
          return { formula: `${getCellRef(2 + y, taxableIncomeRowIdx)}*0.21` };
        }),
        { formula: `SUM(C${currentRow + 1}:G${currentRow + 1})` }
      ]); currentRow++;

      const netIncomeRowIdx = currentRow;
      sheet.addRow([
        'Summary',
        'Net Income',
        ...years.map(y => ({ formula: `${getCellRef(2 + y, opRowIdx)}-${getCellRef(2 + y, currentRow - 1)}` })),
        { formula: `SUM(C${currentRow + 1}:G${currentRow + 1})` }
      ]); currentRow++;

      sheet.addRow([]); currentRow++;

      // Payment Processing Breakdown
      sheet.addRow(['Payment Processing Breakdown', 'Metric', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']); currentRow++;
      sheet.getRow(currentRow).font = { bold: true };

      const dynamicFeePctRowIdx = metricRowMap['Payment Fee %'];
      const dynamicFeePerTxRowIdx = metricRowMap['Payment Fee per Transaction'];

      sheet.addRow([
        'Breakdown', 
        'Payment Fee %', 
        ...years.map(y => (dynamicFeePctRowIdx !== undefined ? { formula: getCellRef(2 + y, dynamicFeePctRowIdx) } : 0.029))
      ]); 
      sheet.getRow(currentRow + 1).getCell(3).numFmt = '0.0%';
      sheet.getRow(currentRow + 1).getCell(4).numFmt = '0.0%';
      sheet.getRow(currentRow + 1).getCell(5).numFmt = '0.0%';
      sheet.getRow(currentRow + 1).getCell(6).numFmt = '0.0%';
      sheet.getRow(currentRow + 1).getCell(7).numFmt = '0.0%';
      currentRow++;

      sheet.addRow([
        'Breakdown', 
        'Payment Fee per Transaction', 
        ...years.map(y => (dynamicFeePerTxRowIdx !== undefined ? { formula: getCellRef(2 + y, dynamicFeePerTxRowIdx) } : 0.30))
      ]); currentRow++;

      if (market === 'Consolidated') {
        sheet.addRow(['Breakdown', 'Subscription Volume', ...years.map(y => {
          const col = getColLetter(2 + y);
          const getUkFxMulti = (c: string) => fxRateIdxInUnion >= 0 ? `'UK'!${c}${platformStartRowIdx + fxRateIdxInUnion + 1}` : "1";
          return { formula: `'Portugal'!${col}${currentRow + 1} + ('UK'!${col}${currentRow + 1} * ${getUkFxMulti(col)})` };
        })]);
      } else {
        sheet.addRow(['Breakdown', 'Subscription Volume', ...years.map(y => ({ formula: `${getCellRef(2 + y, providersRow)}*${getCellRef(2 + y, subFeeRow)}*${getCellRef(2 + y, chargeSubRowIdx)}*12` }))]);
      }
      currentRow++;

      if (market === 'Consolidated') {
        sheet.addRow(['Breakdown', 'Booking Volume', ...years.map(y => {
          const col = getColLetter(2 + y);
          const getUkFxMulti = (c: string) => fxRateIdxInUnion >= 0 ? `'UK'!${c}${platformStartRowIdx + fxRateIdxInUnion + 1}` : "1";
          return { formula: `'Portugal'!${col}${currentRow + 1} + ('UK'!${col}${currentRow + 1} * ${getUkFxMulti(col)})` };
        })]);
      } else {
        sheet.addRow(['Breakdown', 'Booking Volume', ...years.map(y => ({ formula: `${getCellRef(2 + y, ownersRow)}*${getCellRef(2 + y, bookingsPerOwnerRow)}*${getCellRef(2 + y, avgPriceRow)}` }))]);
      }
      currentRow++;

      if (market === 'Consolidated') {
        sheet.addRow(['Breakdown', 'Subscription Transactions', ...years.map(y => ({ formula: `'Portugal'!${getCellRef(2 + y, currentRow + 1)} + 'UK'!${getCellRef(2 + y, currentRow + 1)}` }))]);
      } else {
        sheet.addRow(['Breakdown', 'Subscription Transactions', ...years.map(y => ({ formula: `${getCellRef(2 + y, providersRow)}*12*${getCellRef(2 + y, chargeSubRowIdx)}` }))]);
      }
      currentRow++;

      if (market === 'Consolidated') {
        sheet.addRow(['Breakdown', 'Booking Transactions', ...years.map(y => ({ formula: `'Portugal'!${getCellRef(2 + y, currentRow + 1)} + 'UK'!${getCellRef(2 + y, currentRow + 1)}` }))]);
      } else {
        sheet.addRow(['Breakdown', 'Booking Transactions', ...years.map(y => ({ formula: `${getCellRef(2 + y, ownersRow)}*${getCellRef(2 + y, bookingsPerOwnerRow)}` }))]);
      }
      currentRow++;

      sheet.addRow([]); currentRow++;

      // Cash Flow Statement
      sheet.addRow(['Cash Flow Statement', 'Metric', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']); currentRow++;
      sheet.getRow(currentRow).font = { bold: true };
      
      const cfOpRowIdx = currentRow;
      const defRevRowIdx = cfOpRowIdx + 26;
      const accFeeRowIdx = cfOpRowIdx + 27;
      
      sheet.addRow([
        'Cash Flow',
        'Net Income',
        ...years.map(y => ({ formula: getCellRef(2 + y, netIncomeRowIdx) }))
      ]); currentRow++;

      sheet.addRow([
        'Cash Flow',
        'Depreciation & Amortization',
        ...years.map(y => 0)
      ]); currentRow++;

      sheet.addRow([
        'Cash Flow',
        '(+) Increase in Deferred Revenue',
        ...years.map(y => {
          if (y === 0) return { formula: getCellRef(2 + y, defRevRowIdx) };
          return { formula: `${getCellRef(2 + y, defRevRowIdx)}-${getCellRef(2 + y - 1, defRevRowIdx)}` };
        })
      ]); currentRow++;

      sheet.addRow([
        'Cash Flow',
        '(+) Increase in Accrued Provider Fees',
        ...years.map(y => {
          if (y === 0) return { formula: getCellRef(2 + y, accFeeRowIdx) };
          return { formula: `${getCellRef(2 + y, accFeeRowIdx)}-${getCellRef(2 + y - 1, accFeeRowIdx)}` };
        })
      ]); currentRow++;
      
      const netCfOpRowIdx = currentRow;
      sheet.addRow([
        'Cash Flow',
        '= Net Cash from Operating Activities',
        ...years.map(y => ({ formula: `SUM(${getCellRef(2 + y, cfOpRowIdx)}:${getCellRef(2 + y, currentRow - 1)})` }))
      ]); 
      sheet.getRow(currentRow + 1).font = { bold: true };
      currentRow++;

      sheet.addRow([
        'Cash Flow',
        '(-) Capital Expenditures (CapEx / IT)',
        ...years.map(y => 0)
      ]); currentRow++;

      const netCfInvRowIdx = currentRow;
      sheet.addRow([
        'Cash Flow',
        '= Net Cash from Investing Activities',
        ...years.map(y => ({ formula: getCellRef(2 + y, currentRow - 1) }))
      ]); 
      sheet.getRow(currentRow + 1).font = { bold: true };
      currentRow++;

      const issuanceOfShareCapitalRowIdx = currentRow;
      sheet.addRow([
        'Cash Flow',
        '(+) Issuance of Share Capital (Equity)',
        ...years.map(y => {
          if (market === 'Consolidated') {
            const col = getColLetter(2 + y);
            const getUkFxMulti = (c: string) => fxRateIdxInUnion >= 0 ? `'UK'!${c}${platformStartRowIdx + fxRateIdxInUnion + 1}` : "1";
            return { formula: `'Portugal'!${col}${currentRow + 1} + ('UK'!${col}${currentRow + 1} * ${getUkFxMulti(col)})` };
          }
          if (market === 'Portugal') {
            if (y === 0) return 600000;
            if (y === 1) return 500000;
            return 0;
          }
          if (market === 'UK') {
            if (y === 2) return 1800000;
            return 0;
          }
          return 0;
        })
      ]); currentRow++;

      const netCfFinRowIdx = currentRow;
      sheet.addRow([
        'Cash Flow',
        '= Net Cash from Financing Activities',
        ...years.map(y => ({ formula: getCellRef(2 + y, currentRow - 1) }))
      ]); 
      sheet.getRow(currentRow + 1).font = { bold: true };
      currentRow++;

      const netIncCashRowIdx = currentRow;
      sheet.addRow([
        'Cash Flow',
        'Net Increase in Cash for the Period',
        ...years.map(y => ({ formula: `${getCellRef(2 + y, netCfOpRowIdx)}+${getCellRef(2 + y, netCfInvRowIdx)}+${getCellRef(2 + y, netCfFinRowIdx)}` }))
      ]); 
      sheet.getRow(currentRow + 1).font = { bold: true };
      currentRow++;

      const cashBegRowIdx = currentRow;
      const cashEndRowIdx = currentRow + 1;
      
      sheet.addRow([
        'Cash Flow',
        'Cash Balance at Beginning of Period',
        0,
        { formula: getCellRef(2, cashEndRowIdx) },
        { formula: getCellRef(3, cashEndRowIdx) },
        { formula: getCellRef(4, cashEndRowIdx) },
        { formula: getCellRef(5, cashEndRowIdx) }
      ]); currentRow++;

      sheet.addRow([
        'Cash Flow',
        'Cash Balance at End of Period',
        ...years.map(y => ({ formula: `${getCellRef(2 + y, cashBegRowIdx)}+${getCellRef(2 + y, netIncCashRowIdx)}` }))
      ]); 
      sheet.getRow(currentRow + 1).font = { bold: true };
      currentRow++;

      sheet.addRow([]); currentRow++;

      // Balance Sheet
      sheet.addRow(['Balance Sheet', 'Metric', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']); currentRow++;
      sheet.getRow(currentRow).font = { bold: true };
      
      sheet.addRow(['Balance Sheet', 'ASSETS']); 
      sheet.getRow(currentRow + 1).font = { bold: true };
      currentRow++;
      
      sheet.addRow(['Balance Sheet', 'Current Assets']); currentRow++;
      
      sheet.addRow([
        'Balance Sheet',
        'Cash & Cash Equivalents',
        ...years.map(y => ({ formula: getCellRef(2 + y, cashEndRowIdx) }))
      ]); currentRow++;

      sheet.addRow([
        'Balance Sheet',
        'Accounts Receivable',
        ...years.map(y => 0)
      ]); currentRow++;

      sheet.addRow(['Balance Sheet', 'Non-Current Assets']); currentRow++;
      
      sheet.addRow([
        'Balance Sheet',
        'Intangible Assets (Software)',
        ...years.map(y => 0)
      ]); currentRow++;

      sheet.addRow([
        'Balance Sheet',
        'Property, Plant & Equipment',
        ...years.map(y => 0)
      ]); currentRow++;

      sheet.addRow([
        'Balance Sheet',
        'TOTAL ASSETS',
        ...years.map(y => ({ formula: `SUM(${getCellRef(2 + y, currentRow - 5)}:${getCellRef(2 + y, currentRow - 1)})` }))
      ]); 
      sheet.getRow(currentRow + 1).font = { bold: true };
      currentRow++;

      sheet.addRow([]); currentRow++;

      sheet.addRow(['Balance Sheet', 'LIABILITIES']); 
      sheet.getRow(currentRow + 1).font = { bold: true };
      currentRow++;

      sheet.addRow(['Balance Sheet', 'Current Liabilities']); currentRow++;

      sheet.addRow([
        'Balance Sheet',
        'Deferred Revenue',
        ...years.map(y => {
          const col = getColLetter(2 + y);
          return { formula: `IF(${col}${grossRevRowIdx + 1}=0,0,${col}${grossRevRowIdx + 1}*0.01)` };
        })
      ]); currentRow++;

      sheet.addRow([
        'Balance Sheet',
        'Accrued Provider Fees',
        ...years.map(y => {
          const col = getColLetter(2 + y);
          return { formula: `IF(${col}${grossRevRowIdx + 1}=0,0,${col}${grossRevRowIdx + 1}*0.03)` };
        })
      ]); currentRow++;

      sheet.addRow([
        'Balance Sheet',
        'Long-Term Debt',
        ...years.map(y => 0)
      ]); currentRow++;

      sheet.addRow([
        'Balance Sheet',
        'TOTAL LIABILITIES',
        ...years.map(y => ({ formula: `SUM(${getCellRef(2 + y, currentRow - 4)}:${getCellRef(2 + y, currentRow - 1)})` }))
      ]); 
      const totalLiabRowIdx = currentRow;
      sheet.getRow(currentRow + 1).font = { bold: true };
      currentRow++;

      sheet.addRow([]); currentRow++;
      
      sheet.addRow(['Balance Sheet', 'EQUITY']); 
      sheet.getRow(currentRow + 1).font = { bold: true };
      currentRow++;
      
      sheet.addRow([
        'Balance Sheet',
        'Share Capital',
        ...years.map(y => {
          if (y === 0) {
            return { formula: getCellRef(2 + y, issuanceOfShareCapitalRowIdx) };
          }
          return { formula: `${getCellRef(2 + y - 1, currentRow)}+${getCellRef(2 + y, issuanceOfShareCapitalRowIdx)}` };
        })
      ]); currentRow++;

      sheet.addRow([
        'Balance Sheet',
        'Retained Earnings',
        ...years.map(y => {
          if (y === 0) return 0;
          return { formula: `${getCellRef(2 + y - 1, currentRow)}+${getCellRef(2 + y - 1, netIncomeRowIdx)}` };
        })
      ]); currentRow++;

      sheet.addRow([
        'Balance Sheet',
        'Net Income',
        ...years.map(y => ({ formula: getCellRef(2 + y, netIncomeRowIdx) }))
      ]); currentRow++;

      sheet.addRow([
        'Balance Sheet',
        'TOTAL EQUITY',
        ...years.map(y => ({ formula: `SUM(${getCellRef(2 + y, currentRow - 3)}:${getCellRef(2 + y, currentRow - 1)})` }))
      ]); 
      const totalEquRowIdx = currentRow;
      sheet.getRow(currentRow + 1).font = { bold: true };
      currentRow++;

      sheet.addRow([
        'Balance Sheet',
        'TOTAL LIABILITIES & EQUITY',
        ...years.map(y => ({ formula: `${getCellRef(2 + y, totalLiabRowIdx)}+${getCellRef(2 + y, totalEquRowIdx)}` }))
      ]);
      sheet.getRow(currentRow + 1).font = { bold: true };
      currentRow++;

      sheet.addRow([]); currentRow++;


      // Valuation Metrics
      sheet.addRow(['Valuation Metrics', 'Metric', 'Value']); currentRow++;
      sheet.getRow(currentRow).font = { bold: true };
      sheet.addRow([
        'Valuation',
        'NPV',
        { formula: `NPV(0.173, C${netCfOpRowIdx + 1}:G${netCfOpRowIdx + 1})` }
      ]);
      sheet.getRow(currentRow + 1).getCell(3).numFmt = '#,##0';
      currentRow++;
      sheet.addRow([
        'Valuation',
        'Internal Rate of Return (IRR)',
        { formula: `IRR(C${netCfOpRowIdx + 1}:G${netCfOpRowIdx + 1})` }
      ]);
      sheet.getRow(currentRow + 1).getCell(3).numFmt = '0.0%';
      currentRow++;

      const opRow = netCfOpRowIdx + 1;
      const pbFormula = `IF(C${opRow}>=0, 0, IF(SUM(C${opRow}:D${opRow})>=0, 1 + ABS(C${opRow})/D${opRow}, IF(SUM(C${opRow}:E${opRow})>=0, 2 + ABS(SUM(C${opRow}:D${opRow}))/E${opRow}, IF(SUM(C${opRow}:F${opRow})>=0, 3 + ABS(SUM(C${opRow}:E${opRow}))/F${opRow}, IF(SUM(C${opRow}:G${opRow})>=0, 4 + ABS(SUM(C${opRow}:F${opRow}))/G${opRow}, "> 5 Years")))))`;

      const dcf1 = `(C${opRow}/POWER(1.173,1))`;
      const dcf2 = `(D${opRow}/POWER(1.173,2))`;
      const dcf3 = `(E${opRow}/POWER(1.173,3))`;
      const dcf4 = `(F${opRow}/POWER(1.173,4))`;
      const dcf5 = `(G${opRow}/POWER(1.173,5))`;
      const dpbFormula = `IF(${dcf1}>=0, 0, IF(${dcf1}+${dcf2}>=0, 1 + ABS(${dcf1})/${dcf2}, IF(${dcf1}+${dcf2}+${dcf3}>=0, 2 + ABS(${dcf1}+${dcf2})/${dcf3}, IF(${dcf1}+${dcf2}+${dcf3}+${dcf4}>=0, 3 + ABS(${dcf1}+${dcf2}+${dcf3})/${dcf4}, IF(${dcf1}+${dcf2}+${dcf3}+${dcf4}+${dcf5}>=0, 4 + ABS(${dcf1}+${dcf2}+${dcf3}+${dcf4})/${dcf5}, "> 5 Years")))))`;

      sheet.addRow([
        'Valuation',
        'Payback Period (Years)',
        { formula: pbFormula }
      ]);
      sheet.getRow(currentRow + 1).getCell(3).numFmt = '0.0';
      currentRow++;

      sheet.addRow([
        'Valuation',
        'Discounted Payback Period (Years)',
        { formula: dpbFormula }
      ]);
      sheet.getRow(currentRow + 1).getCell(3).numFmt = '0.0';
      currentRow++;

      sheet.addRow([]); currentRow++;

      // Column widths
      sheet.getColumn(1).width = 25;
      sheet.getColumn(2).width = 35;
      for (let i = 3; i <= 8; i++) sheet.getColumn(i).width = 15;
    });

    
    // Add Sensitivity Analysis Sheet
    const sensSheet = workbook.addWorksheet('Sensitivity Analysis');
    const exportMods = activeMarket === 'Consolidated' ? sensitivityMods.Portugal : sensitivityMods[activeMarket as 'Portugal' | 'UK'];
    const currentMods = exportMods; // alias for the sheet rows

    sensSheet.getColumn(1).width = 25;
    for(let i=2; i<=8; i++) sensSheet.getColumn(i).width = 15;
    
    sensSheet.addRow(['Sensitivity Analysis', 'Active Market: ' + activeMarket]);
    sensSheet.getRow(1).font = { bold: true, size: 14 };
    sensSheet.addRow([]);
    
    // Add Modifiers
    sensSheet.addRow(['Modifiers & Overrides']);
    sensSheet.getRow(3).font = { bold: true, size: 12 };
    
    sensSheet.addRow(['Relative Modifiers (%)', 'Value']);
    sensSheet.getRow(4).font = { bold: true, size: 11, color: { argb: 'FF475569' } };
    sensSheet.addRow(['New Owners Added', (currentMods?.newOwners || 0)]);
    sensSheet.addRow(['New Providers Added', (currentMods?.newProviders || 0)]);
    sensSheet.addRow(['WACC (%)', 17.3 + (sensitivityMods.wacc || 0)]);
    sensSheet.addRow(['IT R&D and Support', (currentMods?.itRnD || 0)]);
    sensSheet.addRow(['Advertisement & Promotion', (currentMods?.marketing || 0)]);
    sensSheet.addRow([]);
    
    sensSheet.addRow(['Absolute Overrides (Per Year)', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']);
    sensSheet.getRow(11).font = { bold: true, size: 11, color: { argb: 'FF475569' } };
    
    const baseOwnerChurn = years.map(y => getBasePlatformMetric('Owner churn rate (%)', y));
    const baseProviderChurn = years.map(y => getBasePlatformMetric('Provider churn rate (%)', y));
    
    sensSheet.addRow(['Owner Churn Rate (%)', ...years.map(y => baseOwnerChurn[y] + ((currentMods?.ownerChurn && currentMods?.ownerChurn[y]) || 0))]);
    sensSheet.addRow(['Provider Churn Rate (%)', ...years.map(y => baseProviderChurn[y] + ((currentMods?.providerChurn && currentMods?.providerChurn[y]) || 0))]);
    sensSheet.addRow(['Unit Customer Support cost - Owners', ...years.map(y => getBasePlatformMetric('Unit Customer Support cost - Owners', y) + ((currentMods?.unitCustomerSupportCostOwners && currentMods?.unitCustomerSupportCostOwners[y]) || 0))]);
    sensSheet.addRow([]);
    
    sensSheet.addRow(['Absolute Overrides (Constant)', 'Value']);
    sensSheet.getRow(15).font = { bold: true, size: 11, color: { argb: 'FF475569' } };
    sensSheet.addRow(['Avg Price per Booking', getBasePlatformMetric('Avg price per booking') + (currentMods?.avgPricePerBooking || 0)]);
    sensSheet.addRow(['% of Bookings Commission', (getBasePlatformMetric('% of bookings commission') + (currentMods?.commission || 0))]);
    sensSheet.addRow(['Monthly Subscription Fee', getBasePlatformMetric('Monthly Subscription fee') + (currentMods?.subscriptionFee || 0)]);
    sensSheet.addRow(['# of yearly bookings per pet owners', getBasePlatformMetric('# of yearly bookings per pet owners') + (currentMods?.yearlyBookings || 0)]);

    sensSheet.addRow([]);

    // Add Financial Highlights
    sensSheet.addRow(['Financial Highlights', 'Value']);
    sensSheet.getRow(sensSheet.lastRow.number).font = { bold: true, size: 11, color: { argb: 'FF475569' } };
    sensSheet.addRow(['NPV', sensitivityData.metrics.npv]);
    sensSheet.addRow(['IRR (%)', sensitivityData.metrics.irr !== null ? sensitivityData.metrics.irr * 100 : 'N/A']);
    sensSheet.addRow(['Average Annual ROI (%)', sensitivityData.metrics.roi * 100]);
    sensSheet.addRow(['Total ROI (%)', sensitivityData.metrics.totalRoi * 100]);
    sensSheet.addRow(['Payback Period (Years)', sensitivityData.metrics.paybackPeriod !== null ? sensitivityData.metrics.paybackPeriod : '> 5']);
    sensSheet.addRow(['Discounted Payback Period (Years)', sensitivityData.metrics.discountedPaybackPeriod !== null ? sensitivityData.metrics.discountedPaybackPeriod : '> 5']);
    sensSheet.addRow([]);

    // Add Results
    sensSheet.addRow(['Modified P&L', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Total']);
    const plHeaderRow = sensSheet.lastRow.number;
    sensSheet.getRow(plHeaderRow).font = { bold: true };
    
    sensSheet.addRow(['Gross Revenue', ...sensitivityData.data.grossRev, sensitivityData.totals.grossRev]);
    sensSheet.addRow(['Net Revenue', ...sensitivityData.data.netRev, sensitivityData.totals.netRev]);
    sensSheet.addRow(['COGS', ...sensitivityData.data.cogs.map(v => -v), -sensitivityData.totals.cogs]);
    sensSheet.addRow(['Gross Margin', ...sensitivityData.data.margin, sensitivityData.totals.margin]);
    sensSheet.addRow(['Fixed Costs', ...sensitivityData.data.fixedCosts.map(v => -v), -sensitivityData.totals.fixedCosts]);
    sensSheet.addRow(['Operating Profit', ...sensitivityData.data.opProfit, sensitivityData.totals.opProfit]);
    sensSheet.addRow(['Net Income', ...sensitivityData.data.netIncome, sensitivityData.totals.netIncome]);
    
    // Add Bookings summary
    sensSheet.addRow([]);
    sensSheet.addRow(['5-Year Total Bookings']);
    sensSheet.getRow(sensSheet.lastRow.number).font = { bold: true };
    sensSheet.addRow(['Portugal', sensitivityData.ptBookings]);
    sensSheet.addRow(['UK', sensitivityData.ukBookings]);

    // 2. Add Charts Sheet with Instructions & Static Previews

    const chartsSheet = workbook.addWorksheet('Charts & Previews');
    
    // Add helpful header instructions on how to create native, cell-linked charts
    chartsSheet.mergeCells('A1:H1');
    const headerCell = chartsSheet.getCell('A1');
    headerCell.value = '💡 How to insert Native, Dynamic, Cell-Linked Charts in Excel / Google Sheets:';
    headerCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    headerCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' } // Slate background
    };
    headerCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    chartsSheet.getRow(1).height = 30;

    const instructions = [
      '1. Click on any data sheet tab (e.g., "Portugal", "UK", or "Consolidated").',
      '2. Select the numerical range or table rows you want to graph (e.g., Year 1 to Year 5 values, including the category headers).',
      '3. MS Excel: Select the "Insert" tab at the top -> click "Recommended Charts" or choose Bar/Line chart.',
      '4. Google Sheets: Go to the "Insert" menu -> click "Chart".',
      '5. Because the sheets utilize formulas (SUM, division, ratios), your newly inserted charts will be dynamically linked and auto-updating!'
    ];

    instructions.forEach((line, index) => {
      const rowNum = 2 + index;
      chartsSheet.mergeCells(`A${rowNum}:H${rowNum}`);
      const cell = chartsSheet.getCell(`A${rowNum}`);
      cell.value = line;
      cell.font = { italic: true, size: 10, color: { argb: 'FF475569' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' } // Soft neutral white/slate
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      chartsSheet.getRow(rowNum).height = 20;
    });

    chartsSheet.addRow([]); // empty spacing row
    let currentImgRow = 9;

    if (capturedImages.length > 0) {
      for (const img of capturedImages) {
        const imageId = workbook.addImage({
          base64: img.data.split(',')[1],
          extension: 'png',
        });

        chartsSheet.getCell(currentImgRow, 1).value = `📊 Static Reference: ${img.name}`;
        chartsSheet.getCell(currentImgRow, 1).font = { bold: true, size: 11, color: { argb: 'FF0F172A' } };
        
        // Add image - estimate size
        chartsSheet.addImage(imageId, {
          tl: { col: 0, row: currentImgRow },
          ext: { width: 620, height: 360 }
        });
        
        currentImgRow += 21; // Skip rows for the image
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "financial_viability_tracker.xlsx");
  };

  const renderCustomBarLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    if (!value) return null;
    
    const displayValue = formatCompactCurrency(value);
    const isNegative = value < 0;
    const yPos = isNegative ? y + height + 10 : y - 10;
    
    return (
      <text 
        x={x + width / 2} 
        y={yPos} 
        fill={isNegative ? "#ef4444" : "#1e293b"} 
        textAnchor="middle" 
        dominantBaseline="middle" 
        fontSize={10} 
        fontWeight={600}
        style={{ pointerEvents: 'none' }}
      >
        {displayValue}
      </text>
    );
  };

  const renderStreamSection = (
    title: string, 
    streams: FinancialStream[], 
    prefix: string, 
    total: number,
    totalsByYear: number[],
    stateKey: keyof MarketData,
    formatType: 'currency' | 'number' = 'currency',
    showTotal: boolean = true,
    sectionRef?: React.RefObject<HTMLDivElement>,
    downloadId?: string
  ) => {
    const isReadOnly = activeMarket === 'Consolidated';

    const getValidationError = (streamName: string, val: number | string): string | null => {
      if (val === '') return null;
      const numVal = Number(val);
      if (isNaN(numVal)) return null;
      const lowerName = streamName.toLowerCase();
      
      if (lowerName.includes('%') || lowerName.includes('percent') || lowerName.includes('rate') || lowerName.includes('commission')) {
        if (numVal < 0) return 'Percentage cannot be negative';
        if (numVal > 100) return 'Percentage cannot exceed 100%';
        return null;
      }
      
      if (numVal < 0) {
        return 'Value cannot be negative';
      }
      
      return null;
    };

    const formatValue = (val: number, streamName?: string) => {
      if (formatType === 'currency') return formatCurrency(val);
      if (streamName) {
        const lowerName = streamName.toLowerCase();
        if (lowerName.includes('%') || lowerName.includes('percent') || lowerName.includes('rate')) {
          return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val);
        }
        if (lowerName.includes('per transaction') || lowerName.includes('unit') || lowerName.includes('fee') || lowerName.includes('avg price')) {
          return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val);
        }
      }
      return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val);
    };

    // Calculate section errors
    const sectionErrors: { streamName: string; yearNum: number; error: string }[] = [];
    if (!isReadOnly) {
      streams.forEach(stream => {
        if (!stream.isCalculated) {
          years.forEach(y => {
            const err = getValidationError(stream.name, stream.amounts[y]);
            if (err) {
              sectionErrors.push({
                streamName: stream.name,
                yearNum: y + 1,
                error: err
              });
            }
          });
        }
      });
    }
    
    return (
    <div ref={sectionRef} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 relative group">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-medium flex items-center space-x-2">
            <Activity className="w-5 h-5 text-slate-400" />
            <span>{title}</span>
          </h2>
          <MarketFlags market={activeMarket} />
          <div data-export-exclude="true" className="flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button 
              onClick={() => copyChart(sectionRef!, downloadId!)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              title="Copy to Clipboard"
            >
              {copiedChart === downloadId ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => downloadChart(sectionRef!, downloadId!)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              title="Download as PNG"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>
        {!isReadOnly && (
          <button 
            onClick={() => addStream(streams, prefix, stateKey)}
            className="text-sm flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stream</span>
          </button>
        )}
      </div>
      
      <div className="space-y-6">
        {/* Validation Errors Header Banner */}
        {sectionErrors.length > 0 && (
          <div className="p-3 bg-red-50/80 border border-red-200/60 rounded-xl flex items-start space-x-3 text-red-800 text-xs sm:text-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2">
            <span className="relative flex h-2 w-2 mt-1.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <div className="flex-1">
              <p className="font-semibold text-red-900 mb-1">
                Invalid values detected ({sectionErrors.length}):
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-red-700 font-medium">
                {sectionErrors.map((err, idx) => (
                  <li key={idx}>
                    Year {err.yearNum} for <strong>{err.streamName}</strong>: {err.error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Header Row for Years */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 p-3 border border-transparent">
          <div className="flex-1"></div>
          <div className={`grid ${showTotal ? 'grid-cols-6' : 'grid-cols-5'} gap-2 w-full lg:max-w-[700px]`}>
            {years.map(y => (
              <div key={y} className="text-center text-xs font-medium text-slate-500">Y{y+1}</div>
            ))}
            {showTotal && <div className="text-right px-2 text-xs font-medium text-slate-500">Total</div>}
          </div>
        </div>

        {streams.map((stream) => (
          <div key={`${title}-${stream.id}`} className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
            <div className="flex-1 min-w-0 flex items-center space-x-2">
              {stream.isPermanent || isReadOnly ? (
                <div className="block w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 truncate group relative">
                  {stream.name}
                  {stream.name === 'Payment Processing' && (
                    <div className="hidden group-hover:block absolute z-10 w-64 p-2 mt-1 text-xs font-normal text-white bg-slate-800 rounded-lg shadow-lg -left-2 top-full">
                      Formula: (Total Volume × Payment Fee %) + (Total Transactions × Payment Fee per Transaction)
                      <br />
                      <span className="opacity-70 italic">Includes both Subscriptions and Bookings.</span>
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  value={stream.name}
                  onChange={(e) => updateStreamName(streams, stream.id, e.target.value, stateKey)}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors min-w-0"
                  placeholder={`${prefix} Type`}
                />
              )}
              {!stream.isPermanent && !isReadOnly && (
                <button 
                  onClick={() => removeStream(streams, stream.id, stateKey)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 flex-shrink-0"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className={`grid ${showTotal ? 'grid-cols-6' : 'grid-cols-5'} gap-2 w-full lg:max-w-[700px]`}>
              {years.map(y => {
                const error = getValidationError(stream.name, stream.amounts[y]);
                const hasError = !!error;

                return (
                  <div key={y} className="relative">
                    {isReadOnly || stream.isCalculated ? (
                      <div className={`block w-full px-1 py-2 border border-slate-200 bg-slate-100 rounded-lg text-xs text-center text-slate-500 transition-colors ${Number(stream.amounts[y]) < 0 ? 'text-red-600' : ''}`}>
                        {formatValue(Number(stream.amounts[y]), stream.name)}
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="number"
                          value={stream.amounts[y]}
                          onChange={(e) => updateStreamAmount(streams, stream.id, y, e.target.value ? Number(e.target.value) : '', stateKey)}
                          className={`block w-full px-1 py-2 border rounded-lg text-xs text-center transition-all duration-150 ${
                            hasError 
                              ? 'border-red-400 bg-red-50/70 text-red-950 placeholder-red-300 focus:ring-red-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200' 
                              : 'border-slate-300 bg-white text-slate-900 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 hover:border-slate-400'
                          }`}
                          placeholder="0"
                          title={error || undefined}
                        />
                        {hasError && (
                          <span className="absolute -top-1 -right-1 flex h-2 w-2" title={error || undefined}>
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {showTotal && (
                <div className={`flex items-center justify-end text-sm font-semibold whitespace-nowrap ${getStreamTotal(stream) >= 0 ? 'text-slate-700' : 'text-red-600'}`}>
                  {formatValue(getStreamTotal(stream), stream.name)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {showTotal && (
        <div className="mt-4 pt-4 p-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="flex-1 text-sm font-medium text-slate-500">Total {title}</div>
          <div className="grid grid-cols-6 gap-2 w-full lg:max-w-[700px]">
            {years.map(y => (
              <div key={y} className={`text-center text-xs font-semibold whitespace-nowrap ${totalsByYear[y] >= 0 ? 'text-slate-700' : 'text-red-600'}`}>
                {formatValue(totalsByYear[y])}
              </div>
            ))}
            <div className={`flex items-center justify-end text-sm font-bold whitespace-nowrap ${total >= 0 ? 'text-slate-900' : 'text-red-700'}`}>
              {formatValue(total)}
            </div>
          </div>
        </div>
      )}
    </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-[1410px] mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-sm">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Financial Viability Tracker</h1>
              <p className="text-slate-500 text-sm">5-Year Business Model Validation</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm mr-4">
              {(['Portugal', 'UK', 'Consolidated'] as Market[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setActiveMarket(m)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeMarket === m
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={exportToXLSX}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-lg shadow-sm text-sm font-medium text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </header>

        <div className="flex space-x-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('financials')}
            className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'financials'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Financials
          </button>
          <button
            onClick={() => setActiveTab('platform')}
            className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'platform'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Platform Metrics
          </button>
          <button
            onClick={() => setActiveTab('gross-margin')}
            className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'gross-margin'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Gross Margin
          </button>
          <button
            onClick={() => setActiveTab('cash-flow')}
            className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'cash-flow'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Cash Flow
          </button>
          <button
            onClick={() => setActiveTab('balance-sheet')}
            className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'balance-sheet'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Balance Sheet
          </button>
          <button
            onClick={() => setActiveTab('sensitivity')}
            className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'sensitivity'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Sensitivity Analysis
          </button>
          <button
            onClick={() => setActiveTab('highlights')}
            className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'highlights'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Financial Highlights
          </button>

          <button
            onClick={() => setActiveTab('monte-carlo')}
            className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'monte-carlo'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Monte Carlo
          </button>
        </div>


        <div className={activeTab === 'financials' ? 'block' : 'opacity-0 pointer-events-none absolute -z-10 w-full'}>
          <div className="space-y-8">
            {/* Inputs Section */}
            <div className="space-y-6">
              
              {/* Aggregated P&L Table */}
              <div ref={aggregatedPnLRef} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-lg font-medium flex items-center space-x-2">
                      <Calculator className="w-5 h-5 text-indigo-600" />
                      <span>Aggregated P&L ({activeMarket})</span>
                    </h2>
                    <MarketFlags market={activeMarket} />
                  </div>
                  <div data-export-exclude="true" className="flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button 
                      onClick={() => copyChart(aggregatedPnLRef, 'aggregated-pnl')}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      title="Copy to Clipboard"
                    >
                      {copiedChart === 'aggregated-pnl' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => downloadChart(aggregatedPnLRef, 'aggregated-pnl')}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      title="Download as PNG"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                </div>
            <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 px-2 font-semibold text-slate-600">Item</th>
                        {years.map(y => (
                          <th key={y} className="text-right py-2 px-2 font-semibold text-slate-600">Y{y+1}</th>
                        ))}
                        <th className="text-right py-2 px-2 font-semibold text-slate-900 bg-slate-50/50">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-50 bg-slate-50/20">
                        <td className="py-2 px-2 font-medium text-slate-700 italic">Gross Revenues</td>
                        {years.map(y => (
                          <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-400 text-xs">{formatCurrency(totalGrossRevenueByYear[y])}</td>
                        ))}
                        <td className="text-right py-2 px-2 font-bold bg-slate-50/50 font-mono whitespace-nowrap text-slate-500 text-xs">{formatCurrency(totalGrossRevenue)}</td>
                      </tr>
                      
                      <tr className="border-b border-slate-50">
                        <td className="py-2 px-2 font-medium text-slate-700">Net Revenues</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-2 px-2 font-mono whitespace-nowrap ${totalRevenueByYear[y] >= 0 ? 'text-slate-600' : 'text-red-600'}`}>{formatCurrency(totalRevenueByYear[y])}</td>
                        ))}
                        <td className={`text-right py-2 px-2 font-bold bg-slate-50/50 font-mono whitespace-nowrap ${totalRevenue >= 0 ? 'text-slate-900' : 'text-red-900'}`}>{formatCurrency(totalRevenue)}</td>
                      </tr>

                      <tr className="border-b border-slate-50">
                        <td className="py-2 px-2 font-medium text-slate-700">COGS</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-2 px-2 font-mono whitespace-nowrap ${totalVarCostsByYear[y] >= 0 ? 'text-slate-600' : 'text-red-600'}`}>{formatCurrency(totalVarCostsByYear[y])}</td>
                        ))}
                        <td className={`text-right py-2 px-2 font-bold bg-slate-50/50 font-mono whitespace-nowrap ${totalVariableCosts >= 0 ? 'text-slate-900' : 'text-red-900'}`}>{formatCurrency(totalVariableCosts)}</td>
                      </tr>

                      <tr className="border-b border-slate-50 bg-emerald-50/30">
                        <td className="py-2 px-2 font-semibold text-emerald-700">Gross Margin</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-2 px-2 font-bold font-mono whitespace-nowrap ${grossMarginByYear[y] >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatCurrency(grossMarginByYear[y])}
                          </td>
                        ))}
                        <td className={`text-right py-2 px-2 font-bold bg-emerald-50/50 font-mono whitespace-nowrap ${grossMargin >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                          {formatCurrency(grossMargin)}
                        </td>
                      </tr>

                      <tr className="border-b border-slate-50">
                        <td className="py-2 px-2 font-medium text-slate-700">Fixed Costs</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-2 px-2 font-mono whitespace-nowrap ${totalFixedCostsByYear[y] >= 0 ? 'text-slate-600' : 'text-red-600'}`}>{formatCurrency(totalFixedCostsByYear[y])}</td>
                        ))}
                        <td className={`text-right py-2 px-2 font-bold bg-slate-50/50 font-mono whitespace-nowrap ${fixedCosts >= 0 ? 'text-slate-900' : 'text-red-900'}`}>{formatCurrency(fixedCosts)}</td>
                      </tr>

                      <tr className="bg-indigo-50/30 border-b border-indigo-100">
                        <td className="py-2 px-2 font-semibold text-indigo-700">Operating Profit (EBIT)</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-2 px-2 font-bold font-mono whitespace-nowrap ${opProfitByYear[y] >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                            {formatCurrency(opProfitByYear[y])}
                          </td>
                        ))}
                        <td className={`text-right py-2 px-2 font-bold bg-indigo-50/50 font-mono whitespace-nowrap ${operatingProfit >= 0 ? 'text-indigo-800' : 'text-red-800'}`}>
                          {formatCurrency(operatingProfit)}
                        </td>
                      </tr>
                      
                      <tr className="bg-indigo-50/10">
                        <td className="py-2 px-2 text-xs font-medium text-indigo-600 italic pl-4">Operating Profit %</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-2 px-2 font-mono text-xs whitespace-nowrap ${opProfitPercentByYear[y] >= 0 ? 'text-indigo-500' : 'text-red-500'}`}>
                            {opProfitPercentByYear[y].toFixed(1)}%
                          </td>
                        ))}
                        <td className={`text-right py-2 px-2 font-bold bg-indigo-50/20 font-mono text-xs whitespace-nowrap ${calculatedOpProfitPercent >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>
                          {calculatedOpProfitPercent.toFixed(1)}%
                        </td>
                      </tr>

                      <tr className="bg-emerald-50/30">
                        <td className="py-3 px-2 font-bold text-emerald-800">Net Income</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-3 px-2 font-bold font-mono whitespace-nowrap ${netIncomeByYear[y] >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                            {formatCurrency(netIncomeByYear[y])}
                          </td>
                        ))}
                        <td className={`text-right py-3 px-2 font-bold bg-emerald-50/50 font-mono whitespace-nowrap ${totalNetIncome >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                          {formatCurrency(totalNetIncome)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detailed Summary Table */}
              <div ref={financialSummaryRef} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-lg font-medium flex items-center space-x-2">
                      <Calculator className="w-5 h-5 text-indigo-600" />
                      <span>Detailed P&L ({activeMarket})</span>
                    </h2>
                    <MarketFlags market={activeMarket} />
                  </div>
                  <div data-export-exclude="true" className="flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button 
                      onClick={() => copyChart(financialSummaryRef, 'financial-summary')}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      title="Copy to Clipboard"
                    >
                      {copiedChart === 'financial-summary' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => downloadChart(financialSummaryRef, 'financial-summary')}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      title="Download as PNG"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 px-2 font-semibold text-slate-600">Item</th>
                        {years.map(y => (
                          <th key={y} className="text-right py-2 px-2 font-semibold text-slate-600">Y{y+1}</th>
                        ))}
                        <th className="text-right py-2 px-2 font-semibold text-slate-900 bg-slate-50/50">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-50 bg-slate-50/20">
                        <td className="py-2 px-2 font-medium text-slate-700 italic">Gross Revenues</td>
                        {years.map(y => (
                          <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-400 text-xs">{formatCurrency(totalGrossRevenueByYear[y])}</td>
                        ))}
                        <td className="text-right py-2 px-2 font-bold bg-slate-50/50 font-mono whitespace-nowrap text-slate-500 text-xs">{formatCurrency(totalGrossRevenue)}</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 px-2 font-medium text-slate-700">Net Revenues</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-2 px-2 font-mono whitespace-nowrap ${totalRevenueByYear[y] >= 0 ? 'text-slate-600' : 'text-red-600'}`}>{formatCurrency(totalRevenueByYear[y])}</td>
                        ))}
                        <td className={`text-right py-2 px-2 font-bold bg-slate-50/50 font-mono whitespace-nowrap ${totalRevenue >= 0 ? 'text-slate-900' : 'text-red-900'}`}>{formatCurrency(totalRevenue)}</td>
                      </tr>
                      {derivedRevenueStreams.map(stream => {
                        const totalStream = years.reduce((sum, y) => sum + (Number(stream.amounts[y]) || 0), 0);
                        return (
                          <tr key={stream.id} className="border-b border-slate-50/50 bg-slate-50/10">
                            <td className="py-1.5 px-2 text-xs text-slate-500 pl-6 border-l-[3px] border-l-slate-200">└ {stream.name}</td>
                            {years.map(y => (
                              <td key={y} className={`text-right py-1.5 px-2 font-mono whitespace-nowrap text-xs ${Number(stream.amounts[y]) >= 0 ? 'text-slate-500' : 'text-red-500'}`}>
                                {formatCurrency(Number(stream.amounts[y]) || 0)}
                              </td>
                            ))}
                            <td className={`text-right py-1.5 px-2 font-mono whitespace-nowrap text-xs bg-slate-50/30 ${totalStream >= 0 ? 'text-slate-600' : 'text-red-600'}`}>
                              {formatCurrency(totalStream)}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="border-b border-slate-50">
                        <td className="py-2 px-2 font-medium text-slate-700">COGS</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-2 px-2 font-mono whitespace-nowrap ${totalVarCostsByYear[y] >= 0 ? 'text-slate-600' : 'text-red-600'}`}>{formatCurrency(totalVarCostsByYear[y])}</td>
                        ))}
                        <td className={`text-right py-2 px-2 font-bold bg-slate-50/50 font-mono whitespace-nowrap ${totalVariableCosts >= 0 ? 'text-slate-900' : 'text-red-900'}`}>{formatCurrency(totalVariableCosts)}</td>
                      </tr>
                      <tr className="border-b border-slate-50 bg-emerald-50/30">
                        <td className="py-2 px-2 font-semibold text-emerald-700">Gross Margin</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-2 px-2 font-bold font-mono whitespace-nowrap ${grossMarginByYear[y] >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatCurrency(grossMarginByYear[y])}
                          </td>
                        ))}
                        <td className={`text-right py-2 px-2 font-bold bg-emerald-50/50 font-mono whitespace-nowrap ${grossMargin >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                          {formatCurrency(grossMargin)}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-50 bg-emerald-50/10">
                        <td className="py-2 px-2 text-xs font-medium text-emerald-600 italic pl-4">Gross Margin %</td>
                        {years.map(y => (
                          <td key={y} className="text-right py-2 px-2 text-emerald-500 font-mono text-xs whitespace-nowrap">{grossMarginPercentByYear[y].toFixed(1)}%</td>
                        ))}
                        <td className="text-right py-2 px-2 font-bold text-emerald-700 bg-emerald-50/20 font-mono text-xs whitespace-nowrap">{calculatedMarginPercent.toFixed(1)}%</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 px-2 font-medium text-slate-700">Fixed Costs</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-2 px-2 font-mono whitespace-nowrap ${totalFixedCostsByYear[y] >= 0 ? 'text-slate-600' : 'text-red-600'}`}>{formatCurrency(totalFixedCostsByYear[y])}</td>
                        ))}
                        <td className={`text-right py-2 px-2 font-bold bg-slate-50/50 font-mono whitespace-nowrap ${fixedCosts >= 0 ? 'text-slate-900' : 'text-red-900'}`}>{formatCurrency(fixedCosts)}</td>
                      </tr>
                      <tr className="border-b border-slate-50 bg-slate-50/20">
                        <td className="py-2 px-2 font-semibold text-slate-700">EBITDA</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-2 px-2 font-bold font-mono whitespace-nowrap ${opProfitByYear[y] >= 0 ? 'text-slate-600' : 'text-red-600'}`}>
                            {formatCurrency(opProfitByYear[y])}
                          </td>
                        ))}
                        <td className={`text-right py-2 px-2 font-bold bg-slate-50/50 font-mono whitespace-nowrap ${operatingProfit >= 0 ? 'text-slate-800' : 'text-red-800'}`}>
                          {formatCurrency(operatingProfit)}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 px-2 font-medium text-slate-500 italic pl-4">(-) Depreciation & Amortization</td>
                        {years.map(y => (
                          <td key={y} className="text-right py-2 px-2 font-mono text-slate-400 whitespace-nowrap">{getCurrencySymbol()}0</td>
                        ))}
                        <td className="text-right py-2 px-2 font-bold bg-slate-50/50 font-mono text-slate-500 whitespace-nowrap">{getCurrencySymbol()}0</td>
                      </tr>
                      <tr className="bg-indigo-50/30 border-b border-indigo-100">
                        <td className="py-2 px-2 font-semibold text-indigo-700">Operating Profit (EBIT)</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-2 px-2 font-bold font-mono whitespace-nowrap ${opProfitByYear[y] >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                            {formatCurrency(opProfitByYear[y])}
                          </td>
                        ))}
                        <td className={`text-right py-2 px-2 font-bold bg-indigo-50/50 font-mono whitespace-nowrap ${operatingProfit >= 0 ? 'text-indigo-800' : 'text-red-800'}`}>
                          {formatCurrency(operatingProfit)}
                        </td>
                      </tr>
                      <tr className="bg-indigo-50/10">
                        <td className="py-2 px-2 text-xs font-medium text-indigo-600 italic pl-4">Operating Profit %</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-2 px-2 font-mono text-xs whitespace-nowrap ${opProfitPercentByYear[y] >= 0 ? 'text-indigo-500' : 'text-red-500'}`}>
                            {opProfitPercentByYear[y].toFixed(1)}%
                          </td>
                        ))}
                        <td className={`text-right py-2 px-2 font-bold bg-indigo-50/20 font-mono text-xs whitespace-nowrap ${calculatedOpProfitPercent >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>
                          {calculatedOpProfitPercent.toFixed(1)}%
                        </td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 px-2 font-medium text-slate-500 italic pl-4">(-) Taxes (21%)</td>
                        {years.map(y => (
                          <td key={y} className="text-right py-2 px-2 font-mono text-slate-500 whitespace-nowrap">
                            {formatCurrency(taxByYear[y])}
                          </td>
                        ))}
                        <td className="text-right py-2 px-2 font-bold bg-slate-50/50 font-mono text-slate-600 whitespace-nowrap">
                          {formatCurrency(totalTaxes)}
                        </td>
                      </tr>
                      <tr className="bg-emerald-50/30">
                        <td className="py-3 px-2 font-bold text-emerald-800">Net Income</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-3 px-2 font-bold font-mono whitespace-nowrap ${netIncomeByYear[y] >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                            {formatCurrency(netIncomeByYear[y])}
                          </td>
                        ))}
                        <td className={`text-right py-3 px-2 font-bold bg-emerald-50/50 font-mono whitespace-nowrap ${totalNetIncome >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                          {formatCurrency(totalNetIncome)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {renderStreamSection('Revenue Streams', derivedRevenueStreams, 'Revenue', totalRevenue, totalRevenueByYear, 'revenueStreams', 'currency', true, revenueStreamsRef, 'revenue-streams')}
              {renderStreamSection('COGS', derivedVariableCostsStreams, 'Cost', totalVariableCosts, totalVarCostsByYear, 'variableCostsStreams', 'currency', true, cogsRef, 'cogs-streams')}
              {renderStreamSection('Fixed Operating Costs', derivedFixedCostsStreams, 'Fixed Cost', fixedCosts, totalFixedCostsByYear, 'fixedCostsStreams', 'currency', true, fixedCostsRef, 'fixed-costs-streams')}
            </div>

            {/* Outputs & Visualization Section */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Gross Margin Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">5-Year Gross Margin ({calculatedMarginPercent.toFixed(1)}%)</p>
                      <p className={`mt-2 text-3xl font-semibold ${grossMargin >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                        {formatCurrency(grossMargin)}
                      </p>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                  <div className="mt-4 w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.min(Math.max(calculatedMarginPercent, 0), 100)}%` }}></div>
                  </div>
                  <div className="mt-6 grid grid-cols-5 gap-2 pt-4 border-t border-slate-100">
                    {years.map(y => (
                      <div key={y} className="text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Y{y+1}</div>
                        <div className={`text-xs font-medium mt-1 ${grossMarginByYear[y] >= 0 ? 'text-slate-700' : 'text-red-600'}`}>
                          {formatCurrency(grossMarginByYear[y])}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operating Profit Card */}
                <div className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-between ${operatingProfit >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-red-50 border-red-100'}`}>
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`text-sm font-medium ${operatingProfit >= 0 ? 'text-indigo-600/80' : 'text-red-600/80'}`}>
                          5-Year Operating Profit
                        </p>
                        <p className={`mt-2 text-3xl font-bold tracking-tight ${operatingProfit >= 0 ? 'text-indigo-900' : 'text-red-900'}`}>
                          {formatCurrency(operatingProfit)}
                        </p>
                      </div>
                    </div>
                  <p className={`mt-4 text-sm ${operatingProfit >= 0 ? 'text-indigo-600/80' : 'text-red-600/80'}`}>
                    {operatingProfit >= 0 ? 'Project is financially viable.' : 'Project is operating at a loss.'}
                  </p>
                </div>
                <div className={`mt-6 grid grid-cols-5 gap-2 pt-4 border-t ${operatingProfit >= 0 ? 'border-indigo-100/50' : 'border-red-100/50'}`}>
                  {years.map(y => (
                    <div key={y} className="text-center">
                      <div className={`text-[10px] uppercase font-semibold ${opProfitByYear[y] >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>Y{y+1}</div>
                      <div className={`text-xs font-medium mt-1 ${opProfitByYear[y] >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>{formatCurrency(opProfitByYear[y])}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart Section */}
            <div ref={financialOverviewChartRef} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-3">
                  <h2 className="text-lg font-medium">5-Year Financial Overview</h2>
                  <MarketFlags market={activeMarket} />
                </div>
                <div data-export-exclude="true" className="flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button 
                    onClick={() => copyChart(financialOverviewChartRef, 'financial-overview')}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="Copy to Clipboard"
                  >
                    {copiedChart === 'financial-overview' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => downloadChart(financialOverviewChartRef, 'financial-overview')}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="Download as PNG"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 30, right: 10, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(value) => `${getCurrencySymbol()}${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                    />
                    <Tooltip 
                      formatter={formatTooltip}
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend 
                      layout="vertical" 
                      verticalAlign="middle" 
                      align="right"
                      wrapperStyle={{ paddingLeft: '20px' }}
                      content={(props) => {
                        const { payload } = props;
                        const order = ['Net Revenues', 'COGS', 'Gross Margin', 'Fixed Costs', 'Op. Profit'];
                        const sortedPayload = order.map(name => payload?.find((p: any) => p.value === name)).filter(Boolean);
                        
                        return (
                          <div className="flex flex-col space-y-2 pl-5">
                            {sortedPayload.map((entry: any, index: number) => (
                              <div key={`item-${index}`} className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }}></div>
                                <span className="text-sm font-medium" style={{ color: entry.color }}>{entry.value}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="Net Revenues" fill="#3b82f6">
                      <LabelList dataKey="Net Revenues" content={renderCustomBarLabel} />
                    </Bar>
                    <Bar dataKey="COGS" fill="#f59e0b">
                      <LabelList dataKey="COGS" content={renderCustomBarLabel} />
                    </Bar>
                    <Bar dataKey="Gross Margin" fill="#8b5cf6">
                      <LabelList dataKey="Gross Margin" content={renderCustomBarLabel} />
                    </Bar>
                    <Bar dataKey="Fixed Costs" fill="#f97316">
                      <LabelList dataKey="Fixed Costs" content={renderCustomBarLabel} />
                    </Bar>
                    <Bar dataKey="Op. Profit" fill={operatingProfit >= 0 ? '#10b981' : '#ef4444'}>
                      <LabelList dataKey="Op. Profit" content={renderCustomBarLabel} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Comparative Visualizer Card: Retail Sales, Operating Costs, and Operating Profit */}
            <div ref={viabilityComparisonChartRef} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center space-x-3">
                    <h2 className="text-lg font-medium text-slate-900">Retail Sales vs. Costs & Profit</h2>
                    <MarketFlags market={activeMarket} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Comparing Gross Booking Volume vs. Combined Operating Expenses & Operating Profit</p>
                </div>
                <div data-export-exclude="true" className="flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button 
                    onClick={() => copyChart(viabilityComparisonChartRef, 'viability-comparison')}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="Copy to Clipboard"
                  >
                    {copiedChart === 'viability-comparison' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => downloadChart(viabilityComparisonChartRef, 'viability-comparison')}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="Download as PNG"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={viabilityChartData}
                    margin={{ top: 25, right: 10, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(value) => `${getCurrencySymbol()}${value >= 1000000 ? (value / 1000000).toFixed(1) + 'M' : value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                    />
                    <Tooltip 
                      formatter={(value: any, name: any) => [formatCurrency(Number(value) || 0), name]}
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend 
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      content={(props) => {
                        const { payload } = props;
                        return (
                          <div className="flex justify-center space-x-6 pt-4">
                            {payload?.map((entry: any, index: number) => {
                              let displayName = entry.value;
                              let displayColor = entry.color;
                              if (displayName === 'Operating Profit') {
                                displayColor = operatingProfit >= 0 ? '#10b981' : '#ef4444';
                              }
                              return (
                                <div key={`legend-${index}`} className="flex items-center space-x-2">
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: displayColor }}></div>
                                  <span className="text-xs text-slate-600 font-medium">{displayName}</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="Retail Sales" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Retail Sales" content={renderCustomBarLabel} />
                    </Bar>
                    <Bar dataKey="Operating Costs" fill="#f97316" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Operating Costs" content={renderCustomBarLabel} />
                    </Bar>
                    <Bar dataKey="Operating Profit" fill="#10b981" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Operating Profit" content={renderCustomBarLabel} />
                      {viabilityChartData.map((entry: any, index: number) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry['Operating Profit'] >= 0 ? '#10b981' : '#ef4444'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 p-4 bg-slate-50 rounded-xl grid grid-cols-3 gap-4 border border-slate-100 text-center">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Retail Sales</div>
                  <div className="text-sm font-bold text-indigo-700 mt-1">{formatCurrency(totalGrossRevenue)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Operating Costs</div>
                  <div className="text-sm font-bold text-orange-600 mt-1">{formatCurrency(totalVariableCosts + fixedCosts)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">5-Yr Net Profit</div>
                  <div className={`text-sm font-bold mt-1 ${operatingProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(operatingProfit)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

        <div className={activeTab === 'platform' ? 'block' : 'opacity-0 pointer-events-none absolute -z-10 w-full'}>
          <div className="space-y-8">
            <div className="space-y-6">
              {renderStreamSection('Platform Metrics', platformMetricsStreams, 'Metric', totalPlatformMetrics, totalPlatformMetricsByYear, 'platformMetricsStreams', 'number', false, platformMetricsRef, 'platform-metrics')}
                
                <div ref={platformSettingsRef} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 relative group">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <h2 className="text-lg font-medium flex items-center space-x-2">
                        <Activity className="w-5 h-5 text-slate-400" />
                        <span>Platform Settings</span>
                      </h2>
                      <MarketFlags market={activeMarket} />
                    </div>
                    <div data-export-exclude="true" className="flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button 
                        onClick={() => copyChart(platformSettingsRef, 'platform-settings')}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        title="Copy to Clipboard"
                      >
                        {copiedChart === 'platform-settings' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => downloadChart(platformSettingsRef, 'platform-settings')}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        title="Download as PNG"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4 sm:space-y-0 sm:space-x-4">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-slate-900">Charge Subscription</h3>
                        <p className="text-xs text-slate-500 mt-1">Enable subscription fees for users on the platform.</p>
                      </div>
                      <div className="grid grid-cols-5 gap-2 w-full sm:max-w-[300px]">
                        {years.map(y => (
                          <div key={y} className="flex flex-col items-center space-y-1">
                            <span className="text-[10px] font-medium text-slate-500 uppercase">Y{y+1}</span>
                            <button
                              onClick={() => toggleCharge(y, 'chargeSubscription')}
                              disabled={activeMarket === 'Consolidated'}
                              className={`w-full py-1.5 text-xs font-medium rounded-md transition-colors ${
                                chargeSubscription[y] 
                                  ? 'bg-indigo-600 text-white shadow-sm' 
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                              } ${activeMarket === 'Consolidated' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {chargeSubscription[y] ? 'Yes' : 'No'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4 sm:space-y-0 sm:space-x-4">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-slate-900">Charge Booking Fees</h3>
                        <p className="text-xs text-slate-500 mt-1">Enable booking fees for transactions on the platform.</p>
                      </div>
                      <div className="grid grid-cols-5 gap-2 w-full sm:max-w-[300px]">
                        {years.map(y => (
                          <div key={y} className="flex flex-col items-center space-y-1">
                            <span className="text-[10px] font-medium text-slate-500 uppercase">Y{y+1}</span>
                            <button
                              onClick={() => toggleCharge(y, 'chargeBookingFees')}
                              disabled={activeMarket === 'Consolidated'}
                              className={`w-full py-1.5 text-xs font-medium rounded-md transition-colors ${
                                chargeBookingFees[y] 
                                  ? 'bg-indigo-600 text-white shadow-sm' 
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                              } ${activeMarket === 'Consolidated' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {chargeBookingFees[y] ? 'Yes' : 'No'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              <div className="space-y-6">
                {/* Provider Analysis Chart */}
                <div ref={providerAnalysisRef} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center space-x-3">
                      <h2 className="text-lg font-medium">Provider Analysis</h2>
                      <MarketFlags market={activeMarket} />
                    </div>
                    <div data-export-exclude="true" className="flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button 
                        onClick={() => copyChart(providerAnalysisRef, 'provider-analysis')}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Copy to Clipboard"
                      >
                        {copiedChart === 'provider-analysis' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                      </button>
                      <button 
                        onClick={() => downloadChart(providerAnalysisRef, 'provider-analysis')}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Download as PNG"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={platformChartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="top" height={36}/>
                        <Line type="monotone" dataKey="Total Providers" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} label={{ position: 'top', fill: '#0ea5e9', fontSize: 12, fontWeight: 500, formatter: (val: any) => val != null ? new Intl.NumberFormat('en-US').format(Math.round(val)) : '' }} />
                        <Line type="monotone" dataKey="New Providers" stroke="#7dd3fc" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} label={{ position: 'bottom', fill: '#7dd3fc', fontSize: 12, fontWeight: 500, formatter: (val: any) => val != null ? new Intl.NumberFormat('en-US').format(Math.round(val)) : '' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Owner Analysis Chart */}
                <div ref={ownerAnalysisRef} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center space-x-3">
                      <h2 className="text-lg font-medium">Owner Analysis</h2>
                      <MarketFlags market={activeMarket} />
                    </div>
                    <div data-export-exclude="true" className="flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button 
                        onClick={() => copyChart(ownerAnalysisRef, 'owner-analysis')}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Copy to Clipboard"
                      >
                        {copiedChart === 'owner-analysis' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                      </button>
                      <button 
                        onClick={() => downloadChart(ownerAnalysisRef, 'owner-analysis')}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Download as PNG"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={platformChartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="top" height={36}/>
                        <Line type="monotone" dataKey="Total Owners" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} label={{ position: 'top', fill: '#10b981', fontSize: 12, fontWeight: 500, formatter: (val: any) => val != null ? new Intl.NumberFormat('en-US').format(Math.round(val)) : '' }} />
                        <Line type="monotone" dataKey="New Owners" stroke="#6ee7b7" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} label={{ position: 'bottom', fill: '#6ee7b7', fontSize: 12, fontWeight: 500, formatter: (val: any) => val != null ? new Intl.NumberFormat('en-US').format(Math.round(val)) : '' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Bookings Analysis Chart */}
                <div ref={bookingsChartRef} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center space-x-3">
                      <h2 className="text-lg font-medium">Bookings Analysis</h2>
                      <MarketFlags market={activeMarket} />
                    </div>
                    <div data-export-exclude="true" className="flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button 
                        onClick={() => copyChart(bookingsChartRef, 'bookings-analysis')}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Copy to Clipboard"
                      >
                        {copiedChart === 'bookings-analysis' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                      </button>
                      <button 
                        onClick={() => downloadChart(bookingsChartRef, 'bookings-analysis')}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Download as PNG"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={platformChartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="top" height={36}/>
                        <Line type="monotone" dataKey="Number of Bookings" name="Total Bookings" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }}>
                          <LabelList dataKey="Number of Bookings" position="top" fill="#8b5cf6" fontSize={10} fontWeight={500} formatter={(val: number) => val != null ? `${(val / 1000).toFixed(1)}k` : ''} />
                        </Line>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Independent Churn Trend Charts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div ref={providerChurnRef} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 relative group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
                          <span>Provider Churn Trend</span>
                        </h2>
                        <MarketFlags market={activeMarket} />
                      </div>
                      <div data-export-exclude="true" className="flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button 
                          onClick={() => copyChart(providerChurnRef, 'provider-churn-trend')}
                          className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Copy to Clipboard"
                        >
                          {copiedChart === 'provider-churn-trend' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => downloadChart(providerChurnRef, 'provider-churn-trend')}
                          className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Download as PNG"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="h-32 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={platformChartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                          <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(val) => `${val}%`} />
                          <Tooltip 
                            formatter={(val: any) => [`${val}%`, 'Churn']}
                            contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                          />
                          <Line type="monotone" dataKey="Provider Churn" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} label={{ position: 'top', fill: '#f59e0b', fontSize: 10, fontWeight: 500, formatter: (val: any) => val != null ? `${val}%` : '' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div ref={ownerChurnRef} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 relative group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-[#6366f1]"></div>
                          <span>Owner Churn Trend</span>
                        </h2>
                        <MarketFlags market={activeMarket} />
                      </div>
                      <div data-export-exclude="true" className="flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button 
                          onClick={() => copyChart(ownerChurnRef, 'owner-churn-trend')}
                          className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Copy to Clipboard"
                        >
                          {copiedChart === 'owner-churn-trend' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => downloadChart(ownerChurnRef, 'owner-churn-trend')}
                          className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Download as PNG"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="h-32 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={platformChartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                          <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(val) => `${val}%`} />
                          <Tooltip 
                            formatter={(val: any) => [`${val}%`, 'Churn']}
                            contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                          />
                          <Line type="monotone" dataKey="Owner Churn" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} label={{ position: 'top', fill: '#6366f1', fontSize: 10, fontWeight: 500, formatter: (val: any) => val != null ? `${val}%` : '' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={activeTab === 'gross-margin' ? 'block' : 'opacity-0 pointer-events-none absolute -z-10 w-full'}>
          <div className="space-y-8">
            <div ref={grossMarginTableRef} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative group">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-semibold flex items-center space-x-2">
                    <Percent className="w-6 h-6 text-indigo-600" />
                    <span>5-Year Gross Margin Analysis</span>
                  </h2>
                  <MarketFlags market={activeMarket} />
                </div>
                <div data-export-exclude="true" className="flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button 
                    onClick={() => copyChart(grossMarginTableRef, 'gross-margin-table')}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Copy to Clipboard"
                  >
                    {copiedChart === 'gross-margin-table' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={() => downloadChart(grossMarginTableRef, 'gross-margin-table')}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Download as PNG"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto -mx-8 px-8">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Metric</th>
                      {years.map(y => (
                        <th key={y} className="text-right py-4 px-4 text-sm font-semibold text-slate-600">Year {y + 1}</th>
                      ))}
                      <th className="text-right py-4 px-4 text-sm font-semibold text-slate-900 bg-slate-50/50">Total / Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                      <td className="py-4 px-4 text-sm font-medium text-slate-700">Gross Margin ({getCurrencySymbol()})</td>
                      {years.map(y => (
                        <td key={y} className="text-right py-4 px-4 text-sm text-slate-600 font-mono">
                          {formatCurrency(grossMarginByYear[y])}
                        </td>
                      ))}
                      <td className="text-right py-4 px-4 text-sm font-bold text-slate-900 bg-slate-50/50 font-mono">
                        {formatCurrency(grossMargin)}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                      <td className="py-4 px-4 text-sm font-medium text-slate-700">Gross Margin (%)</td>
                      {years.map(y => (
                        <td key={y} className="text-right py-4 px-4 text-sm text-indigo-600 font-bold font-mono">
                          {grossMarginPercentByYear[y].toFixed(1)}%
                        </td>
                      ))}
                      <td className="text-right py-4 px-4 text-sm font-bold text-indigo-700 bg-indigo-50/30 font-mono">
                        {calculatedMarginPercent.toFixed(1)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div ref={grossMarginChartRef} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative group">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-3">
                  <h2 className="text-lg font-medium">Gross Margin % Trend</h2>
                  <MarketFlags market={activeMarket} />
                </div>
                <div data-export-exclude="true" className="flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button 
                    onClick={() => copyChart(grossMarginChartRef, 'gross-margin-trend')}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Copy to Clipboard"
                  >
                    {copiedChart === 'gross-margin-trend' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={() => downloadChart(grossMarginChartRef, 'gross-margin-trend')}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Download as PNG"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={years.map(y => ({
                      name: `Year ${y + 1}`,
                      margin: Number(grossMarginPercentByYear[y].toFixed(1))
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, 'Gross Margin %']}
                      contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="margin" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="margin" position="top" formatter={(v: number) => `${v}%`} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        <div className={activeTab === 'cash-flow' ? 'block' : 'opacity-0 pointer-events-none absolute -z-10 w-full'}>
          
              {/* Aggregated Cash Flow Statement */}
              <div ref={aggregatedCashFlowRef} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative group mt-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-semibold flex items-center space-x-2">
                      <Activity className="w-6 h-6 text-indigo-600" />
                      <span>Aggregated Cash Flow Statement ({activeMarket})</span>
                    </h2>
                    <MarketFlags market={activeMarket} />
                  </div>
                  <div data-export-exclude="true" className="flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button 
                      onClick={() => copyChart(aggregatedCashFlowRef, 'aggregated-cash-flow')}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Copy to Clipboard"
                    >
                      {copiedChart === 'aggregated-cash-flow' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={() => downloadChart(aggregatedCashFlowRef, 'aggregated-cash-flow')}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Download as PNG"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-3 px-2 font-semibold text-slate-600">Metric</th>
                        {years.map(y => (
                          <th key={y} className="text-right py-3 px-2 font-semibold text-slate-600">Year {y + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-50 bg-slate-50/50">
                        <td colSpan={6} className="py-2 px-2 font-bold text-slate-900">Cash Flow from Operating Activities</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 px-2 font-medium text-slate-700 pl-4">Net Income</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-2 px-2 font-mono whitespace-nowrap ${netIncomeByYear[y] >= 0 ? 'text-slate-600' : 'text-red-600'}`}>{formatCurrency(netIncomeByYear[y])}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 px-2 text-sm text-slate-600 pl-8">(+) Increase in Deferred Revenue</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-2 px-2 font-mono whitespace-nowrap ${increaseDefRev[y] >= 0 ? 'text-slate-600' : 'text-red-600'}`}>{formatCurrency(increaseDefRev[y])}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 px-2 text-sm text-slate-600 pl-8">(+) Increase in Accrued Provider Fees</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-2 px-2 font-mono whitespace-nowrap ${increaseAccruedFees[y] >= 0 ? 'text-slate-600' : 'text-red-600'}`}>{formatCurrency(increaseAccruedFees[y])}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-slate-50 bg-indigo-50/20">
                        <td className="py-2 px-2 font-semibold text-indigo-800 pl-4">= Net Cash from Operating Activities</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-2 px-2 font-bold font-mono whitespace-nowrap ${cashFromOp[y] >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>{formatCurrency(cashFromOp[y])}</td>
                        ))}
                      </tr>

                      <tr className="border-b border-slate-50 bg-slate-50/50">
                        <td colSpan={6} className="py-2 px-2 font-bold text-slate-900 pt-6">Cash Flow from Financing Activities</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 px-2 font-medium text-slate-700 pl-4">(+) Issuance of Share Capital (Equity)</td>
                        {years.map(y => (
                          <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-600">{formatCurrency(cashFromFinancing[y])}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-slate-50 bg-indigo-50/20">
                        <td className="py-2 px-2 font-semibold text-indigo-800 pl-4">= Net Cash from Financing Activities</td>
                        {years.map(y => (
                          <td key={y} className="text-right py-2 px-2 font-bold font-mono whitespace-nowrap text-slate-600">{formatCurrency(cashFromFinancing[y])}</td>
                        ))}
                      </tr>
                      
                      <tr className="border-b border-slate-100 bg-slate-100/50">
                        <td className="py-3 px-2 font-bold text-slate-900 pt-6">Net Increase in Cash for the Period</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-3 px-2 font-bold font-mono whitespace-nowrap ${netIncreaseInCash[y] >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(netIncreaseInCash[y])}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 px-2 font-medium text-slate-600 text-sm">Cash Balance at Beginning of Period</td>
                        {years.map(y => (
                          <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-500 text-sm">{formatCurrency(cashBalanceBeginning[y])}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-slate-50 bg-emerald-50/20">
                        <td className="py-3 px-2 font-bold text-emerald-800">Cash Balance at End of Period</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-3 px-2 font-bold font-mono whitespace-nowrap ${cashBalanceEnd[y] >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(cashBalanceEnd[y])}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

          <div ref={cashFlowRef} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold flex items-center space-x-2">
                  <Activity className="w-6 h-6 text-indigo-600" />
                  <span>Detailed Cash Flow Statement ({activeMarket})</span>
                </h2>
                <MarketFlags market={activeMarket} />
              </div>
              <div data-export-exclude="true" className="flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button 
                  onClick={() => copyChart(cashFlowRef, 'cash-flow-statement')}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Copy to Clipboard"
                >
                  {copiedChart === 'cash-flow-statement' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => downloadChart(cashFlowRef, 'cash-flow-statement')}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Download as PNG"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-2 font-semibold text-slate-600">Metric</th>
                    {years.map(y => (
                      <th key={y} className="text-right py-3 px-2 font-semibold text-slate-600">Year {y + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <td colSpan={6} className="py-2 px-2 font-bold text-slate-900">Cash Flow from Operating Activities</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 px-2 font-medium text-slate-700 pl-4">Net Income</td>
                    {years.map(y => (
                      <td key={y} className={`text-right py-2 px-2 font-mono whitespace-nowrap ${netIncomeByYear[y] >= 0 ? 'text-slate-600' : 'text-red-600'}`}>{formatCurrency(netIncomeByYear[y])}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 px-2 font-medium text-slate-700 pl-4">Depreciation & Amortization</td>
                    {years.map(y => (
                      <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-600">{getCurrencySymbol()}0</td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 px-2 font-medium text-slate-700 pl-4">Changes in Working Capital:</td>
                    {years.map(y => (
                      <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap"></td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 px-2 text-sm text-slate-600 pl-8">(+) Increase in Deferred Revenue</td>
                    {years.map(y => (
                      <td key={y} className={`text-right py-2 px-2 font-mono whitespace-nowrap ${increaseDefRev[y] >= 0 ? 'text-slate-600' : 'text-red-600'}`}>{formatCurrency(increaseDefRev[y])}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 px-2 text-sm text-slate-600 pl-8">(+) Increase in Accrued Provider Fees</td>
                    {years.map(y => (
                      <td key={y} className={`text-right py-2 px-2 font-mono whitespace-nowrap ${increaseAccruedFees[y] >= 0 ? 'text-slate-600' : 'text-red-600'}`}>{formatCurrency(increaseAccruedFees[y])}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-50 bg-indigo-50/20">
                    <td className="py-2 px-2 font-semibold text-indigo-800 pl-4">= Net Cash from Operating Activities</td>
                    {years.map(y => (
                      <td key={y} className={`text-right py-2 px-2 font-bold font-mono whitespace-nowrap ${cashFromOp[y] >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>{formatCurrency(cashFromOp[y])}</td>
                    ))}
                  </tr>

                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <td colSpan={6} className="py-2 px-2 font-bold text-slate-900 pt-6">Cash Flow from Investing Activities</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 px-2 font-medium text-slate-700 pl-4">(-) Capital Expenditures (CapEx / IT)</td>
                    {years.map(y => (
                      <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-600">{getCurrencySymbol()}0</td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-50 bg-indigo-50/20">
                    <td className="py-2 px-2 font-semibold text-indigo-800 pl-4">= Net Cash from Investing Activities</td>
                    {years.map(y => (
                      <td key={y} className="text-right py-2 px-2 font-bold font-mono whitespace-nowrap text-slate-600">{getCurrencySymbol()}0</td>
                    ))}
                  </tr>

                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <td colSpan={6} className="py-2 px-2 font-bold text-slate-900 pt-6">Cash Flow from Financing Activities</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 px-2 font-medium text-slate-700 pl-4">(+) Issuance of Share Capital (Equity)</td>
                    {years.map(y => (
                      <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-600">{formatCurrency(cashFromFinancing[y])}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-50 bg-indigo-50/20">
                    <td className="py-2 px-2 font-semibold text-indigo-800 pl-4">= Net Cash from Financing Activities</td>
                    {years.map(y => (
                      <td key={y} className="text-right py-2 px-2 font-bold font-mono whitespace-nowrap text-slate-600">{formatCurrency(cashFromFinancing[y])}</td>
                    ))}
                  </tr>

                  <tr className="border-b border-slate-100 bg-slate-100/50">
                    <td className="py-3 px-2 font-bold text-slate-900">Net Increase in Cash for the Period</td>
                    {years.map(y => (
                      <td key={y} className={`text-right py-3 px-2 font-bold font-mono whitespace-nowrap ${netIncreaseInCash[y] >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(netIncreaseInCash[y])}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 px-2 font-medium text-slate-600 text-sm">Cash Balance at Beginning of Period</td>
                    {years.map(y => (
                      <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-500 text-sm">{formatCurrency(cashBalanceBeginning[y])}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-50 bg-emerald-50/20">
                    <td className="py-3 px-2 font-bold text-emerald-800">Cash Balance at End of Period</td>
                    {years.map(y => (
                      <td key={y} className={`text-right py-3 px-2 font-bold font-mono whitespace-nowrap ${cashBalanceEnd[y] >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(cashBalanceEnd[y])}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className={activeTab === 'balance-sheet' ? 'block' : 'opacity-0 pointer-events-none absolute -z-10 w-full'}>
          
              {/* Aggregated Balance Sheet */}
              <div ref={aggregatedBalanceSheetRef} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative group mt-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-semibold flex items-center space-x-2">
                      <Calculator className="w-6 h-6 text-indigo-600" />
                      <span>Aggregated Balance Sheet ({activeMarket})</span>
                    </h2>
                    <MarketFlags market={activeMarket} />
                  </div>
                  <div data-export-exclude="true" className="flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button 
                      onClick={() => copyChart(aggregatedBalanceSheetRef, 'aggregated-balance-sheet')}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Copy to Clipboard"
                    >
                      {copiedChart === 'aggregated-balance-sheet' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={() => downloadChart(aggregatedBalanceSheetRef, 'aggregated-balance-sheet')}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Download as PNG"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-3 px-2 font-semibold text-slate-600">Metric</th>
                        {years.map(y => (
                          <th key={y} className="text-right py-3 px-2 font-semibold text-slate-600">Year {y + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-50 bg-indigo-50/30">
                        <td colSpan={6} className="py-3 px-2 font-bold text-indigo-900">ASSETS</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 px-2 font-medium text-slate-600 pl-8">Cash & Cash Equivalents</td>
                        {years.map(y => (
                          <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-700">{formatCurrency(cashBalanceEnd[y])}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-slate-50 bg-indigo-50/10">
                        <td className="py-3 px-2 font-bold text-indigo-800 pl-4">TOTAL ASSETS</td>
                        {years.map(y => (
                          <td key={y} className="text-right py-3 px-2 font-bold font-mono whitespace-nowrap text-indigo-900">{formatCurrency(cashBalanceEnd[y])}</td>
                        ))}
                      </tr>

                      <tr className="border-b border-slate-50 bg-indigo-50/30">
                        <td colSpan={6} className="py-3 px-2 font-bold text-indigo-900 mt-4">LIABILITIES</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 px-2 font-medium text-slate-600 pl-8">Deferred Revenue</td>
                        {years.map(y => (
                          <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-700">{formatCurrency(defRevBalance[y])}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 px-2 font-medium text-slate-600 pl-8">Accrued Provider Fees</td>
                        {years.map(y => (
                          <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-700">{formatCurrency(accruedFeesBalance[y])}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-slate-50 bg-indigo-50/10">
                        <td className="py-3 px-2 font-bold text-indigo-800 pl-4">TOTAL LIABILITIES</td>
                        {years.map(y => (
                          <td key={y} className="text-right py-3 px-2 font-bold font-mono whitespace-nowrap text-indigo-900">{formatCurrency(totalLiabilities[y])}</td>
                        ))}
                      </tr>

                      <tr className="border-b border-slate-50 bg-indigo-50/30">
                        <td colSpan={6} className="py-3 px-2 font-bold text-indigo-900 mt-4">EQUITY</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 px-2 font-medium text-slate-600 pl-8">Share Capital</td>
                        {years.map(y => (
                          <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-700">{formatCurrency(shareCapital[y])}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 px-2 font-medium text-slate-600 pl-8">Retained Earnings</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-2 px-2 font-mono whitespace-nowrap ${retainedEarnings[y] >= 0 ? 'text-slate-700' : 'text-red-600'}`}>{formatCurrency(retainedEarnings[y])}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 px-2 font-medium text-slate-600 pl-8">Net Income</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-2 px-2 font-mono whitespace-nowrap ${netIncomeByYear[y] >= 0 ? 'text-slate-700' : 'text-red-600'}`}>{formatCurrency(netIncomeByYear[y])}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-slate-50 bg-indigo-50/10">
                        <td className="py-3 px-2 font-bold text-indigo-800 pl-4">TOTAL EQUITY</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-3 px-2 font-bold font-mono whitespace-nowrap ${totalEquity[y] >= 0 ? 'text-indigo-900' : 'text-red-700'}`}>{formatCurrency(totalEquity[y])}</td>
                        ))}
                      </tr>

                      <tr className="border-b border-slate-100 bg-slate-100/80">
                        <td className="py-3 px-2 font-bold text-slate-900">TOTAL LIABILITIES & EQUITY</td>
                        {years.map(y => (
                          <td key={y} className="text-right py-3 px-2 font-bold font-mono whitespace-nowrap text-slate-900">{formatCurrency(totalLiabilities[y] + totalEquity[y])}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

          <div ref={balanceSheetRef} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold flex items-center space-x-2">
                  <Calculator className="w-6 h-6 text-indigo-600" />
                  <span>Detailed Balance Sheet ({activeMarket})</span>
                </h2>
                <MarketFlags market={activeMarket} />
              </div>
              <div data-export-exclude="true" className="flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button 
                  onClick={() => copyChart(balanceSheetRef, 'balance-sheet')}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Copy to Clipboard"
                >
                  {copiedChart === 'balance-sheet' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => downloadChart(balanceSheetRef, 'balance-sheet')}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Download as PNG"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-2 font-semibold text-slate-600">Metric</th>
                    {years.map(y => (
                      <th key={y} className="text-right py-3 px-2 font-semibold text-slate-600">Year {y + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-50 bg-indigo-50/30">
                    <td colSpan={6} className="py-3 px-2 font-bold text-indigo-900">ASSETS</td>
                  </tr>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <td colSpan={6} className="py-2 px-2 font-semibold text-slate-700 pl-4">Current Assets</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 px-2 font-medium text-slate-600 pl-8">Cash & Cash Equivalents</td>
                    {years.map(y => (
                      <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-700">{formatCurrency(cashBalanceEnd[y])}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 px-2 font-medium text-slate-600 pl-8">Accounts Receivable</td>
                    {years.map(y => (
                      <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-600">{getCurrencySymbol()}0</td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <td colSpan={6} className="py-2 px-2 font-semibold text-slate-700 pl-4 pt-4">Non-Current Assets</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 px-2 font-medium text-slate-600 pl-8">Intangible Assets (Software)</td>
                    {years.map(y => (
                      <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-600">{getCurrencySymbol()}0</td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 px-2 font-medium text-slate-600 pl-8">Property, Plant & Equipment (PPE)</td>
                    {years.map(y => (
                      <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-600">{getCurrencySymbol()}0</td>
                    ))}
                  </tr>
                  <tr className="border-b-2 border-indigo-200 bg-indigo-50/50">
                    <td className="py-3 px-2 font-bold text-indigo-900">TOTAL ASSETS</td>
                    {years.map(y => (
                      <td key={y} className="text-right py-3 px-2 font-bold font-mono whitespace-nowrap text-indigo-900">{formatCurrency(cashBalanceEnd[y])}</td>
                    ))}
                  </tr>

                  <tr className="border-b border-slate-50 bg-indigo-50/30">
                    <td colSpan={6} className="py-3 px-2 font-bold text-indigo-900 pt-6">LIABILITIES</td>
                  </tr>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <td colSpan={6} className="py-2 px-2 font-semibold text-slate-700 pl-4">Current Liabilities</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 px-2 font-medium text-slate-600 pl-8">Deferred Revenue</td>
                    {years.map(y => (
                      <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-700">{formatCurrency(defRevBalance[y])}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 px-2 font-medium text-slate-600 pl-8">Accrued Provider Fees</td>
                    {years.map(y => (
                      <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-700">{formatCurrency(accruedFeesBalance[y])}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <td colSpan={6} className="py-2 px-2 font-semibold text-slate-700 pl-4 pt-4">Non-Current Liabilities</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 px-2 font-medium text-slate-600 pl-8">Long-Term Debt</td>
                    {years.map(y => (
                      <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-600">{getCurrencySymbol()}0</td>
                    ))}
                  </tr>
                  <tr className="border-b-2 border-indigo-200 bg-indigo-50/20">
                    <td className="py-3 px-2 font-bold text-indigo-900 pl-4">TOTAL LIABILITIES</td>
                    {years.map(y => (
                      <td key={y} className="text-right py-3 px-2 font-bold font-mono whitespace-nowrap text-indigo-800">{formatCurrency(totalLiabilities[y])}</td>
                    ))}
                  </tr>

                  <tr className="border-b border-slate-50 bg-indigo-50/30">
                    <td colSpan={6} className="py-3 px-2 font-bold text-indigo-900 pt-6">EQUITY</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 px-2 font-medium text-slate-600 pl-8">Share Capital</td>
                    {years.map(y => (
                      <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-700">{formatCurrency(shareCapital[y])}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 px-2 font-medium text-slate-600 pl-8">Retained Earnings</td>
                    {years.map(y => (
                      <td key={y} className={`text-right py-2 px-2 font-mono whitespace-nowrap ${retainedEarnings[y] >= 0 ? 'text-slate-700' : 'text-red-600'}`}>{formatCurrency(retainedEarnings[y])}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 px-2 font-medium text-slate-600 pl-8">Net Income</td>
                    {years.map(y => (
                      <td key={y} className={`text-right py-2 px-2 font-mono whitespace-nowrap ${netIncomeByYear[y] >= 0 ? 'text-slate-700' : 'text-red-600'}`}>{formatCurrency(netIncomeByYear[y])}</td>
                    ))}
                  </tr>
                  <tr className="border-b-2 border-indigo-200 bg-indigo-50/20">
                    <td className="py-3 px-2 font-bold text-indigo-900 pl-4">TOTAL EQUITY</td>
                    {years.map(y => (
                      <td key={y} className={`text-right py-3 px-2 font-bold font-mono whitespace-nowrap ${totalEquity[y] >= 0 ? 'text-indigo-800' : 'text-red-800'}`}>{formatCurrency(totalEquity[y])}</td>
                    ))}
                  </tr>

                  <tr className="bg-slate-900 text-white mt-4">
                    <td className="py-4 px-4 font-bold text-lg">TOTAL LIABILITIES & EQUITY</td>
                    {years.map(y => (
                      <td key={y} className="text-right py-4 px-4 font-bold font-mono whitespace-nowrap">{formatCurrency(totalLiabilities[y] + totalEquity[y])}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className={activeTab === 'sensitivity' ? 'block' : 'opacity-0 pointer-events-none absolute -z-10 w-full'}>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold flex items-center space-x-2">
                  <Calculator className="w-6 h-6 text-indigo-600" />
                  <span>Sensitivity Analysis</span>
                </h2>
                <MarketFlags market={activeMarket} />
              </div>
              <div className="flex space-x-6 text-sm">
                <div className="flex flex-col items-end bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-medium text-xs uppercase tracking-wide">PT Total Bookings (5Y)</span>
                  <span className="font-mono font-bold text-slate-800 text-base">{new Intl.NumberFormat('en-US').format(Math.round(sensitivityData.ptBookings))}</span>
                </div>
                <div className="flex flex-col items-end bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-medium text-xs uppercase tracking-wide">UK Total Bookings (5Y)</span>
                  <span className="font-mono font-bold text-slate-800 text-base">{new Intl.NumberFormat('en-US').format(Math.round(sensitivityData.ukBookings))}</span>
                </div>
              </div>
            </div>

            {currentMods ? (<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">

              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span>New Owners Added</span>
                  <span className={(currentMods?.newOwners || 0) > 0 ? 'text-indigo-600 font-bold' : (currentMods?.newOwners || 0) < 0 ? 'text-rose-600 font-bold' : 'text-slate-500 font-bold'}>
                    {(currentMods?.newOwners || 0) > 0 ? '+' : ''}{(currentMods?.newOwners || 0)}%
                  </span>
                </label>
                <RangeWithButtons min="-50" max="50" value={(currentMods?.newOwners || 0)} onChange={(e: any) => handleModChange('newOwners', Number(e.target.value))} />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span>New Providers Added</span>
                  <span className={(currentMods?.newProviders || 0) > 0 ? 'text-indigo-600 font-bold' : (currentMods?.newProviders || 0) < 0 ? 'text-rose-600 font-bold' : 'text-slate-500 font-bold'}>
                    {(currentMods?.newProviders || 0) > 0 ? '+' : ''}{(currentMods?.newProviders || 0)}%
                  </span>
                </label>
                <RangeWithButtons min="-50" max="50" value={(currentMods?.newProviders || 0)} onChange={(e: any) => handleModChange('newProviders', Number(e.target.value))} />
              </div>

              <div className="space-y-4 col-span-1 md:col-span-3">
                <label className="text-sm font-medium text-slate-700">Owner Churn Rate (%) - Absolute Value</label>
                <div className="grid grid-cols-5 gap-4">
                  {years.map(y => {
                    const base = getBasePlatformMetric('Owner churn rate (%)', y);
                    const val = base + ((currentMods?.ownerChurn && currentMods?.ownerChurn[y]) || 0);
                    return (
                      <div key={y} className="flex flex-col space-y-1">
                        <span className="text-xs text-slate-500">Year {y+1}</span>
                        <input 
                          type="number"
                          step="1"
                          value={val.toFixed(1)}
                          onChange={e => {
                            const newVal = Array.isArray(currentMods?.ownerChurn) ? [...currentMods?.ownerChurn] : [0,0,0,0,0];
                            newVal[y] = Number(e.target.value) - base;
                            handleModChange('ownerChurn', newVal);
                          }}
                          className="border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4 col-span-1 md:col-span-3">
                <label className="text-sm font-medium text-slate-700">Provider Churn Rate (%) - Absolute Value</label>
                <div className="grid grid-cols-5 gap-4">
                  {years.map(y => {
                    const base = getBasePlatformMetric('Provider churn rate (%)', y);
                    const val = base + ((currentMods?.providerChurn && currentMods?.providerChurn[y]) || 0);
                    return (
                      <div key={y} className="flex flex-col space-y-1">
                        <span className="text-xs text-slate-500">Year {y+1}</span>
                        <input 
                          type="number"
                          step="1"
                          value={val.toFixed(1)}
                          onChange={e => {
                            const newVal = Array.isArray(currentMods?.providerChurn) ? [...currentMods?.providerChurn] : [0,0,0,0,0];
                            newVal[y] = Number(e.target.value) - base;
                            handleModChange('providerChurn', newVal);
                          }}
                          className="border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4 col-span-1 md:col-span-3">
                <label className="text-sm font-medium text-slate-700 flex items-center">Unit Customer Support cost - Owners ({getCurrencySymbol()}) - Absolute Value</label>
                <div className="grid grid-cols-5 gap-4">
                  {years.map(y => {
                    const base = getBasePlatformMetric('Unit Customer Support cost - Owners', y);
                    const val = base + ((currentMods?.unitCustomerSupportCostOwners && currentMods?.unitCustomerSupportCostOwners[y]) || 0);
                    return (
                      <div key={y} className="flex flex-col space-y-1">
                        <span className="text-xs text-slate-500">Year {y+1}</span>
                        <input 
                          type="number"
                          step="0.00001"
                          value={val.toFixed(5)}
                          onChange={e => {
                            const newVal = Array.isArray(currentMods?.unitCustomerSupportCostOwners) ? [...currentMods?.unitCustomerSupportCostOwners] : [0,0,0,0,0];
                            newVal[y] = Number(e.target.value) - base;
                            handleModChange('unitCustomerSupportCostOwners', newVal);
                          }}
                          className="border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span>WACC</span>
                  <span className="text-indigo-600 font-bold">
                    {(17.3 + sensitivityMods.wacc).toFixed(1)}%
                  </span>
                </label>
                <RangeWithButtons min="0" max="50" step="0.1" value={17.3 + sensitivityMods.wacc} onChange={(e: any) => setSensitivityMods({...sensitivityMods, wacc: Number(e.target.value) - 17.3})} />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span>Avg Price per Booking</span>
                  <span className="text-indigo-600 font-bold">
                    {formatCurrency(getBasePlatformMetric('Avg price per booking') + (currentMods?.avgPricePerBooking || 0))}
                  </span>
                </label>
                <RangeWithButtons min={Math.max(0, getBasePlatformMetric('Avg price per booking') - 50)} max={getBasePlatformMetric('Avg price per booking') + 50} value={getBasePlatformMetric('Avg price per booking') + (currentMods?.avgPricePerBooking || 0)} onChange={(e: any) => handleModChange('avgPricePerBooking', Number(e.target.value) - getBasePlatformMetric('Avg price per booking'))} />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span>% of Bookings Commission</span>
                  <span className="text-indigo-600 font-bold">
                    {(getBasePlatformMetric('% of bookings commission') + (currentMods?.commission || 0)).toFixed(1)}%
                  </span>
                </label>
                <RangeWithButtons min={0} max={100} step={0.5} value={getBasePlatformMetric('% of bookings commission') + (currentMods?.commission || 0)} onChange={(e: any) => handleModChange('commission', Number(e.target.value) - getBasePlatformMetric('% of bookings commission'))} />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span>Monthly Subscription Fee</span>
                  <span className="text-indigo-600 font-bold">
                    {formatCurrency(getBasePlatformMetric('Monthly Subscription fee') + (currentMods?.subscriptionFee || 0))}
                  </span>
                </label>
                <RangeWithButtons min={0} max={getBasePlatformMetric('Monthly Subscription fee') + 100} value={getBasePlatformMetric('Monthly Subscription fee') + (currentMods?.subscriptionFee || 0)} onChange={(e: any) => handleModChange('subscriptionFee', Number(e.target.value) - getBasePlatformMetric('Monthly Subscription fee'))} />
              </div>

              <div className="space-y-4">
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
                  <span>IT R&D and Support</span>
                  <span className={(currentMods?.itRnD || 0) > 0 ? 'text-indigo-600 font-bold' : (currentMods?.itRnD || 0) < 0 ? 'text-rose-600 font-bold' : 'text-slate-500 font-bold'}>
                    {(currentMods?.itRnD || 0) > 0 ? '+' : ''}{(currentMods?.itRnD || 0)}%
                  </span>
                </label>
                <RangeWithButtons min="-50" max="50" value={(currentMods?.itRnD || 0)} onChange={(e: any) => handleModChange('itRnD', Number(e.target.value))} />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex justify-between items-center">
                  <span>Advertisement & Promotion</span>
                  <div className="flex items-center">
                    <input 
                      type="number" 
                      step="0.00001"
                      className={`text-right w-24 bg-transparent border-b focus:outline-none ${ (currentMods?.marketing || 0) > 0 ? 'text-indigo-600 font-bold border-indigo-200 focus:border-indigo-600' : (currentMods?.marketing || 0) < 0 ? 'text-rose-600 font-bold border-rose-200 focus:border-rose-600' : 'text-slate-500 font-bold border-slate-200 focus:border-slate-500'}`}
                      value={(currentMods?.marketing || 0).toFixed(5)}
                      onChange={(e) => handleModChange('marketing', Number(e.target.value))}
                    />
                    <span className={(currentMods?.marketing || 0) > 0 ? 'text-indigo-600 font-bold ml-1' : (currentMods?.marketing || 0) < 0 ? 'text-rose-600 font-bold ml-1' : 'text-slate-500 font-bold ml-1'}>%</span>
                  </div>
                </label>
                <RangeWithButtons min="-50" max="50" step={0.00001} value={(currentMods?.marketing || 0)} onChange={(e: any) => handleModChange('marketing', Number(e.target.value))} />
              </div>
            </div>) : (<div className="flex flex-col items-center justify-center p-12 bg-slate-50 border border-slate-100 rounded-xl mb-10"><p className="text-slate-500 font-medium mb-2">Sensitivity modifiers are applied per market.</p><p className="text-slate-400 text-sm">Please select Portugal or UK from the market selector above to edit sensitivity variables.</p></div>)}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">NPV (WACC {(17.3 + sensitivityMods.wacc).toFixed(1)}%)</span>
                <span className="text-lg font-bold text-slate-900">{formatCurrency(sensitivityData.metrics.npv)}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">IRR</span>
                <span className="text-lg font-bold text-slate-900">{sensitivityData.metrics.irr !== null ? (sensitivityData.metrics.irr * 100).toFixed(1) + '%' : 'N/A'}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Avg Ann ROI</span>
                <span className="text-lg font-bold text-slate-900">{(sensitivityData.metrics.roi * 100).toFixed(1)}%</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total ROI</span>
                <span className="text-lg font-bold text-slate-900">{(sensitivityData.metrics.totalRoi * 100).toFixed(1)}%</span>
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
                    <th className="py-3 px-4 font-semibold text-slate-900 rounded-tl-lg">Modified P&L</th>
                    {years.map(y => (
                      <th key={y} className="text-right py-3 px-4 font-semibold text-slate-900">Year {y + 1}</th>
                    ))}
                    <th className="text-right py-3 px-4 font-semibold text-slate-900 bg-slate-100 rounded-tr-lg">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-medium text-slate-800">Gross Revenue</td>
                    {years.map(y => (
                      <td key={y} className="text-right py-3 px-4 font-mono whitespace-nowrap text-slate-700">
                        {formatCurrency(sensitivityData.data.grossRev[y])}
                      </td>
                    ))}
                    <td className="text-right py-3 px-4 font-mono whitespace-nowrap font-bold text-slate-800 bg-slate-50/50">
                      {formatCurrency(sensitivityData.totals.grossRev)}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-medium text-slate-800">Net Revenue</td>
                    {years.map(y => (
                      <td key={y} className="text-right py-3 px-4 font-mono whitespace-nowrap text-slate-700">
                        {formatCurrency(sensitivityData.data.netRev[y])}
                      </td>
                    ))}
                    <td className="text-right py-3 px-4 font-mono whitespace-nowrap font-bold text-slate-800 bg-slate-50/50">
                      {formatCurrency(sensitivityData.totals.netRev)}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-medium text-slate-800">COGS</td>
                    {years.map(y => (
                      <td key={y} className="text-right py-3 px-4 font-mono whitespace-nowrap text-red-600">
                        -{formatCurrency(sensitivityData.data.cogs[y])}
                      </td>
                    ))}
                    <td className="text-right py-3 px-4 font-mono whitespace-nowrap font-bold text-red-700 bg-slate-50/50">
                      -{formatCurrency(sensitivityData.totals.cogs)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/80 font-bold border-y border-slate-200">
                    <td className="py-3 px-4 text-slate-900">Gross Margin</td>
                    {years.map(y => (
                      <td key={y} className={`text-right py-3 px-4 font-mono whitespace-nowrap ${sensitivityData.data.margin[y] >= 0 ? 'text-slate-900' : 'text-red-700'}`}>
                        {formatCurrency(sensitivityData.data.margin[y])}
                      </td>
                    ))}
                    <td className={`text-right py-3 px-4 font-mono whitespace-nowrap bg-slate-100 ${sensitivityData.totals.margin >= 0 ? 'text-slate-900' : 'text-red-700'}`}>
                      {formatCurrency(sensitivityData.totals.margin)}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-medium text-slate-800">Fixed Costs</td>
                    {years.map(y => (
                      <td key={y} className="text-right py-3 px-4 font-mono whitespace-nowrap text-red-600">
                        -{formatCurrency(sensitivityData.data.fixedCosts[y])}
                      </td>
                    ))}
                    <td className="text-right py-3 px-4 font-mono whitespace-nowrap font-bold text-red-700 bg-slate-50/50">
                      -{formatCurrency(sensitivityData.totals.fixedCosts)}
                    </td>
                  </tr>
                  <tr className="bg-indigo-50 border-y border-indigo-100 font-bold">
                    <td className="py-4 px-4 text-indigo-900">Operating Profit</td>
                    {years.map(y => (
                      <td key={y} className={`text-right py-4 px-4 font-mono whitespace-nowrap ${sensitivityData.data.opProfit[y] >= 0 ? 'text-indigo-800' : 'text-red-800'}`}>
                        {formatCurrency(sensitivityData.data.opProfit[y])}
                      </td>
                    ))}
                    <td className={`text-right py-4 px-4 font-mono whitespace-nowrap bg-indigo-100/50 ${sensitivityData.totals.opProfit >= 0 ? 'text-indigo-900' : 'text-red-900'}`}>
                      {formatCurrency(sensitivityData.totals.opProfit)}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50 border-b border-emerald-100 font-bold">
                    <td className="py-4 px-4 text-emerald-900">Net Income</td>
                    {years.map(y => (
                      <td key={y} className={`text-right py-4 px-4 font-mono whitespace-nowrap ${sensitivityData.data.netIncome[y] >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                        {formatCurrency(sensitivityData.data.netIncome[y])}
                      </td>
                    ))}
                    <td className={`text-right py-4 px-4 font-mono whitespace-nowrap bg-emerald-100/50 ${sensitivityData.totals.netIncome >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                      {formatCurrency(sensitivityData.totals.netIncome)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className={activeTab === 'highlights' ? 'block' : 'opacity-0 pointer-events-none absolute -z-10 w-full'}>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold flex items-center space-x-2">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                  <span>Financial Highlights</span>
                </h2>
                <MarketFlags market={activeMarket} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              </div>

              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Operating Profit</h3>
                <div className="flex items-baseline space-x-3">
                  <span className={`text-3xl font-bold ${operatingProfit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                    {formatCurrency(operatingProfit)}
                  </span>
                  <span className={`text-lg font-medium ${calculatedOpProfitPercent >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>
                    {calculatedOpProfitPercent.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Net Income</h3>
                <div className="flex items-baseline space-x-3">
                  <span className={`text-3xl font-bold ${totalNetIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(totalNetIncome)}
                  </span>
                  <span className={`text-lg font-medium ${calculatedNetIncomePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {calculatedNetIncomePercent.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">NPV (WACC 17.3%)</h3>
                <div className="flex items-baseline space-x-3">
                  <span className={`text-3xl font-bold ${npv >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                    {formatCurrency(npv)}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Internal Rate of Return (IRR)</h3>
                <div className="flex items-baseline space-x-3">
                  <span className={`text-3xl font-bold ${irr >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                    {(irr * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Payback Period</h3>
                <div className="flex items-baseline space-x-3">
                  <span className={`text-3xl font-bold ${paybackPeriod !== null && paybackPeriod <= 5 ? 'text-slate-800' : 'text-red-600'}`}>
                    {paybackPeriod !== null ? `${paybackPeriod.toFixed(1)} Years` : '> 5 Years'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Discounted Payback</h3>
                <div className="flex items-baseline space-x-3">
                  <span className={`text-3xl font-bold ${discountedPaybackPeriod !== null && discountedPaybackPeriod <= 5 ? 'text-slate-800' : 'text-red-600'}`}>
                    {discountedPaybackPeriod !== null ? `${discountedPaybackPeriod.toFixed(1)} Years` : '> 5 Years'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
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
                  <span className={`text-3xl font-bold ${clvCacRatio >= 3 ? 'text-emerald-600' : clvCacRatio >= 1 ? 'text-indigo-600' : 'text-red-600'}`}>
                    {clvCacRatio.toFixed(1)}x
                  </span>
                  <span className="text-sm font-medium text-slate-500">Target: &gt; 3.0x</span>
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Average Annual ROI</h3>
                <div className="flex items-baseline space-x-3">
                  <span className={`text-3xl font-bold ${roi >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                    {(roi * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  ({formatCurrency(totalNetIncome / 5)} / {formatCurrency(totalInvestment)})
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 relative group">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Total ROI</h3>
                <div className="flex items-baseline space-x-3">
                  <span className={`text-3xl font-bold ${totalRoi >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                    {(totalRoi * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  ({formatCurrency(totalNetIncome)} / {formatCurrency(totalInvestment)})
                </div>
              </div>
            </div>
          </div>
  
        <div className={activeTab === 'monte-carlo' ? 'block' : 'opacity-0 pointer-events-none absolute -z-10 w-full'}>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold flex items-center space-x-2">
                  <Activity className="w-6 h-6 text-indigo-600" />
                  <span>Monte Carlo Simulation</span>
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                 <input type="number" min="100" max="10000" step="100" value={mcIterations} onChange={(e) => setMcIterations(Number(e.target.value))} className="border border-slate-300 rounded px-3 py-2 text-sm w-24 text-right" title="Iterations" />
                 <button onClick={runMonteCarlo} disabled={mcIsRunning} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors text-sm disabled:opacity-50">
                   {mcIsRunning ? 'Simulating...' : 'Run Simulation'}
                 </button>
              </div>
            </div>

            <div className="mb-6 bg-slate-50 p-4 border border-slate-100 rounded-xl">
              <p className="text-sm text-slate-600">
                This simulation runs <strong>{mcIterations} iterations</strong> using a normal distribution on the sensitivity modifiers to predict possible outcomes of key financial indicators.
                Modifiers are randomized with uniform variance of ±20% for scale modifiers and ±15% for normal distributions relative to current inputs.
              </p>
            </div>

            {mcResults ? (
              <div className="space-y-8">
                {['NPV', 'IRR', 'Average Annual ROI', 'Operating Profit', 'Net Profit'].map((metricName, idx) => {
                  let dataArr;
                  let formatter = formatCurrency;
                  if (metricName === 'NPV') dataArr = mcResults.npv;
                  if (metricName === 'IRR') { dataArr = mcResults.irr; formatter = (v) => (v * 100).toFixed(2) + '%'; }
                  if (metricName === 'Average Annual ROI') { dataArr = mcResults.roi; formatter = (v) => (v * 100).toFixed(2) + '%'; }
                  if (metricName === 'Total ROI') { dataArr = mcResults.totalRoi; formatter = (v) => (v * 100).toFixed(2) + '%'; }
                  if (metricName === 'Operating Profit') dataArr = mcResults.opProfit;
                  if (metricName === 'Net Profit') dataArr = mcResults.netProfit;

                  const p10 = getPercentile(dataArr, 0.1);
                  const p50 = getPercentile(dataArr, 0.5);
                  const p90 = getPercentile(dataArr, 0.9);
                  const mean = getMean(dataArr);
                  const min = dataArr[0];
                  const max = dataArr[dataArr.length - 1];

                  return (
                    <div key={metricName} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                        <h3 className="font-semibold text-slate-800">{metricName}</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-6 divide-x divide-y md:divide-y-0 divide-slate-100">
                        <div className="p-4 flex flex-col justify-center items-center">
                          <span className="text-xs text-slate-500 uppercase font-medium mb-1">Min</span>
                          <span className="font-bold font-mono text-slate-900">{formatter(min)}</span>
                        </div>
                        <div className="p-4 flex flex-col justify-center items-center bg-red-50/50">
                          <span className="text-xs text-red-600 uppercase font-medium mb-1">P10 (Worst Case)</span>
                          <span className="font-bold font-mono text-red-900">{formatter(p10)}</span>
                        </div>
                        <div className="p-4 flex flex-col justify-center items-center bg-indigo-50/50">
                          <span className="text-xs text-indigo-600 uppercase font-medium mb-1">Mean</span>
                          <span className="font-bold font-mono text-indigo-900">{formatter(mean)}</span>
                        </div>
                        <div className="p-4 flex flex-col justify-center items-center bg-slate-50">
                          <span className="text-xs text-slate-600 uppercase font-medium mb-1">P50 (Median)</span>
                          <span className="font-bold font-mono text-slate-900">{formatter(p50)}</span>
                        </div>
                        <div className="p-4 flex flex-col justify-center items-center bg-emerald-50/50">
                          <span className="text-xs text-emerald-600 uppercase font-medium mb-1">P90 (Best Case)</span>
                          <span className="font-bold font-mono text-emerald-900">{formatter(p90)}</span>
                        </div>
                        <div className="p-4 flex flex-col justify-center items-center">
                          <span className="text-xs text-slate-500 uppercase font-medium mb-1">Max</span>
                          <span className="font-bold font-mono text-slate-900">{formatter(max)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-16 bg-slate-50 border border-slate-100 rounded-xl">
                <Activity className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium mb-2">No simulation results yet</p>
                <p className="text-slate-400 text-sm mb-6">Click "Run Simulation" to generate {mcIterations} randomized scenarios.</p>
                <button onClick={runMonteCarlo} disabled={mcIsRunning} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg shadow-sm transition-colors disabled:opacity-50">
                   {mcIsRunning ? 'Simulating...' : 'Run Simulation'}
                 </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

