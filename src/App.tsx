import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, TrendingUp, Activity, Plus, Trash2, Percent, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, Legend } from 'recharts';
import * as XLSX from 'xlsx';

interface FinancialStream {
  id: string;
  name: string;
  amounts: (number | '')[];
  isPermanent?: boolean;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'financials' | 'platform'>('financials');

  const [platformMetricsStreams, setPlatformMetricsStreams] = useState<FinancialStream[]>(() => {
    const saved = localStorage.getItem('platformMetricsStreams');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Number of providers in the platform', amounts: ['', '', '', '', ''], isPermanent: true },
      { id: '2', name: 'Number of owners in the platform', amounts: ['', '', '', '', ''], isPermanent: true }
    ];
  });

  const [chargeSubscription, setChargeSubscription] = useState<boolean[]>(() => {
    const saved = localStorage.getItem('chargeSubscription');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed === 'boolean') return Array(5).fill(parsed);
      return parsed;
    }
    return [false, false, false, false, false];
  });

  const [chargeBookingFees, setChargeBookingFees] = useState<boolean[]>(() => {
    const saved = localStorage.getItem('chargeBookingFees');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed === 'boolean') return Array(5).fill(parsed);
      return parsed;
    }
    return [false, false, false, false, false];
  });

  useEffect(() => {
    localStorage.setItem('platformMetricsStreams', JSON.stringify(platformMetricsStreams));
  }, [platformMetricsStreams]);

  useEffect(() => {
    localStorage.setItem('chargeSubscription', JSON.stringify(chargeSubscription));
  }, [chargeSubscription]);

  useEffect(() => {
    localStorage.setItem('chargeBookingFees', JSON.stringify(chargeBookingFees));
  }, [chargeBookingFees]);

  const [revenueStreams, setRevenueStreams] = useState<FinancialStream[]>(() => {
    const saved = localStorage.getItem('revenueStreams');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Monthly Subscriptions', amounts: ['', '', '', '', ''], isPermanent: true },
      { id: '2', name: 'Booking Fees', amounts: ['', '', '', '', ''], isPermanent: true },
      { id: '3', name: 'Others', amounts: ['', '', '', '', ''], isPermanent: true }
    ];
  });
  
  const [variableCostsStreams, setVariableCostsStreams] = useState<FinancialStream[]>(() => {
    const saved = localStorage.getItem('variableCostsStreams');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Payment Processing', amounts: ['', '', '', '', ''] },
      { id: '2', name: 'Customer Support', amounts: ['', '', '', '', ''] }
    ];
  });

  const [fixedCostsStreams, setFixedCostsStreams] = useState<FinancialStream[]>(() => {
    const saved = localStorage.getItem('fixedCostsStreams');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Rent', amounts: ['', '', '', '', ''] },
      { id: '2', name: 'Salaries', amounts: ['', '', '', '', ''] },
      { id: '3', name: 'Advertisement', amounts: ['', '', '', '', ''], isPermanent: true },
      { id: '4', name: 'IT R&D and Support', amounts: ['', '', '', '', ''], isPermanent: true }
    ];
  });

  useEffect(() => {
    localStorage.setItem('revenueStreams', JSON.stringify(revenueStreams));
  }, [revenueStreams]);

  useEffect(() => {
    localStorage.setItem('variableCostsStreams', JSON.stringify(variableCostsStreams));
  }, [variableCostsStreams]);

  useEffect(() => {
    localStorage.setItem('fixedCostsStreams', JSON.stringify(fixedCostsStreams));
  }, [fixedCostsStreams]);

  const years = [0, 1, 2, 3, 4];

  const getStreamTotal = (stream: FinancialStream) => stream.amounts.reduce((sum, val) => (sum as number) + (typeof val === 'number' ? val : 0), 0) as number;

  const totalRevenueByYear = years.map(y => revenueStreams.reduce((sum, stream) => sum + (typeof stream.amounts[y] === 'number' ? stream.amounts[y] as number : 0), 0));
  const totalVarCostsByYear = years.map(y => variableCostsStreams.reduce((sum, stream) => sum + (typeof stream.amounts[y] === 'number' ? stream.amounts[y] as number : 0), 0));
  const totalFixedCostsByYear = years.map(y => fixedCostsStreams.reduce((sum, stream) => sum + (typeof stream.amounts[y] === 'number' ? stream.amounts[y] as number : 0), 0));
  const totalPlatformMetricsByYear = years.map(y => platformMetricsStreams.reduce((sum, stream) => sum + (typeof stream.amounts[y] === 'number' ? stream.amounts[y] as number : 0), 0));

  const grossMarginByYear = years.map(y => totalRevenueByYear[y] - totalVarCostsByYear[y]);
  const opProfitByYear = years.map(y => grossMarginByYear[y] - totalFixedCostsByYear[y]);

  const totalRevenue = totalRevenueByYear.reduce((a, b) => a + b, 0);
  const totalVariableCosts = totalVarCostsByYear.reduce((a, b) => a + b, 0);
  const fixedCosts = totalFixedCostsByYear.reduce((a, b) => a + b, 0);
  const totalPlatformMetrics = totalPlatformMetricsByYear.reduce((a, b) => a + b, 0);
  const grossMargin = grossMarginByYear.reduce((a, b) => a + b, 0);
  const operatingProfit = opProfitByYear.reduce((a, b) => a + b, 0);
  const calculatedMarginPercent = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const addStream = (streams: FinancialStream[], setStreams: React.Dispatch<React.SetStateAction<FinancialStream[]>>, prefix: string) => {
    setStreams([
      ...streams,
      { id: Date.now().toString(), name: `${prefix} ${streams.length + 1}`, amounts: ['', '', '', '', ''] }
    ]);
  };

  const updateStreamName = (streams: FinancialStream[], setStreams: React.Dispatch<React.SetStateAction<FinancialStream[]>>, id: string, name: string) => {
    setStreams(streams.map(stream => stream.id === id ? { ...stream, name } : stream));
  };

  const updateStreamAmount = (streams: FinancialStream[], setStreams: React.Dispatch<React.SetStateAction<FinancialStream[]>>, id: string, yearIndex: number, value: string | number) => {
    setStreams(streams.map(stream => {
      if (stream.id === id) {
        const newAmounts = [...stream.amounts];
        newAmounts[yearIndex] = value;
        return { ...stream, amounts: newAmounts };
      }
      return stream;
    }));
  };

  const removeStream = (streams: FinancialStream[], setStreams: React.Dispatch<React.SetStateAction<FinancialStream[]>>, id: string) => {
    setStreams(streams.filter(stream => stream.id !== id));
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
    if (value === 0) return '$0';
    const absVal = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (absVal >= 1000000) return `${sign}$${(absVal / 1000000).toFixed(1)}M`;
    if (absVal >= 1000) return `${sign}$${(absVal / 1000).toFixed(0)}k`;
    return `${sign}$${absVal}`;
  };

  const exportToCSV = () => {
    const rows: string[][] = [];
    
    // Header
    rows.push(['Category', 'Stream Name', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Total']);
    
    // Revenue Streams
    revenueStreams.forEach(stream => {
      rows.push(['Revenue', stream.name, ...stream.amounts.map(a => String(a || 0)), String(getStreamTotal(stream))]);
    });
    rows.push(['Revenue Total', '', ...totalRevenueByYear.map(String), String(totalRevenue)]);
    
    // Variable Costs
    variableCostsStreams.forEach(stream => {
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

  const exportToXLSX = () => {
    const rows: any[][] = [];
    
    // Header
    rows.push(['Category', 'Stream Name', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Total']);
    
    // Revenue Streams
    revenueStreams.forEach(stream => {
      rows.push(['Revenue', stream.name, ...stream.amounts.map(a => Number(a) || 0), getStreamTotal(stream)]);
    });
    rows.push(['Revenue Total', '', ...totalRevenueByYear, totalRevenue]);
    
    // Variable Costs
    variableCostsStreams.forEach(stream => {
      rows.push(['Variable Cost', stream.name, ...stream.amounts.map(a => Number(a) || 0), getStreamTotal(stream)]);
    });
    rows.push(['Variable Cost Total', '', ...totalVarCostsByYear, totalVariableCosts]);
    
    // Fixed Costs
    fixedCostsStreams.forEach(stream => {
      rows.push(['Fixed Cost', stream.name, ...stream.amounts.map(a => Number(a) || 0), getStreamTotal(stream)]);
    });
    rows.push(['Fixed Cost Total', '', ...totalFixedCostsByYear, fixedCosts]);
    
    // Summary
    rows.push(['Summary', 'Gross Margin', ...grossMarginByYear, grossMargin]);
    rows.push(['Summary', 'Operating Profit', ...opProfitByYear, operatingProfit]);
    
    // Platform Metrics
    rows.push([]);
    rows.push(['Platform Metrics', 'Stream Name', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Total']);
    platformMetricsStreams.forEach(stream => {
      rows.push(['Platform Metric', stream.name, ...stream.amounts.map(a => Number(a) || 0), getStreamTotal(stream)]);
    });
    rows.push(['Platform Metric Total', '', ...totalPlatformMetricsByYear, totalPlatformMetrics]);
    
    // Platform Settings
    rows.push([]);
    rows.push(['Platform Settings', 'Setting', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']);
    rows.push(['Platform Setting', 'Charge Subscription', ...chargeSubscription.map(v => v ? 'Yes' : 'No')]);
    rows.push(['Platform Setting', 'Charge Booking Fees', ...chargeBookingFees.map(v => v ? 'Yes' : 'No')]);
    
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Financial Data");
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
    setStreams: React.Dispatch<React.SetStateAction<FinancialStream[]>>, 
    prefix: string, 
    total: number,
    totalsByYear: number[],
    formatType: 'currency' | 'number' = 'currency'
  ) => {
    const formatValue = (val: number) => formatType === 'currency' ? formatCurrency(val) : new Intl.NumberFormat('en-US').format(val);
    
    return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium flex items-center space-x-2">
          <Activity className="w-5 h-5 text-slate-400" />
          <span>{title}</span>
        </h2>
        <button 
          onClick={() => addStream(streams, setStreams, prefix)}
          className="text-sm flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Add Stream</span>
        </button>
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
          <div key={stream.id} className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
            <div className="flex-1 flex items-center space-x-2">
              {stream.isPermanent ? (
                <div className="block w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 truncate">
                  {stream.name}
                </div>
              ) : (
                <input
                  type="text"
                  value={stream.name}
                  onChange={(e) => updateStreamName(streams, setStreams, stream.id, e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                  placeholder={`${prefix} Type`}
                />
              )}
              {!stream.isPermanent && (
                <button 
                  onClick={() => removeStream(streams, setStreams, stream.id)}
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
                    onChange={(e) => updateStreamAmount(streams, setStreams, stream.id, y, e.target.value ? Number(e.target.value) : '')}
                    className="block w-full px-1 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-xs text-center transition-colors"
                    placeholder="0"
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
        </div>

        {activeTab === 'financials' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Inputs Section */}
            <div className="xl:col-span-7 space-y-6">
              {renderStreamSection('Revenue Streams', revenueStreams, setRevenueStreams, 'Revenue', totalRevenue, totalRevenueByYear)}
              {renderStreamSection('Variable Costs', variableCostsStreams, setVariableCostsStreams, 'Cost', totalVariableCosts, totalVarCostsByYear)}
              {renderStreamSection('Fixed Operating Costs', fixedCostsStreams, setFixedCostsStreams, 'Fixed Cost', fixedCosts, totalFixedCostsByYear)}
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
                      tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
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
              {renderStreamSection('Platform Metrics', platformMetricsStreams, setPlatformMetricsStreams, 'Metric', totalPlatformMetrics, totalPlatformMetricsByYear, 'number')}
              
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
                            onClick={() => {
                              const newVals = [...chargeSubscription];
                              newVals[y] = !newVals[y];
                              setChargeSubscription(newVals);
                            }}
                            className={`w-full py-1.5 text-xs font-medium rounded-md transition-colors ${
                              chargeSubscription[y] 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
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
                            onClick={() => {
                              const newVals = [...chargeBookingFees];
                              newVals[y] = !newVals[y];
                              setChargeBookingFees(newVals);
                            }}
                            className={`w-full py-1.5 text-xs font-medium rounded-md transition-colors ${
                              chargeBookingFees[y] 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
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
      </div>
    </div>
  );
}

