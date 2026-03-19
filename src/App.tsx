import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, TrendingUp, Activity, Plus, Trash2, Percent, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, Legend } from 'recharts';
import * as XLSX from 'xlsx';

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
  { id: 'pm-1', name: 'Number of providers in the platform', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'pm-2', name: 'Number of owners in the platform', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'pm-3', name: 'Avg price per booking', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'pm-4', name: '% of bookings commission', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'pm-5', name: 'Monthly Subscription fee', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'pm-6', name: '# of yearly bookings per pet owners', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'pm-cac-providers', name: 'Unit CAC - Providers', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'pm-cac-owners', name: 'Unit CAC - Owners', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'pm-cs-providers', name: 'Unit Customer Support cost - Providers', amounts: ['', '', '', '', ''], isPermanent: true },
  { id: 'pm-cs-owners', name: 'Unit Customer Support cost - Owners', amounts: ['', '', '', '', ''], isPermanent: true }
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
  const [activeTab, setActiveTab] = useState<'financials' | 'platform' | 'gross-margin'>('financials');
  const [activeMarket, setActiveMarket] = useState<Market>('Portugal');

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
      return JSON.parse(saved);
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

    const derivedRevenueStreams = revenueStreams.map(stream => {
      if (stream.id === 'rev-1' || stream.name === 'Monthly Subscriptions') {
        const providersStream = platformMetricsStreams.find(s => s.id === 'pm-1' || s.name === 'Number of providers in the platform');
        const subFeeStream = platformMetricsStreams.find(s => s.id === 'pm-5' || s.name === 'Monthly Subscription fee');
        
        const amounts = years.map(y => {
          const providers = Number(providersStream?.amounts[y]) || 0;
          const subFee = Number(subFeeStream?.amounts[y]) || 0;
          const charge = chargeSubscription[y] ? 1 : 0;
          const total = providers * subFee * charge * 12;
          return total;
        });
        return { ...stream, amounts, isCalculated: true };
      }
      if (stream.id === 'rev-2' || stream.name === 'Booking Fees') {
        const ownersStream = platformMetricsStreams.find(s => s.id === 'pm-2' || s.name === 'Number of owners in the platform');
        const bookingsPerOwnerStream = platformMetricsStreams.find(s => s.id === 'pm-6' || s.name === '# of yearly bookings per pet owners');
        const avgPriceStream = platformMetricsStreams.find(s => s.id === 'pm-3' || s.name === 'Avg price per booking');
        const commissionStream = platformMetricsStreams.find(s => s.id === 'pm-4' || s.name === '% of bookings commission');
        
        const amounts = years.map(y => {
          const owners = Number(ownersStream?.amounts[y]) || 0;
          const bookingsPerOwner = Number(bookingsPerOwnerStream?.amounts[y]) || 0;
          const avgPrice = Number(avgPriceStream?.amounts[y]) || 0;
          const commission = Number(commissionStream?.amounts[y]) || 0;
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
        const providersStream = platformMetricsStreams.find(s => s.id === 'pm-1' || s.name === 'Number of providers in the platform');
        const subFeeStream = platformMetricsStreams.find(s => s.id === 'pm-5' || s.name === 'Monthly Subscription fee');
        const ownersStream = platformMetricsStreams.find(s => s.id === 'pm-2' || s.name === 'Number of owners in the platform');
        const bookingsPerOwnerStream = platformMetricsStreams.find(s => s.id === 'pm-6' || s.name === '# of yearly bookings per pet owners');
        const avgPriceStream = platformMetricsStreams.find(s => s.id === 'pm-3' || s.name === 'Avg price per booking');
        
        const amounts = years.map(y => {
          const providers = Number(providersStream?.amounts[y]) || 0;
          const subFee = Number(subFeeStream?.amounts[y]) || 0;
          const chargeSub = chargeSubscription[y] ? 1 : 0;
          const subTransactions = providers * 12 * chargeSub;
          const subVolume = subTransactions * subFee;

          const owners = Number(ownersStream?.amounts[y]) || 0;
          const bookingsPerOwner = Number(bookingsPerOwnerStream?.amounts[y]) || 0;
          const avgPrice = Number(avgPriceStream?.amounts[y]) || 0;
          
          const bookingTransactions = owners * bookingsPerOwner;
          const bookingVolume = bookingTransactions * avgPrice;

          const totalTransactions = subTransactions + bookingTransactions;
          const totalVolume = subVolume + bookingVolume;

          const cost = (totalVolume * 0.029) + (totalTransactions * 0.30);
          return cost;
        });
        return { ...stream, amounts, isCalculated: true };
      }
      if (stream.id === 'vc-3' || stream.name === 'Customer acquisition costs') {
        const providersStream = platformMetricsStreams.find(s => s.id === 'pm-1' || s.name === 'Number of providers in the platform');
        const ownersStream = platformMetricsStreams.find(s => s.id === 'pm-2' || s.name === 'Number of owners in the platform');
        const unitCacProvidersStream = platformMetricsStreams.find(s => s.id === 'pm-cac-providers' || s.name === 'Unit CAC - Providers');
        const unitCacOwnersStream = platformMetricsStreams.find(s => s.id === 'pm-cac-owners' || s.name === 'Unit CAC - Owners');
        
        const amounts = years.map(y => {
          const currentProviders = Number(providersStream?.amounts[y]) || 0;
          const currentOwners = Number(ownersStream?.amounts[y]) || 0;
          const prevProviders = y > 0 ? (Number(providersStream?.amounts[y - 1]) || 0) : 0;
          const prevOwners = y > 0 ? (Number(ownersStream?.amounts[y - 1]) || 0) : 0;
          
          const newProviders = Math.max(0, currentProviders - prevProviders);
          const newOwners = Math.max(0, currentOwners - prevOwners);
          
          const unitCacProviders = Number(unitCacProvidersStream?.amounts[y]) || 0;
          const unitCacOwners = Number(unitCacOwnersStream?.amounts[y]) || 0;
          
          return (newProviders * unitCacProviders) + (newOwners * unitCacOwners);
        });
        return { ...stream, amounts, isCalculated: true };
      }
      if (stream.id === 'vc-2' || stream.name === 'Customer Support') {
        const providersStream = platformMetricsStreams.find(s => s.id === 'pm-1' || s.name === 'Number of providers in the platform');
        const ownersStream = platformMetricsStreams.find(s => s.id === 'pm-2' || s.name === 'Number of owners in the platform');
        const unitSupportProvidersStream = platformMetricsStreams.find(s => s.id === 'pm-cs-providers' || s.name === 'Unit Customer Support cost - Providers');
        const unitSupportOwnersStream = platformMetricsStreams.find(s => s.id === 'pm-cs-owners' || s.name === 'Unit Customer Support cost - Owners');
        
        const amounts = years.map(y => {
          const providers = Number(providersStream?.amounts[y]) || 0;
          const owners = Number(ownersStream?.amounts[y]) || 0;
          const unitCostProviders = Number(unitSupportProvidersStream?.amounts[y]) || 0;
          const unitCostOwners = Number(unitSupportOwnersStream?.amounts[y]) || 0;
          
          return (providers * unitCostProviders) + (owners * unitCostOwners);
        });
        return { ...stream, amounts, isCalculated: true };
      }
      return stream;
    });

    const totalRevenueByYear = years.map(y => derivedRevenueStreams.reduce((sum, stream) => sum + (Number(stream.amounts[y]) || 0), 0));
    const totalVarCostsByYear = years.map(y => derivedVariableCostsStreams.reduce((sum, stream) => sum + (Number(stream.amounts[y]) || 0), 0));
    const totalFixedCostsByYear = years.map(y => fixedCostsStreams.reduce((sum, stream) => sum + (Number(stream.amounts[y]) || 0), 0));
    const totalPlatformMetricsByYear = years.map(y => platformMetricsStreams.reduce((sum, stream) => sum + (Number(stream.amounts[y]) || 0), 0));

    const grossMarginByYear = years.map(y => totalRevenueByYear[y] - totalVarCostsByYear[y]);
    const grossMarginPercentByYear = years.map(y => totalRevenueByYear[y] > 0 ? (grossMarginByYear[y] / totalRevenueByYear[y]) * 100 : 0);
    const opProfitByYear = years.map(y => grossMarginByYear[y] - totalFixedCostsByYear[y]);
    const opProfitPercentByYear = years.map(y => totalRevenueByYear[y] > 0 ? (opProfitByYear[y] / totalRevenueByYear[y]) * 100 : 0);

    const totalRevenue = totalRevenueByYear.reduce((a, b) => a + b, 0);
    const totalVariableCosts = totalVarCostsByYear.reduce((a, b) => a + b, 0);
    const fixedCosts = totalFixedCostsByYear.reduce((a, b) => a + b, 0);
    const totalPlatformMetrics = totalPlatformMetricsByYear.reduce((a, b) => a + b, 0);
    const grossMargin = grossMarginByYear.reduce((a, b) => a + b, 0);
    const operatingProfit = opProfitByYear.reduce((a, b) => a + b, 0);
    const calculatedMarginPercent = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;
    const calculatedOpProfitPercent = totalRevenue > 0 ? (operatingProfit / totalRevenue) * 100 : 0;

    return {
      derivedRevenueStreams,
      derivedVariableCostsStreams,
      totalRevenueByYear,
      totalVarCostsByYear,
      totalFixedCostsByYear,
      totalPlatformMetricsByYear,
      grossMarginByYear,
      grossMarginPercentByYear,
      opProfitByYear,
      opProfitPercentByYear,
      totalRevenue,
      totalVariableCosts,
      fixedCosts,
      totalPlatformMetrics,
      grossMargin,
      operatingProfit,
      calculatedMarginPercent,
      calculatedOpProfitPercent
    };
  };

  const currentMarketData = React.useMemo(() => {
    if (activeMarket === 'Aggregated') {
      const pt = markets.Portugal;
      const uk = markets.UK;

      const aggregateStreams = (s1: FinancialStream[], s2: FinancialStream[]) => {
        const allNames = Array.from(new Set([...s1.map(s => s.name), ...s2.map(s => s.name)]));
        return allNames.map(name => {
          const st1 = s1.find(s => s.name === name);
          const st2 = s2.find(s => s.name === name);
          const amounts = years.map(y => (Number(st1?.amounts[y]) || 0) + (Number(st2?.amounts[y]) || 0));
          return {
            id: `agg-${name}`,
            name,
            amounts,
            isPermanent: st1?.isPermanent || st2?.isPermanent,
            isCalculated: true
          };
        });
      };

      return {
        platformMetricsStreams: aggregateStreams(pt.platformMetricsStreams, uk.platformMetricsStreams),
        revenueStreams: aggregateStreams(pt.revenueStreams, uk.revenueStreams),
        variableCostsStreams: aggregateStreams(pt.variableCostsStreams, uk.variableCostsStreams),
        fixedCostsStreams: aggregateStreams(pt.fixedCostsStreams, uk.fixedCostsStreams),
        chargeSubscription: pt.chargeSubscription.map((v, i) => v || uk.chargeSubscription[i]),
        chargeBookingFees: pt.chargeBookingFees.map((v, i) => v || uk.chargeBookingFees[i]),
      };
    }
    return markets[activeMarket];
  }, [activeMarket, markets]);

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
    totalVarCostsByYear,
    totalFixedCostsByYear,
    totalPlatformMetricsByYear,
    grossMarginByYear,
    grossMarginPercentByYear,
    opProfitByYear,
    opProfitPercentByYear,
    totalRevenue,
    totalVariableCosts,
    fixedCosts,
    totalPlatformMetrics,
    grossMargin,
    operatingProfit,
    calculatedMarginPercent,
    calculatedOpProfitPercent
  } = React.useMemo(() => ({
    ...currentMarketData,
    ...calculateFinancials(currentMarketData)
  }), [currentMarketData]);

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
    'Total Revenue': totalRevenueByYear[y],
    'Total Var. Costs': totalVarCostsByYear[y],
    'Gross Margin': grossMarginByYear[y],
    'Total Fixed Costs': totalFixedCostsByYear[y],
    'Op. Profit': opProfitByYear[y]
  })), {
    name: 'Total',
    'Total Revenue': totalRevenue,
    'Total Var. Costs': totalVariableCosts,
    'Gross Margin': grossMargin,
    'Total Fixed Costs': fixedCosts,
    'Op. Profit': operatingProfit
  }];

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
    
    // Variable Costs
    derivedVariableCostsStreams.forEach(stream => {
      rows.push(['Variable Cost', stream.name, ...stream.amounts.map(a => String(a || 0)), String(getStreamTotal(stream))]);
    });
    rows.push(['Variable Cost Total', '', ...totalVarCostsByYear.map(String), String(totalVariableCosts)]);
    
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

  const exportToXLSX = () => {
    const wb = XLSX.utils.book_new();

    const marketsToExport: Market[] = ['Portugal', 'UK', 'Aggregated'];

    marketsToExport.forEach(market => {
      let data: MarketData;
      if (market === 'Aggregated') {
        const pt = markets.Portugal;
        const uk = markets.UK;
        const aggregateStreams = (s1: FinancialStream[], s2: FinancialStream[]) => {
          const allNames = Array.from(new Set([...s1.map(s => s.name), ...s2.map(s => s.name)]));
          return allNames.map(name => {
            const st1 = s1.find(s => s.name === name);
            const st2 = s2.find(s => s.name === name);
            const amounts = years.map(y => (Number(st1?.amounts[y]) || 0) + (Number(st2?.amounts[y]) || 0));
            return {
              id: `agg-${name}`,
              name,
              amounts,
              isPermanent: st1?.isPermanent || st2?.isPermanent,
              isCalculated: true
            };
          });
        };
        data = {
          platformMetricsStreams: aggregateStreams(pt.platformMetricsStreams, uk.platformMetricsStreams),
          revenueStreams: aggregateStreams(pt.revenueStreams, uk.revenueStreams),
          variableCostsStreams: aggregateStreams(pt.variableCostsStreams, uk.variableCostsStreams),
          fixedCostsStreams: aggregateStreams(pt.fixedCostsStreams, uk.fixedCostsStreams),
          chargeSubscription: pt.chargeSubscription.map((v, i) => v || uk.chargeSubscription[i]),
          chargeBookingFees: pt.chargeBookingFees.map((v, i) => v || uk.chargeBookingFees[i]),
        };
      } else {
        data = markets[market];
      }

      const financials = calculateFinancials(data);
      const rows: any[][] = [];

      // Header
      rows.push([`Market: ${market}`]);
      rows.push([]);
      rows.push(['Category', 'Stream Name', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Total']);

      // Revenue Streams
      financials.derivedRevenueStreams.forEach(stream => {
        rows.push(['Revenue', stream.name, ...stream.amounts.map(a => Number(a) || 0), getStreamTotal(stream)]);
      });
      rows.push(['Revenue Total', '', ...financials.totalRevenueByYear, financials.totalRevenue]);

      // Variable Costs
      financials.derivedVariableCostsStreams.forEach(stream => {
        rows.push(['Variable Cost', stream.name, ...stream.amounts.map(a => Number(a) || 0), getStreamTotal(stream)]);
      });
      rows.push(['Variable Cost Total', '', ...financials.totalVarCostsByYear, financials.totalVariableCosts]);

      // Fixed Costs
      data.fixedCostsStreams.forEach(stream => {
        rows.push(['Fixed Cost', stream.name, ...stream.amounts.map(a => Number(a) || 0), getStreamTotal(stream)]);
      });
      rows.push(['Fixed Cost Total', '', ...financials.totalFixedCostsByYear, financials.fixedCosts]);

      // Summary
      rows.push([]);
      rows.push(['Summary', 'Metric', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Total']);
      rows.push(['Summary', 'Revenues', ...financials.totalRevenueByYear, financials.totalRevenue]);
      rows.push(['Summary', 'Variable Costs', ...financials.totalVarCostsByYear, financials.totalVariableCosts]);
      rows.push(['Summary', 'Gross Margin', ...financials.grossMarginByYear, financials.grossMargin]);
      rows.push(['Summary', 'Gross Margin %', ...financials.grossMarginPercentByYear.map(v => `${v.toFixed(1)}%`), `${financials.calculatedMarginPercent.toFixed(1)}%`]);
      rows.push(['Summary', 'Fixed Costs', ...financials.totalFixedCostsByYear, financials.fixedCosts]);
      rows.push(['Summary', 'Operating Profit', ...financials.opProfitByYear, financials.operatingProfit]);
      rows.push(['Summary', 'Operating Profit %', ...financials.opProfitPercentByYear.map(v => `${v.toFixed(1)}%`), `${financials.calculatedOpProfitPercent.toFixed(1)}%`]);

      // Platform Metrics
      rows.push([]);
      rows.push(['Platform Metrics', 'Stream Name', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Total']);
      data.platformMetricsStreams.forEach(stream => {
        rows.push(['Platform Metric', stream.name, ...stream.amounts.map(a => Number(a) || 0), getStreamTotal(stream)]);
      });
      rows.push(['Platform Metric Total', '', ...financials.totalPlatformMetricsByYear, financials.totalPlatformMetrics]);

      // Platform Settings
      rows.push([]);
      rows.push(['Platform Settings', 'Setting', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']);
      rows.push(['Platform Setting', 'Charge Subscription', ...data.chargeSubscription.map(v => v ? 'Yes' : 'No')]);
      rows.push(['Platform Setting', 'Charge Booking Fees', ...data.chargeBookingFees.map(v => v ? 'Yes' : 'No')]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, market);
    });

    XLSX.writeFile(wb, "financial_viability_tracker.xlsx");
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
        fill="#1e293b" 
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
    formatType: 'currency' | 'number' = 'currency'
  ) => {
    const formatValue = (val: number) => formatType === 'currency' ? formatCurrency(val) : new Intl.NumberFormat('en-US').format(val);
    const isReadOnly = activeMarket === 'Aggregated';
    
    return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium flex items-center space-x-2">
          <Activity className="w-5 h-5 text-slate-400" />
          <span>{title}</span>
        </h2>
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
        {/* Header Row for Years */}
        <div className="flex items-center space-x-3 px-1">
          <div className="flex-1"></div>
          <div className="grid grid-cols-6 gap-2 w-full max-w-[400px]">
            {years.map(y => (
              <div key={y} className="text-center text-xs font-medium text-slate-500">Y{y+1}</div>
            ))}
            <div className="text-right text-xs font-medium text-slate-500">Total</div>
          </div>
        </div>

        {streams.map((stream) => (
          <div key={`${title}-${stream.id}`} className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
            <div className="flex-1 flex items-center space-x-2">
              {stream.isPermanent || isReadOnly ? (
                <div className="block w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 truncate">
                  {stream.name}
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
            
            <div className="grid grid-cols-6 gap-2 w-full sm:max-w-[400px]">
              {years.map(y => (
                <div key={y} className="relative">
                  <input
                    type="number"
                    value={stream.amounts[y]}
                    onChange={(e) => updateStreamAmount(streams, stream.id, y, e.target.value ? Number(e.target.value) : '', stateKey)}
                    className={`block w-full px-1 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-xs text-center transition-colors ${(stream.isCalculated || isReadOnly) ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                    placeholder="0"
                    disabled={stream.isCalculated || isReadOnly}
                  />
                </div>
              ))}
              <div className="flex items-center justify-end text-sm font-semibold text-slate-700 truncate">
                {formatValue(getStreamTotal(stream))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
        <div className="flex-1 text-sm font-medium text-slate-500">Total {title}</div>
        <div className="grid grid-cols-6 gap-2 w-full sm:max-w-[400px]">
          {years.map(y => (
            <div key={y} className="text-center text-xs font-semibold text-slate-700 truncate">
              {formatValue(totalsByYear[y])}
            </div>
          ))}
          <div className="flex items-center justify-end text-sm font-bold text-slate-900 truncate">
            {formatValue(total)}
          </div>
        </div>
      </div>
    </div>
  )};

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
        </div>

        {activeTab === 'financials' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Inputs Section */}
            <div className="xl:col-span-7 space-y-6">
              {/* Summary Table */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <h2 className="text-lg font-medium mb-4 flex items-center space-x-2">
                  <Calculator className="w-5 h-5 text-indigo-600" />
                  <span>Financial Summary ({activeMarket})</span>
                </h2>
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
                      <tr className="border-b border-slate-50">
                        <td className="py-2 px-2 font-medium text-slate-700">Revenues</td>
                        {years.map(y => (
                          <td key={y} className="text-right py-2 px-2 text-slate-600 font-mono">{formatCurrency(totalRevenueByYear[y])}</td>
                        ))}
                        <td className="text-right py-2 px-2 font-bold text-slate-900 bg-slate-50/50 font-mono">{formatCurrency(totalRevenue)}</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 px-2 font-medium text-slate-700">Variable Costs</td>
                        {years.map(y => (
                          <td key={y} className="text-right py-2 px-2 text-slate-600 font-mono">{formatCurrency(totalVarCostsByYear[y])}</td>
                        ))}
                        <td className="text-right py-2 px-2 font-bold text-slate-900 bg-slate-50/50 font-mono">{formatCurrency(totalVariableCosts)}</td>
                      </tr>
                      <tr className="border-b border-slate-50 bg-emerald-50/30">
                        <td className="py-2 px-2 font-semibold text-emerald-700">Gross Margin</td>
                        {years.map(y => (
                          <td key={y} className="text-right py-2 px-2 text-emerald-600 font-bold font-mono">{formatCurrency(grossMarginByYear[y])}</td>
                        ))}
                        <td className="text-right py-2 px-2 font-bold text-emerald-800 bg-emerald-50/50 font-mono">{formatCurrency(grossMargin)}</td>
                      </tr>
                      <tr className="border-b border-slate-50 bg-emerald-50/10">
                        <td className="py-2 px-2 text-xs font-medium text-emerald-600 italic pl-4">Gross Margin %</td>
                        {years.map(y => (
                          <td key={y} className="text-right py-2 px-2 text-emerald-500 font-mono text-xs">{grossMarginPercentByYear[y].toFixed(1)}%</td>
                        ))}
                        <td className="text-right py-2 px-2 font-bold text-emerald-700 bg-emerald-50/20 font-mono text-xs">{calculatedMarginPercent.toFixed(1)}%</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 px-2 font-medium text-slate-700">Fixed Costs</td>
                        {years.map(y => (
                          <td key={y} className="text-right py-2 px-2 text-slate-600 font-mono">{formatCurrency(totalFixedCostsByYear[y])}</td>
                        ))}
                        <td className="text-right py-2 px-2 font-bold text-slate-900 bg-slate-50/50 font-mono">{formatCurrency(fixedCosts)}</td>
                      </tr>
                      <tr className="bg-indigo-50/30">
                        <td className="py-2 px-2 font-semibold text-indigo-700">Operating Profit</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-2 px-2 font-bold font-mono ${opProfitByYear[y] >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                            {formatCurrency(opProfitByYear[y])}
                          </td>
                        ))}
                        <td className={`text-right py-2 px-2 font-bold bg-indigo-50/50 font-mono ${operatingProfit >= 0 ? 'text-indigo-800' : 'text-red-800'}`}>
                          {formatCurrency(operatingProfit)}
                        </td>
                      </tr>
                      <tr className="bg-indigo-50/10">
                        <td className="py-2 px-2 text-xs font-medium text-indigo-600 italic pl-4">Operating Profit %</td>
                        {years.map(y => (
                          <td key={y} className={`text-right py-2 px-2 font-mono text-xs ${opProfitPercentByYear[y] >= 0 ? 'text-indigo-500' : 'text-red-500'}`}>
                            {opProfitPercentByYear[y].toFixed(1)}%
                          </td>
                        ))}
                        <td className={`text-right py-2 px-2 font-bold bg-indigo-50/20 font-mono text-xs ${calculatedOpProfitPercent >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>
                          {calculatedOpProfitPercent.toFixed(1)}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {renderStreamSection('Revenue Streams', derivedRevenueStreams, 'Revenue', totalRevenue, totalRevenueByYear, 'revenueStreams')}
              {renderStreamSection('Variable Costs', derivedVariableCostsStreams, 'Cost', totalVariableCosts, totalVarCostsByYear, 'variableCostsStreams')}
              {renderStreamSection('Fixed Operating Costs', fixedCostsStreams, 'Fixed Cost', fixedCosts, totalFixedCostsByYear, 'fixedCostsStreams')}
            </div>

            {/* Outputs & Visualization Section */}
            <div className="xl:col-span-5 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Gross Margin Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">5-Year Gross Margin ({calculatedMarginPercent.toFixed(1)}%)</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900">
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
                        <div className="text-xs font-medium text-slate-700 mt-1">{formatCurrency(grossMarginByYear[y])}</div>
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
                      <div className={`text-[10px] uppercase font-semibold ${operatingProfit >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>Y{y+1}</div>
                      <div className={`text-xs font-medium mt-1 ${operatingProfit >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>{formatCurrency(opProfitByYear[y])}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-medium mb-6">5-Year Financial Overview</h2>
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
                    />
                    <Bar dataKey="Total Revenue" fill="#3b82f6">
                      <LabelList dataKey="Total Revenue" content={renderCustomBarLabel} />
                    </Bar>
                    <Bar dataKey="Total Var. Costs" fill="#f59e0b">
                      <LabelList dataKey="Total Var. Costs" content={renderCustomBarLabel} />
                    </Bar>
                    <Bar dataKey="Gross Margin" fill="#8b5cf6">
                      <LabelList dataKey="Gross Margin" content={renderCustomBarLabel} />
                    </Bar>
                    <Bar dataKey="Total Fixed Costs" fill="#f97316">
                      <LabelList dataKey="Total Fixed Costs" content={renderCustomBarLabel} />
                    </Bar>
                    <Bar dataKey="Op. Profit" fill={operatingProfit >= 0 ? '#10b981' : '#ef4444'}>
                      <LabelList dataKey="Op. Profit" content={renderCustomBarLabel} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        )}

        {activeTab === 'platform' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-7 space-y-6">
              {renderStreamSection('Platform Metrics', platformMetricsStreams, 'Metric', totalPlatformMetrics, totalPlatformMetricsByYear, 'platformMetricsStreams', 'number')}
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <h2 className="text-lg font-medium flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-slate-400" />
                  <span>Platform Settings</span>
                </h2>
                
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
          </div>
        )}

        {activeTab === 'gross-margin' && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <h2 className="text-xl font-semibold mb-6 flex items-center space-x-2">
                <Percent className="w-6 h-6 text-indigo-600" />
                <span>5-Year Gross Margin Analysis</span>
              </h2>
              
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

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-medium mb-6">Gross Margin % Trend</h2>
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
        )}
      </div>
    </div>
  );
}

