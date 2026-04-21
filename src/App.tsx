import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, TrendingUp, Activity, Plus, Trash2, Percent, Download } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, Legend } from 'recharts';
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

          const cost = (totalVolume * 0.029) + (totalTransactions * 0.30);
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
    const totalVarCostsByYear = years.map(y => derivedVariableCostsStreams.reduce((sum, stream) => sum + (Number(stream.amounts[y]) || 0), 0));
    const totalFixedCostsByYear = years.map(y => fixedCostsStreams.reduce((sum, stream) => sum + (Number(stream.amounts[y]) || 0), 0));
    const totalPlatformMetricsByYear = years.map(y => derivedPlatformMetricsStreams.reduce((sum, stream) => sum + (Number(stream.amounts[y]) || 0), 0));

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
      platformMetricsStreams: derivedPlatformMetricsStreams,
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
      const totalVarCostsByYear = years.map(y => ptFin.totalVarCostsByYear[y] + ukFin.totalVarCostsByYear[y]);
      const totalFixedCostsByYear = years.map(y => ptFin.totalFixedCostsByYear[y] + ukFin.totalFixedCostsByYear[y]);
      const totalPlatformMetricsByYear = years.map(y => ptFin.totalPlatformMetricsByYear[y] + ukFin.totalPlatformMetricsByYear[y]);
      const grossMarginByYear = years.map(y => ptFin.grossMarginByYear[y] + ukFin.grossMarginByYear[y]);
      const opProfitByYear = years.map(y => ptFin.opProfitByYear[y] + ukFin.opProfitByYear[y]);

      const totalRevenue = ptFin.totalRevenue + ukFin.totalRevenue;
      const totalVariableCosts = ptFin.totalVariableCosts + ukFin.totalVariableCosts;
      const fixedCosts = ptFin.fixedCosts + ukFin.fixedCosts;
      const totalPlatformMetrics = ptFin.totalPlatformMetrics + ukFin.totalPlatformMetrics;
      const grossMargin = ptFin.grossMargin + ukFin.grossMargin;
      const operatingProfit = ptFin.operatingProfit + ukFin.operatingProfit;

      const calculatedMarginPercent = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;
      const calculatedOpProfitPercent = totalRevenue > 0 ? (operatingProfit / totalRevenue) * 100 : 0;
      const grossMarginPercentByYear = years.map(y => totalRevenueByYear[y] > 0 ? (grossMarginByYear[y] / totalRevenueByYear[y]) * 100 : 0);
      const opProfitPercentByYear = years.map(y => totalRevenueByYear[y] > 0 ? (opProfitByYear[y] / totalRevenueByYear[y]) * 100 : 0);

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
    'Revenues': totalRevenueByYear[y],
    'COGS': totalVarCostsByYear[y],
    'Gross Margin': grossMarginByYear[y],
    'Fixed Costs': totalFixedCostsByYear[y],
    'Op. Profit': opProfitByYear[y]
  })), {
    name: 'Total',
    'Revenues': totalRevenue,
    'COGS': totalVariableCosts,
    'Gross Margin': grossMargin,
    'Fixed Costs': fixedCosts,
    'Op. Profit': operatingProfit
  }];

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

  const exportToXLSX = () => {
    const wb = XLSX.utils.book_new();
    const marketsToExport: Market[] = ['Portugal', 'UK', 'Aggregated'];

    const getColLetter = (col: number) => String.fromCharCode(65 + col);
    const getCellRef = (col: number, row: number) => `${getColLetter(col)}${row + 1}`;

    // Get union of all streams to ensure consistent row structure across sheets
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
      const rows: any[][] = [];
      let currentRow = 0;

      // Header
      rows.push([`Market: ${market}`]); currentRow++;
      rows.push([]); currentRow++;
      rows.push(['Category', 'Stream Name', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Total']); currentRow++;
      const headerRow = currentRow - 1;

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
      let tempRow = currentRow;
      platformUnion.forEach(name => {
        metricRowMap[name] = tempRow;
        tempRow++;
      });

      platformUnion.forEach(name => {
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
              'Owner churn rate (%)'
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
                } else {
                  wPt = "0";
                  wUk = "0";
                }
              } else if (name === 'Avg price per booking') {
                const oRow = metricRowMap['Number of owners in the platform'];
                const bRow = metricRowMap['# of yearly bookings per pet owners'];
                if (oRow !== undefined && bRow !== undefined) {
                  wPt = `'Portugal'!${col}${oRow+1}*'Portugal'!${col}${bRow+1}`;
                  wUk = `'UK'!${col}${oRow+1}*'UK'!${col}${bRow+1}`;
                } else {
                  wPt = "0";
                  wUk = "0";
                }
              } else if (name === 'Monthly Subscription fee' || name === 'Unit Customer Support cost - Providers') {
                const wRow = metricRowMap['Number of providers in the platform'];
                if (wRow !== undefined) {
                  wPt = `'Portugal'!${col}${wRow+1}`;
                  wUk = `'UK'!${col}${wRow+1}`;
                } else {
                  wPt = "0";
                  wUk = "0";
                }
              } else if (name === '# of yearly bookings per pet owners' || name === 'Unit Customer Support cost - Owners') {
                const wRow = metricRowMap['Number of owners in the platform'];
                if (wRow !== undefined) {
                  wPt = `'Portugal'!${col}${wRow+1}`;
                  wUk = `'UK'!${col}${wRow+1}`;
                } else {
                  wPt = "0";
                  wUk = "0";
                }
              } else if (name === 'Unit CAC - Providers') {
                const wRow = metricRowMap['New providers added'];
                if (wRow !== undefined) {
                  wPt = `'Portugal'!${col}${wRow+1}`;
                  wUk = `'UK'!${col}${wRow+1}`;
                } else {
                  wPt = "0";
                  wUk = "0";
                }
              } else if (name === 'Unit CAC - Owners') {
                const wRow = metricRowMap['New owners added'];
                if (wRow !== undefined) {
                  wPt = `'Portugal'!${col}${wRow+1}`;
                  wUk = `'UK'!${col}${wRow+1}`;
                } else {
                  wPt = "0";
                  wUk = "0";
                }
              } else if (name === 'Provider churn rate (%)') {
                const wRow = metricRowMap['Number of providers in the platform'];
                if (wRow !== undefined) {
                  const prevCol = y > 0 ? getColLetter(1 + y) : col;
                  wPt = `'Portugal'!${prevCol}${wRow+1}`;
                  wUk = `'UK'!${prevCol}${wRow+1}`;
                } else {
                  wPt = "0";
                  wUk = "0";
                }
              } else if (name === 'Owner churn rate (%)') {
                const wRow = metricRowMap['Number of owners in the platform'];
                if (wRow !== undefined) {
                  const prevCol = y > 0 ? getColLetter(1 + y) : col;
                  wPt = `'Portugal'!${prevCol}${wRow+1}`;
                  wUk = `'UK'!${prevCol}${wRow+1}`;
                } else {
                  wPt = "0";
                  wUk = "0";
                }
              }

              rowData.push({ f: `IF((${wPt}+${wUk})>0, (${vPt}*${wPt} + ${vUk}*${wUk})/(${wPt}+${wUk}), 0)` });
            } else {
              rowData.push({ f: `'Portugal'!${getCellRef(2 + y, currentRow)} + 'UK'!${getCellRef(2 + y, currentRow)}` });
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
                rowData.push({ f: `ROUND(${prevRef} * (1 - ${churnRef}/100) + ${newRef}, 0)` });
              } else {
                rowData.push(val);
              }
            } else if (name === 'Number of owners in the platform') {
              const newRow = metricRowMap['New owners added'];
              const churnRow = metricRowMap['Owner churn rate (%)'];
              const col = getColLetter(2 + y);
              const prevCol = y > 0 ? getColLetter(1 + y) : null;
              if (newRow !== undefined && churnRow !== undefined) {
                const newRef = `${col}${newRow+1}`;
                const churnRef = `${col}${churnRow+1}`;
                const prevRef = prevCol ? `${prevCol}${currentRow+1}` : "0";
                rowData.push({ f: `ROUND(${prevRef} * (1 - ${churnRef}/100) + ${newRef}, 0)` });
              } else {
                rowData.push(val);
              }
            } else if (name.includes('%')) {
              rowData.push(val / 100);
            } else {
              rowData.push(val);
            }
          }
        });
        // No total for platform metrics
        rows.push(rowData);
        currentRow++;
      });

      const providersRow = metricRowMap['Number of providers in the platform'];
      const subFeeRow = metricRowMap['Monthly Subscription fee'];
      const ownersRow = metricRowMap['Number of owners in the platform'];
      const bookingsPerOwnerRow = metricRowMap['# of yearly bookings per pet owners'];
      const avgPriceRow = metricRowMap['Avg price per booking'];

      // No total row for platform metrics
      rows.push([]); currentRow++;

      // Platform Settings
      rows.push(['Platform Settings', 'Setting', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']); currentRow++;
      const chargeSubRow = currentRow;
      const ptSub = markets.Portugal.chargeSubscription;
      const ukSub = markets.UK.chargeSubscription;
      rows.push(['Platform Setting', 'Charge Subscription', ...years.map(y => {
        if (market === 'Aggregated') return { f: `MAX('Portugal'!${getCellRef(2 + y, currentRow)}, 'UK'!${getCellRef(2 + y, currentRow)})` };
        return (market === 'Portugal' ? ptSub[y] : ukSub[y]) ? 1 : 0;
      })]); currentRow++;
      
      const chargeBookingRow = currentRow;
      const ptBook = markets.Portugal.chargeBookingFees;
      const ukBook = markets.UK.chargeBookingFees;
      rows.push(['Platform Setting', 'Charge Booking Fees', ...years.map(y => {
        if (market === 'Aggregated') return { f: `MAX('Portugal'!${getCellRef(2 + y, currentRow)}, 'UK'!${getCellRef(2 + y, currentRow)})` };
        return (market === 'Portugal' ? ptBook[y] : ukBook[y]) ? 1 : 0;
      })]); currentRow++;

      rows.push([]); currentRow++;

      // Calculate row indices for Payment Processing Breakdown (which will be at the end)
      const revenueRowsCount = revenueUnion.length + 3;
      const cogsRowsCount = cogsUnion.length + 3;
      const fixedRowsCount = fixedUnion.length + 3;
      const summaryRowsCount = 9; // 8 summary rows + 1 empty row
      
      const breakdownStartRow = currentRow + revenueRowsCount + cogsRowsCount + fixedRowsCount + summaryRowsCount;
      const feePctRow = breakdownStartRow + 1;
      const feeFixedRow = breakdownStartRow + 2;
      const subVolRow = breakdownStartRow + 3;
      const bookVolRow = breakdownStartRow + 4;
      const subTransRow = breakdownStartRow + 5;
      const bookTransRow = breakdownStartRow + 6;

      // Revenue Streams
      rows.push(['Category', 'Stream Name', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Total']); currentRow++;
      const revenueStartRow = currentRow;
      revenueUnion.forEach(name => {
        const rowData: any[] = ['Revenue', name];
        if (market === 'Aggregated') {
          years.forEach(y => rowData.push({ f: `'Portugal'!${getCellRef(2 + y, currentRow)} + 'UK'!${getCellRef(2 + y, currentRow)}` }));
        } else if (name === 'Monthly Subscriptions') {
          years.forEach(y => rowData.push({ f: `${getCellRef(2 + y, providersRow)}*${getCellRef(2 + y, subFeeRow)}*${getCellRef(2 + y, chargeSubRow)}*12` }));
        } else if (name === 'Booking Fees') {
          const commissionRow = metricRowMap['% of bookings commission'];
          years.forEach(y => rowData.push({ f: `${getCellRef(2 + y, ownersRow)}*${getCellRef(2 + y, bookingsPerOwnerRow)}*${getCellRef(2 + y, avgPriceRow)}*${getCellRef(2 + y, commissionRow)}*${getCellRef(2 + y, chargeBookingRow)}` }));
        } else {
          years.forEach(y => rowData.push(getStreamValue(market as Market, 'Revenue', name, y)));
        }
        rowData.push({ f: `SUM(C${currentRow + 1}:G${currentRow + 1})` });
        rows.push(rowData);
        currentRow++;
      });
      const revenueEndRow = currentRow - 1;
      const revenueTotalRow = currentRow;
      rows.push([
        'Revenue Total', 
        '', 
        ...years.map(y => ({ f: `SUM(${getCellRef(2 + y, revenueStartRow)}:${getCellRef(2 + y, revenueEndRow)})` })),
        { f: `SUM(C${currentRow + 1}:G${currentRow + 1})` }
      ]);
      currentRow++;

      rows.push([]); currentRow++;

      // COGS
      rows.push(['Category', 'Stream Name', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Total']); currentRow++;
      const cogsStartRow = currentRow;
      cogsUnion.forEach(name => {
        const rowData: any[] = ['COGS', name];
        if (market === 'Aggregated') {
          years.forEach(y => rowData.push({ f: `'Portugal'!${getCellRef(2 + y, currentRow)} + 'UK'!${getCellRef(2 + y, currentRow)}` }));
        } else if (name === 'Payment Processing') {
          years.forEach(y => {
            const col = 2 + y;
            const vol = `(${getCellRef(col, subVolRow)}+${getCellRef(col, bookVolRow)})`;
            const trans = `(${getCellRef(col, subTransRow)}+${getCellRef(col, bookTransRow)})`;
            rowData.push({ f: `(${vol}*${getCellRef(col, feePctRow)}) + (${trans}*${getCellRef(col, feeFixedRow)})` });
          });
        } else if (name === 'Customer acquisition costs') {
          const unitCacProvidersRow = metricRowMap['Unit CAC - Providers'];
          const unitCacOwnersRow = metricRowMap['Unit CAC - Owners'];
          years.forEach(y => {
            const col = 2 + y;
            const p = getCellRef(col, providersRow);
            const o = getCellRef(col, ownersRow);
            const ucp = getCellRef(col, unitCacProvidersRow);
            const uco = getCellRef(col, unitCacOwnersRow);
            const prevP = y > 0 ? getCellRef(col - 1, providersRow) : "0";
            const prevO = y > 0 ? getCellRef(col - 1, ownersRow) : "0";
            const newP = `MAX(0, ${p}-${prevP})`;
            const newO = `MAX(0, ${o}-${prevO})`;
            rowData.push({ f: `(${newP}*${ucp}) + (${newO}*${uco})` });
          });
        } else if (name === 'Customer Support') {
          const unitCsProvidersRow = metricRowMap['Unit Customer Support cost - Providers'];
          const unitCsOwnersRow = metricRowMap['Unit Customer Support cost - Owners'];
          years.forEach(y => {
            const col = 2 + y;
            const p = getCellRef(col, providersRow);
            const o = getCellRef(col, ownersRow);
            const ucp = getCellRef(col, unitCsProvidersRow);
            const uco = getCellRef(col, unitCsOwnersRow);
            rowData.push({ f: `(${p}*${ucp}) + (${o}*${uco})` });
          });
        } else {
          years.forEach(y => rowData.push(getStreamValue(market as Market, 'COGS', name, y)));
        }
        rowData.push({ f: `SUM(C${currentRow + 1}:G${currentRow + 1})` });
        rows.push(rowData);
        currentRow++;
      });
      const cogsEndRow = currentRow - 1;
      const cogsTotalRow = currentRow;
      rows.push([
        'COGS Total', 
        '', 
        ...years.map(y => ({ f: `SUM(${getCellRef(2 + y, cogsStartRow)}:${getCellRef(2 + y, cogsEndRow)})` })),
        { f: `SUM(C${currentRow + 1}:G${currentRow + 1})` }
      ]);
      currentRow++;

      rows.push([]); currentRow++;

      // Fixed Costs
      rows.push(['Category', 'Stream Name', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Total']); currentRow++;
      const fixedStartRow = currentRow;
      fixedUnion.forEach(name => {
        const rowData: any[] = ['Fixed Cost', name];
        years.forEach(y => {
          if (market === 'Aggregated') {
            rowData.push({ f: `'Portugal'!${getCellRef(2 + y, currentRow)} + 'UK'!${getCellRef(2 + y, currentRow)}` });
          } else {
            rowData.push(getStreamValue(market as Market, 'Fixed Cost', name, y));
          }
        });
        rowData.push({ f: `SUM(C${currentRow + 1}:G${currentRow + 1})` });
        rows.push(rowData);
        currentRow++;
      });
      const fixedEndRow = currentRow - 1;
      const fixedTotalRow = currentRow;
      rows.push([
        'Fixed Cost Total', 
        '', 
        ...years.map(y => ({ f: `SUM(${getCellRef(2 + y, fixedStartRow)}:${getCellRef(2 + y, fixedEndRow)})` })),
        { f: `SUM(C${currentRow + 1}:G${currentRow + 1})` }
      ]);
      currentRow++;

      rows.push([]); currentRow++;

      // Summary
      rows.push(['Summary', 'Metric', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Total']); currentRow++;
      
      // Revenues
      rows.push([
        'Summary', 
        'Revenues', 
        ...years.map(y => ({ f: getCellRef(2 + y, revenueTotalRow) })),
        { f: getCellRef(7, revenueTotalRow) }
      ]); currentRow++;
      
      // COGS
      rows.push([
        'Summary', 
        'COGS', 
        ...years.map(y => ({ f: getCellRef(2 + y, cogsTotalRow) })),
        { f: getCellRef(7, cogsTotalRow) }
      ]); currentRow++;

      // Gross Margin
      const gmRow = currentRow;
      rows.push([
        'Summary', 
        'Gross Margin', 
        ...years.map(y => ({ f: `${getCellRef(2 + y, gmRow - 2)}-${getCellRef(2 + y, gmRow - 1)}` })),
        { f: `${getCellRef(7, gmRow - 2)}-${getCellRef(7, gmRow - 1)}` }
      ]); currentRow++;

      // Gross Margin %
      rows.push([
        'Summary', 
        'Gross Margin %', 
        ...years.map(y => ({ f: `IF(${getCellRef(2 + y, gmRow - 2)}>0, ${getCellRef(2 + y, gmRow)}/${getCellRef(2 + y, gmRow - 2)}, 0)` })),
        { f: `IF(${getCellRef(7, gmRow - 2)}>0, ${getCellRef(7, gmRow)}/${getCellRef(7, gmRow - 2)}, 0)` }
      ]); currentRow++;

      // Fixed Costs
      rows.push([
        'Summary', 
        'Fixed Costs', 
        ...years.map(y => ({ f: getCellRef(2 + y, fixedTotalRow) })),
        { f: getCellRef(7, fixedTotalRow) }
      ]); currentRow++;

      // Operating Profit
      const opRow = currentRow;
      rows.push([
        'Summary', 
        'Operating Profit', 
        ...years.map(y => ({ f: `${getCellRef(2 + y, opRow - 3)}-${getCellRef(2 + y, opRow - 1)}` })),
        { f: `${getCellRef(7, opRow - 3)}-${getCellRef(7, opRow - 1)}` }
      ]); currentRow++;

      // Operating Profit %
      rows.push([
        'Summary', 
        'Operating Profit %', 
        ...years.map(y => ({ f: `IF(${getCellRef(2 + y, gmRow - 2)}>0, ${getCellRef(2 + y, opRow)}/${getCellRef(2 + y, gmRow - 2)}, 0)` })),
        { f: `IF(${getCellRef(7, gmRow - 2)}>0, ${getCellRef(7, opRow)}/${getCellRef(7, gmRow - 2)}, 0)` }
      ]); currentRow++;

      rows.push([]); currentRow++;

      // Payment Processing Breakdown (Helper Section) - Moved to end
      rows.push(['Payment Processing Breakdown', 'Metric', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']); currentRow++;

      // Fee %
      rows.push(['Breakdown', 'Payment Fee %', ...years.map(() => 0.029)]); currentRow++;
      
      // Fee per Transaction
      rows.push(['Breakdown', 'Payment Fee per Transaction', ...years.map(() => 0.30)]); currentRow++;

      // The following rows match the pre-calculated subVolRow, bookVolRow, etc.
      if (market === 'Aggregated') {
        rows.push(['Breakdown', 'Subscription Volume', ...years.map(y => ({ f: `'Portugal'!${getCellRef(2 + y, currentRow)} + 'UK'!${getCellRef(2 + y, currentRow)}` }))]);
      } else {
        rows.push(['Breakdown', 'Subscription Volume', ...years.map(y => ({ f: `${getCellRef(2 + y, providersRow)}*${getCellRef(2 + y, subFeeRow)}*${getCellRef(2 + y, chargeSubRow)}*12` }))]);
      }
      currentRow++;

      if (market === 'Aggregated') {
        rows.push(['Breakdown', 'Booking Volume', ...years.map(y => ({ f: `'Portugal'!${getCellRef(2 + y, currentRow)} + 'UK'!${getCellRef(2 + y, currentRow)}` }))]);
      } else {
        rows.push(['Breakdown', 'Booking Volume', ...years.map(y => ({ f: `${getCellRef(2 + y, ownersRow)}*${getCellRef(2 + y, bookingsPerOwnerRow)}*${getCellRef(2 + y, avgPriceRow)}` }))]);
      }
      currentRow++;

      if (market === 'Aggregated') {
        rows.push(['Breakdown', 'Subscription Transactions', ...years.map(y => ({ f: `'Portugal'!${getCellRef(2 + y, currentRow)} + 'UK'!${getCellRef(2 + y, currentRow)}` }))]);
      } else {
        rows.push(['Breakdown', 'Subscription Transactions', ...years.map(y => ({ f: `${getCellRef(2 + y, providersRow)}*12*${getCellRef(2 + y, chargeSubRow)}` }))]);
      }
      currentRow++;

      if (market === 'Aggregated') {
        rows.push(['Breakdown', 'Booking Transactions', ...years.map(y => ({ f: `'Portugal'!${getCellRef(2 + y, currentRow)} + 'UK'!${getCellRef(2 + y, currentRow)}` }))]);
      } else {
        rows.push(['Breakdown', 'Booking Transactions', ...years.map(y => ({ f: `${getCellRef(2 + y, ownersRow)}*${getCellRef(2 + y, bookingsPerOwnerRow)}` }))]);
      }
      currentRow++;

      const ws = XLSX.utils.aoa_to_sheet(rows);

      // Apply formatting
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const firstCell = ws[XLSX.utils.encode_cell({ r: R, c: 0 })];
        const secondCell = ws[XLSX.utils.encode_cell({ r: R, c: 1 })];
        const category = firstCell?.v;
        const name = secondCell?.v;

        // Check if this row should be formatted as percentage
        const isPercentage = 
          name === '% of bookings commission' || 
          name === 'Gross Margin %' || 
          name === 'Operating Profit %' || 
          name === 'Payment Fee %';
        
        const isPlatformMetric = category === 'Platform Metric';

        if (isPercentage) {
          for (let C = 2; C <= range.e.c; ++C) {
            const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
            if (cell && (cell.t === 'n' || cell.f)) {
              cell.z = '0.0%';
            }
          }
        } else if (isPlatformMetric) {
          for (let C = 2; C <= range.e.c; ++C) {
            const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
            if (cell && (cell.t === 'n' || cell.f)) {
              cell.z = '0';
            }
          }
        }
      }

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
    showTotal: boolean = true
  ) => {
    const formatValue = (val: number) => {
      if (formatType === 'currency') return formatCurrency(val);
      return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val);
    };
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
                      Formula: (Total Volume × 2.9%) + (Total Transactions × €0.30)
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
              {years.map(y => (
                <div key={y} className="relative">
                  {isReadOnly || stream.isCalculated ? (
                    <div className={`block w-full px-1 py-2 border border-slate-200 bg-slate-100 rounded-lg text-xs text-center text-slate-500 transition-colors ${Number(stream.amounts[y]) < 0 ? 'text-red-600' : ''}`}>
                      {formatValue(Number(stream.amounts[y]))}
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={stream.amounts[y]}
                      onChange={(e) => updateStreamAmount(streams, stream.id, y, e.target.value ? Number(e.target.value) : '', stateKey)}
                      className={`block w-full px-1 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-xs text-center transition-colors ${Number(stream.amounts[y]) < 0 ? 'text-red-600' : ''}`}
                      placeholder="0"
                    />
                  )}
                </div>
              ))}
              {showTotal && (
                <div className={`flex items-center justify-end text-sm font-semibold whitespace-nowrap ${getStreamTotal(stream) >= 0 ? 'text-slate-700' : 'text-red-600'}`}>
                  {formatValue(getStreamTotal(stream))}
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

              {renderStreamSection('Revenue Streams', derivedRevenueStreams, 'Revenue', totalRevenue, totalRevenueByYear, 'revenueStreams')}
              {renderStreamSection('COGS', derivedVariableCostsStreams, 'Cost', totalVariableCosts, totalVarCostsByYear, 'variableCostsStreams')}
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
                      content={(props) => {
                        const { payload } = props;
                        const order = ['Revenues', 'COGS', 'Gross Margin', 'Fixed Costs', 'Op. Profit'];
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
                    <Bar dataKey="Revenues" fill="#3b82f6">
                      <LabelList dataKey="Revenues" content={renderCustomBarLabel} />
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
          </div>
        </div>
        )}

        {activeTab === 'platform' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              <div className="xl:col-span-7 space-y-6">
                {renderStreamSection('Platform Metrics', platformMetricsStreams, 'Metric', totalPlatformMetrics, totalPlatformMetricsByYear, 'platformMetricsStreams', 'number', false)}
                
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

              <div className="xl:col-span-5 space-y-6">
                {/* Provider Analysis Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h2 className="text-lg font-medium mb-6">Provider Analysis</h2>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={platformChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `${val}%`} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value, name) => {
                            if (name === 'Provider Churn') return [`${value}%`, name];
                            return [value, name];
                          }}
                        />
                        <Legend verticalAlign="top" height={36}/>
                        <Line yAxisId="left" type="monotone" dataKey="Total Providers" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line yAxisId="left" type="monotone" dataKey="New Providers" stroke="#7dd3fc" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                        <Line yAxisId="right" type="monotone" dataKey="Provider Churn" stroke="#f59e0b" strokeWidth={3} strokeDasharray="1 5" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Owner Analysis Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h2 className="text-lg font-medium mb-6">Owner Analysis</h2>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={platformChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `${val}%`} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value, name) => {
                            if (name === 'Owner Churn') return [`${value}%`, name];
                            return [value, name];
                          }}
                        />
                        <Legend verticalAlign="top" height={36}/>
                        <Line yAxisId="left" type="monotone" dataKey="Total Owners" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line yAxisId="left" type="monotone" dataKey="New Owners" stroke="#6ee7b7" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                        <Line yAxisId="right" type="monotone" dataKey="Owner Churn" stroke="#6366f1" strokeWidth={3} strokeDasharray="1 5" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Independent Churn Trend Charts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
                      <span>Provider Churn Trend</span>
                    </h2>
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

                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-[#6366f1]"></div>
                      <span>Owner Churn Trend</span>
                    </h2>
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

