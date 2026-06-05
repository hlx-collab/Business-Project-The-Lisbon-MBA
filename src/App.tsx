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

type Market = 'Portugal' | 'UK' | 'Aggregated';

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
  { id: 'pm-payment-fee-per-tx', name: 'Payment Fee per Transaction', amounts: [0.30, 0.30, 0.30, 0.30, 0.30], isPermanent: true }
];

const DEFAULT_REVENUE_STREAMS: FinancialStream[] = [
  { id: 'rev-1', name: 'Monthly Subscriptions', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'rev-2', name: 'Booking Fees', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'rev-3', name: 'Others', amounts: ['', '', '', '', ''], isPermanent: true }
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
  { id: 'fc-3', name: 'Advertisement', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'fc-4', name: 'IT R&D and Support', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'fc-ga', name: 'G&A expenses', amounts: ['', '', '', '', ''], isPermanent: true }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'financials' | 'platform' | 'gross-margin' | 'cash-flow' | 'balance-sheet'>('financials');
  const [activeMarket, setActiveMarket] = useState<Market>('Portugal');
  const [copiedChart, setCopiedChart] = useState<string | null>(null);

  const providerAnalysisRef = useRef<HTMLDivElement>(null);
  const ownerAnalysisRef = useRef<HTMLDivElement>(null);
  const providerChurnRef = useRef<HTMLDivElement>(null);
  const ownerChurnRef = useRef<HTMLDivElement>(null);
  const financialSummaryRef = useRef<HTMLDivElement>(null);
  const revenueStreamsRef = useRef<HTMLDivElement>(null);
  const cogsRef = useRef<HTMLDivElement>(null);
  const fixedCostsRef = useRef<HTMLDivElement>(null);
  const platformMetricsRef = useRef<HTMLDivElement>(null);
  const platformSettingsRef = useRef<HTMLDivElement>(null);
  const grossMarginTableRef = useRef<HTMLDivElement>(null);
  const grossMarginChartRef = useRef<HTMLDivElement>(null);
  const financialOverviewChartRef = useRef<HTMLDivElement>(null);
  const viabilityComparisonChartRef = useRef<HTMLDivElement>(null);

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
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopiedChart(chartId);
          setTimeout(() => setCopiedChart(null), 2000);
        }
      } catch (err) {
        console.error('Failed to copy image:', err);
      }
    }
  };

  const MarketFlags = ({ market }: { market: Market }) => {
    const flags = {
      Portugal: [{ url: 'https://flagcdn.com/pt.svg', alt: 'Portugal' }],
      UK: [{ url: 'https://flagcdn.com/gb.svg', alt: 'UK' }],
      Aggregated: [
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
    const defaultMarketData = (): MarketData => ({
      platformMetricsStreams: [...DEFAULT_PLATFORM_METRICS],
      revenueStreams: [...DEFAULT_REVENUE_STREAMS],
      variableCostsStreams: [...DEFAULT_VARIABLE_COSTS_STREAMS],
      fixedCostsStreams: [...DEFAULT_FIXED_COSTS_STREAMS],
      chargeSubscription: [false, false, false, false, false],
      chargeBookingFees: [false, false, false, false, false],
    });

    const saved = localStorage.getItem('marketsData');
    if (saved) {
      const parsed = JSON.parse(saved);
      const upgrade = (market: MarketData): MarketData => {
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

        const base = market || defaultMarketData();
        return {
          ...base,
          platformMetricsStreams: syncStreams(base.platformMetricsStreams, DEFAULT_PLATFORM_METRICS),
          revenueStreams: syncStreams(base.revenueStreams, DEFAULT_REVENUE_STREAMS),
          variableCostsStreams: syncStreams(base.variableCostsStreams, DEFAULT_VARIABLE_COSTS_STREAMS),
          fixedCostsStreams: syncStreams(base.fixedCostsStreams, DEFAULT_FIXED_COSTS_STREAMS),
        };
      };

      return {
        Portugal: upgrade(parsed.Portugal),
        UK: upgrade(parsed.UK)
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
        revenueStreams: oldRevenue ? JSON.parse(oldRevenue) : [...DEFAULT_REVENUE_STREAMS],
        variableCostsStreams: oldVariable ? JSON.parse(oldVariable) : [...DEFAULT_VARIABLE_COSTS_STREAMS],
        fixedCostsStreams: oldFixed ? JSON.parse(oldFixed) : [...DEFAULT_FIXED_COSTS_STREAMS],
        chargeSubscription: oldChargeSub ? JSON.parse(oldChargeSub) : [false, false, false, false, false],
        chargeBookingFees: oldChargeBooking ? JSON.parse(oldChargeBooking) : [false, false, false, false, false],
      };
      return { Portugal: portugal, UK: defaultMarketData() };
    }

    return { Portugal: defaultMarketData(), UK: defaultMarketData() };
  });

  useEffect(() => {
    localStorage.setItem('marketsData', JSON.stringify(markets));
  }, [markets]);

  const years = [0, 1, 2, 3, 4];

  const calculateFinancials = (data: MarketData) => {
    const { platformMetricsStreams, revenueStreams, variableCostsStreams, fixedCostsStreams, chargeSubscription, chargeBookingFees } = data;

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
      
      const subscriptionsRevenue = derivedRevenueStreams.find(s => s.name === 'Monthly Subscriptions')?.amounts?.[y] || 0;
      const otherRevenue = derivedRevenueStreams
        .filter(s => s.name !== 'Monthly Subscriptions' && s.name !== 'Booking Fees')
        .reduce((sum, s) => sum + (Number(s.amounts[y]) || 0), 0);
        
      return bookingVolume + Number(subscriptionsRevenue) + otherRevenue;
    });

    const totalVarCostsByYear = years.map(y => derivedVariableCostsStreams.reduce((sum, stream) => sum + (Number(stream.amounts[y]) || 0), 0));
    const totalFixedCostsByYear = years.map(y => fixedCostsStreams.reduce((sum, stream) => sum + (Number(stream.amounts[y]) || 0), 0));
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
    const EQUITY_INJECTION = 200000;

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

    const cashFromFinancing = [EQUITY_INJECTION, ...years.slice(1).map(() => 0)];

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

    const shareCapital = years.map(() => EQUITY_INJECTION);
    const retainedEarnings: number[] = [];
    let currentRE = 0;
    
    for (let i = 0; i < 5; i++) {
        retainedEarnings[i] = currentRE;
        currentRE += netIncomeByYear[i];
    }

    const totalEquity = years.map(i => shareCapital[i] + retainedEarnings[i] + netIncomeByYear[i]);
    const totalLiabilities = years.map(i => defRevBalance[i] + accruedFeesBalance[i]);

    return {
      platformMetricsStreams: derivedPlatformMetricsStreams,
      derivedRevenueStreams,
      derivedVariableCostsStreams,
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
      calculatedMarginPercent,
      calculatedOpProfitPercent
    };
  };

  const updateMarketData = (updater: (prev: MarketData) => MarketData) => {
    if (activeMarket === 'Aggregated') return;
    setMarkets(prev => ({
      ...prev,
      [activeMarket]: updater(prev[activeMarket])
    }));
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
    calculatedMarginPercent,
    calculatedOpProfitPercent
  } = React.useMemo(() => {
    if (activeMarket === 'Aggregated') {
      const pt = markets.Portugal;
      const uk = markets.UK;
      const ptFin = { ...pt, ...calculateFinancials(pt) };
      const ukFin = { ...uk, ...calculateFinancials(uk) };

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
              }
              return Math.round(result);
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

    const TAX_RATE = 0.21;
    const EQUITY_INJECTION = 200000;

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

    const cashFromFinancing = [EQUITY_INJECTION, ...years.slice(1).map(() => 0)];

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

    const shareCapital = years.map(() => EQUITY_INJECTION);
    const retainedEarnings: number[] = [];
    let currentRE = 0;
    for (let i = 0; i < 5; i++) {
        retainedEarnings[i] = currentRE;
        currentRE += netIncomeByYear[i];
    }

    const totalEquity = years.map(i => shareCapital[i] + retainedEarnings[i] + netIncomeByYear[i]);
    const totalLiabilities = years.map(i => defRevBalance[i] + accruedFeesBalance[i]);

      return {
        platformMetricsStreams: aggregateStreams(ptFin.platformMetricsStreams, ukFin.platformMetricsStreams, true),
        revenueStreams: aggregateStreams(ptFin.revenueStreams, ukFin.revenueStreams),
        variableCostsStreams: aggregateStreams(ptFin.variableCostsStreams, ukFin.variableCostsStreams),
        fixedCostsStreams: aggregateStreams(ptFin.fixedCostsStreams, ukFin.fixedCostsStreams),
        derivedRevenueStreams: aggregateStreams(ptFin.derivedRevenueStreams, ukFin.derivedRevenueStreams),
        derivedVariableCostsStreams: aggregateStreams(ptFin.derivedVariableCostsStreams, ukFin.derivedVariableCostsStreams),
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
        calculatedMarginPercent,
        calculatedOpProfitPercent
      };
    }
    const currentMarketData = markets[activeMarket];
    return {
      ...currentMarketData,
      ...calculateFinancials(currentMarketData)
    };
  }, [activeMarket, markets]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const addStream = (streams: FinancialStream[], prefix: string, key: keyof MarketData) => {
    if (activeMarket === 'Aggregated') return;
    const sectionId = prefix.toLowerCase().replace(/\s+/g, '-');
    const newStream = { id: `${sectionId}-${Date.now()}`, name: `${prefix} ${streams.length + 1}`, amounts: ['', '', '', '', ''] };
    updateMarketData(prev => ({
      ...prev,
      [key]: [...(prev[key] as FinancialStream[]), newStream]
    }));
  };

  const updateStreamName = (streams: FinancialStream[], id: string, name: string, key: keyof MarketData) => {
    if (activeMarket === 'Aggregated') return;
    updateMarketData(prev => ({
      ...prev,
      [key]: (prev[key] as FinancialStream[]).map(stream => stream.id === id ? { ...stream, name } : stream)
    }));
  };

  const updateStreamAmount = (streams: FinancialStream[], id: string, yearIndex: number, value: number | '', key: keyof MarketData) => {
    if (activeMarket === 'Aggregated') return;
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
    if (activeMarket === 'Aggregated') return;
    updateMarketData(prev => ({
      ...prev,
      [key]: (prev[key] as FinancialStream[]).filter(stream => stream.id !== id)
    }));
  };

  const toggleCharge = (yearIndex: number, key: 'chargeSubscription' | 'chargeBookingFees') => {
    if (activeMarket === 'Aggregated') return;
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
      'New Providers': getVal('New providers added'),
      'Total Providers': getVal('Number of providers in the platform'),
      'Provider Churn': getVal('Provider churn rate (%)'),
      'New Owners': getVal('New owners added'),
      'Total Owners': getVal('Number of owners in the platform'),
      'Owner Churn': getVal('Owner churn rate (%)'),
    };
  });

  const formatTooltip = (value: any, name: any) => {
    const numValue = typeof value === 'number' ? value : Number(value);
    return [formatCurrency(numValue), name];
  };

  const formatCompactCurrency = (value: number) => {
    if (value === 0) return '€0';
    const absVal = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (absVal >= 1000000) return `${sign}€${(absVal / 1000000).toFixed(1)}M`;
    if (absVal >= 1000) return `${sign}€${(absVal / 1000).toFixed(0)}k`;
    return `${sign}€${absVal}`;
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
    fixedCostsStreams.forEach(stream => {
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
    const marketsToExport: Market[] = ['Portugal', 'UK', 'Aggregated'];

    const getColLetter = (col: number) => String.fromCharCode(65 + col);
    const getCellRef = (col: number, row: number) => `${getColLetter(col)}${row + 1}`;

    const ptFin = { ...markets.Portugal, ...calculateFinancials(markets.Portugal) };
    const ukFin = { ...markets.UK, ...calculateFinancials(markets.UK) };

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
    const fixedUnion = getUnion(ptFin.fixedCostsStreams, ukFin.fixedCostsStreams, DEFAULT_FIXED_COSTS_STREAMS);

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
        if (category === 'Fixed Cost') streams = mData.fixedCostsStreams;
        
        const stream = streams.find(s => s.name === streamName);
        return Number(stream?.amounts?.[yearIdx]) || 0;
      };

      // Platform Metrics
      const metricRowMap: Record<string, number> = {};
      platformUnion.forEach(name => {
        metricRowMap[name] = currentRow;
        const rowData: any[] = ['Platform Metric', name];
        years.forEach(y => {
          if (market === 'Aggregated') {
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

            if (weightedMetrics.includes(name)) {
              const col = getColLetter(2 + y);
              const row = currentRow + 1;
              const vPt = `'Portugal'!${col}${row}`;
              const vUk = `'UK'!${col}${row}`;
              let wPt = "";
              let wUk = "";

              if (name === '% of bookings commission') {
                const oRow = metricRowMap['Number of owners in the platform'];
                const bRow = metricRowMap['# of yearly bookings per pet owners'];
                const aRow = metricRowMap['Avg price per booking'];
                if (oRow !== undefined && bRow !== undefined && aRow !== undefined) {
                  wPt = `'Portugal'!${col}${oRow+1}*'Portugal'!${col}${bRow+1}*'Portugal'!${col}${aRow+1}`;
                  wUk = `'UK'!${col}${oRow+1}*'UK'!${col}${bRow+1}*'UK'!${col}${aRow+1}`;
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
              rowData.push({ formula: `'Portugal'!${getCellRef(2 + y, currentRow)} + 'UK'!${getCellRef(2 + y, currentRow)}` });
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
                rowData.push({ formula: `ROUND(${prevRef} * (1 - ${churnRef}/100) + ${newRef}, 0)` });
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
                rowData.push({ formula: `ROUND(${prevRef} * (1 - ${churnRef}/100) + ${newRef}, 0)` });
              } else { rowData.push(val); }
            } else if (name.includes('%')) {
              rowData.push(val / 100);
            } else { rowData.push(val); }
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
        if (market === 'Aggregated') return { formula: `MAX('Portugal'!${getCellRef(2 + y, chargeSubRowIdx)}, 'UK'!${getCellRef(2 + y, chargeSubRowIdx)})` };
        return (market === 'Portugal' ? ptSub[y] : ukSub[y]) ? 1 : 0;
      })]); currentRow++;
      
      const chargeBookingRowIdx = currentRow;
      const ptBook = markets.Portugal.chargeBookingFees;
      const ukBook = markets.UK.chargeBookingFees;
      sheet.addRow(['Platform Setting', 'Charge Booking Fees', ...years.map(y => {
        if (market === 'Aggregated') return { formula: `MAX('Portugal'!${getCellRef(2 + y, chargeBookingRowIdx)}, 'UK'!${getCellRef(2 + y, chargeBookingRowIdx)})` };
        return (market === 'Portugal' ? ptBook[y] : ukBook[y]) ? 1 : 0;
      })]); currentRow++;

      sheet.addRow([]); currentRow++;

      const revenueRowsCount = revenueUnion.length + 3;
      const cogsRowsCount = cogsUnion.length + 3;
      const fixedRowsCount = fixedUnion.length + 3;
      const summaryRowsCount = 10;
      
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
        if (market === 'Aggregated') {
          years.forEach(y => rowData.push({ formula: `'Portugal'!${getCellRef(2 + y, currentRow)} + 'UK'!${getCellRef(2 + y, currentRow)}` }));
        } else if (name === 'Monthly Subscriptions') {
          years.forEach(y => rowData.push({ formula: `${getCellRef(2 + y, providersRow)}*${getCellRef(2 + y, subFeeRow)}*${getCellRef(2 + y, chargeSubRowIdx)}*12` }));
        } else if (name === 'Booking Fees') {
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
        if (market === 'Aggregated') {
          years.forEach(y => rowData.push({ formula: `'Portugal'!${getCellRef(2 + y, currentRow)} + 'UK'!${getCellRef(2 + y, currentRow)}` }));
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
          if (market === 'Aggregated') {
            rowData.push({ formula: `'Portugal'!${getCellRef(2 + y, currentRow)} + 'UK'!${getCellRef(2 + y, currentRow)}` });
          } else {
            rowData.push(getStreamValue(market as Market, 'Fixed Cost', name, y));
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
      sheet.addRow([
        'Summary',
        'Gross Revenues',
        ...years.map(y => ({ formula: `${getCellRef(2 + y, subVolRowIdx)}+${getCellRef(2 + y, bookVolRowIdx)}` })),
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
      sheet.getRow(currentRow).getCell(3).numFmt = '0.0%';
      sheet.getRow(currentRow).getCell(4).numFmt = '0.0%';
      sheet.getRow(currentRow).getCell(5).numFmt = '0.0%';
      sheet.getRow(currentRow).getCell(6).numFmt = '0.0%';
      sheet.getRow(currentRow).getCell(7).numFmt = '0.0%';
      sheet.getRow(currentRow).getCell(8).numFmt = '0.0%';
      currentRow++;

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

      if (market === 'Aggregated') {
        sheet.addRow(['Breakdown', 'Subscription Volume', ...years.map(y => ({ formula: `'Portugal'!${getCellRef(2 + y, currentRow)} + 'UK'!${getCellRef(2 + y, currentRow)}` }))]);
      } else {
        sheet.addRow(['Breakdown', 'Subscription Volume', ...years.map(y => ({ formula: `${getCellRef(2 + y, providersRow)}*${getCellRef(2 + y, subFeeRow)}*${getCellRef(2 + y, chargeSubRowIdx)}*12` }))]);
      }
      currentRow++;

      if (market === 'Aggregated') {
        sheet.addRow(['Breakdown', 'Booking Volume', ...years.map(y => ({ formula: `'Portugal'!${getCellRef(2 + y, currentRow)} + 'UK'!${getCellRef(2 + y, currentRow)}` }))]);
      } else {
        sheet.addRow(['Breakdown', 'Booking Volume', ...years.map(y => ({ formula: `${getCellRef(2 + y, ownersRow)}*${getCellRef(2 + y, bookingsPerOwnerRow)}*${getCellRef(2 + y, avgPriceRow)}` }))]);
      }
      currentRow++;

      if (market === 'Aggregated') {
        sheet.addRow(['Breakdown', 'Subscription Transactions', ...years.map(y => ({ formula: `'Portugal'!${getCellRef(2 + y, currentRow)} + 'UK'!${getCellRef(2 + y, currentRow)}` }))]);
      } else {
        sheet.addRow(['Breakdown', 'Subscription Transactions', ...years.map(y => ({ formula: `${getCellRef(2 + y, providersRow)}*12*${getCellRef(2 + y, chargeSubRowIdx)}` }))]);
      }
      currentRow++;

      if (market === 'Aggregated') {
        sheet.addRow(['Breakdown', 'Booking Transactions', ...years.map(y => ({ formula: `'Portugal'!${getCellRef(2 + y, currentRow)} + 'UK'!${getCellRef(2 + y, currentRow)}` }))]);
      } else {
        sheet.addRow(['Breakdown', 'Booking Transactions', ...years.map(y => ({ formula: `${getCellRef(2 + y, ownersRow)}*${getCellRef(2 + y, bookingsPerOwnerRow)}` }))]);
      }
      currentRow++;

      // Column widths
      sheet.getColumn(1).width = 25;
      sheet.getColumn(2).width = 35;
      for (let i = 3; i <= 8; i++) sheet.getColumn(i).width = 15;
    });

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
      '1. Click on any data sheet tab (e.g., "Portugal", "UK", or "Aggregated").',
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
    const isReadOnly = activeMarket === 'Aggregated';

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
          <div className={`grid ${showTotal ? 'grid-cols-6' : 'grid-cols-5'} gap-2 w-full sm:max-w-[550px]`}>
            {years.map(y => (
              <div key={y} className="text-center text-xs font-medium text-slate-500">Y{y+1}</div>
            ))}
            {showTotal && <div className="text-right text-xs font-medium text-slate-500">Total</div>}
          </div>
        </div>

        {streams.map((stream) => (
          <div key={`${title}-${stream.id}`} className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
            <div className="flex-1 flex items-center space-x-2">
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
                  className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
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
            
            <div className={`grid ${showTotal ? 'grid-cols-6' : 'grid-cols-5'} gap-2 w-full sm:max-w-[550px]`}>
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
          <div className="grid grid-cols-6 gap-2 w-full sm:max-w-[550px]">
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
      <div className="max-w-7xl mx-auto space-y-8">
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
              {(['Portugal', 'UK', 'Aggregated'] as Market[]).map((m) => (
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
        </div>

        <div className={activeTab === 'financials' ? 'block' : 'opacity-0 pointer-events-none absolute -z-10 w-full'}>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Inputs Section */}
            <div className="xl:col-span-7 space-y-6">
              {/* Summary Table */}
              <div ref={financialSummaryRef} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-lg font-medium flex items-center space-x-2">
                      <Calculator className="w-5 h-5 text-indigo-600" />
                      <span>Financial Summary ({activeMarket})</span>
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
                      <tr className="bg-indigo-50/30">
                        <td className="py-2 px-2 font-semibold text-indigo-700">Operating Profit</td>
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
                    </tbody>
                  </table>
                </div>
              </div>

              {renderStreamSection('Revenue Streams', derivedRevenueStreams, 'Revenue', totalRevenue, totalRevenueByYear, 'revenueStreams', 'currency', true, revenueStreamsRef, 'revenue-streams')}
              {renderStreamSection('COGS', derivedVariableCostsStreams, 'Cost', totalVariableCosts, totalVarCostsByYear, 'variableCostsStreams', 'currency', true, cogsRef, 'cogs-streams')}
              {renderStreamSection('Fixed Operating Costs', fixedCostsStreams, 'Fixed Cost', fixedCosts, totalFixedCostsByYear, 'fixedCostsStreams', 'currency', true, fixedCostsRef, 'fixed-costs-streams')}
            </div>

            {/* Outputs & Visualization Section */}
            <div className="xl:col-span-5 space-y-6">
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
                      tickFormatter={(value) => `€${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
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
                      tickFormatter={(value) => `€${value >= 1000000 ? (value / 1000000).toFixed(1) + 'M' : value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
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
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              <div className="xl:col-span-7 space-y-6">
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
                              disabled={activeMarket === 'Aggregated'}
                              className={`w-full py-1.5 text-xs font-medium rounded-md transition-colors ${
                                chargeSubscription[y] 
                                  ? 'bg-indigo-600 text-white shadow-sm' 
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                              } ${activeMarket === 'Aggregated' ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                              disabled={activeMarket === 'Aggregated'}
                              className={`w-full py-1.5 text-xs font-medium rounded-md transition-colors ${
                                chargeBookingFees[y] 
                                  ? 'bg-indigo-600 text-white shadow-sm' 
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                              } ${activeMarket === 'Aggregated' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {chargeBookingFees[y] ? 'Yes' : 'No'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="xl:col-span-5 space-y-6">
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
                      <LineChart data={platformChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="top" height={36}/>
                        <Line type="monotone" dataKey="Total Providers" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="New Providers" stroke="#7dd3fc" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
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
                      <LineChart data={platformChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="top" height={36}/>
                        <Line type="monotone" dataKey="Total Owners" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="New Owners" stroke="#6ee7b7" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
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
                        <LineChart data={platformChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                          <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(val) => `${val}%`} />
                          <Tooltip 
                            formatter={(val: any) => [`${val}%`, 'Churn']}
                            contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                          />
                          <Line type="monotone" dataKey="Provider Churn" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
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
                        <LineChart data={platformChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                          <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(val) => `${val}%`} />
                          <Tooltip 
                            formatter={(val: any) => [`${val}%`, 'Churn']}
                            contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                          />
                          <Line type="monotone" dataKey="Owner Churn" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
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
                      <td className="py-4 px-4 text-sm font-medium text-slate-700">Gross Margin (€)</td>
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
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold flex items-center space-x-2">
                  <Activity className="w-6 h-6 text-indigo-600" />
                  <span>Cash Flow Statement</span>
                </h2>
                <MarketFlags market={activeMarket} />
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
                      <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-600">€0</td>
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
                      <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-600">€0</td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-50 bg-indigo-50/20">
                    <td className="py-2 px-2 font-semibold text-indigo-800 pl-4">= Net Cash from Investing Activities</td>
                    {years.map(y => (
                      <td key={y} className="text-right py-2 px-2 font-bold font-mono whitespace-nowrap text-slate-600">€0</td>
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
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold flex items-center space-x-2">
                  <Calculator className="w-6 h-6 text-indigo-600" />
                  <span>Balance Sheet</span>
                </h2>
                <MarketFlags market={activeMarket} />
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
                      <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-600">€0</td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <td colSpan={6} className="py-2 px-2 font-semibold text-slate-700 pl-4 pt-4">Non-Current Assets</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 px-2 font-medium text-slate-600 pl-8">Intangible Assets (Software)</td>
                    {years.map(y => (
                      <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-600">€0</td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 px-2 font-medium text-slate-600 pl-8">Property, Plant & Equipment (PPE)</td>
                    {years.map(y => (
                      <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-600">€0</td>
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
                      <td key={y} className="text-right py-2 px-2 font-mono whitespace-nowrap text-slate-600">€0</td>
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
      </div>
    </div>
  );
}

