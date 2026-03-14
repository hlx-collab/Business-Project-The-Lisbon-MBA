import React, { useState } from 'react';
import { Calculator, DollarSign, TrendingUp, Activity, Plus, Trash2, Percent } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface FinancialStream {
  id: string;
  name: string;
  amounts: (number | '')[];
  isPermanent?: boolean;
}

export default function App() {
  const [revenueStreams, setRevenueStreams] = useState<FinancialStream[]>([
    { id: '1', name: 'Monthly Subscriptions', amounts: ['', '', '', '', ''], isPermanent: true },
    { id: '2', name: 'Booking Fees', amounts: ['', '', '', '', ''], isPermanent: true },
    { id: '3', name: 'Others', amounts: ['', '', '', '', ''], isPermanent: true }
  ]);
  
  const [variableCostsStreams, setVariableCostsStreams] = useState<FinancialStream[]>([
    { id: '1', name: 'Payment Processing', amounts: ['', '', '', '', ''] },
    { id: '2', name: 'Customer Support', amounts: ['', '', '', '', ''] }
  ]);

  const [fixedCostsStreams, setFixedCostsStreams] = useState<FinancialStream[]>([
    { id: '1', name: 'Rent', amounts: ['', '', '', '', ''] },
    { id: '2', name: 'Salaries', amounts: ['', '', '', '', ''] }
  ]);

  const years = [0, 1, 2, 3, 4];

  const getStreamTotal = (stream: FinancialStream) => stream.amounts.reduce((sum, val) => (sum as number) + (typeof val === 'number' ? val : 0), 0) as number;

  const totalRevenueByYear = years.map(y => revenueStreams.reduce((sum, stream) => sum + (typeof stream.amounts[y] === 'number' ? stream.amounts[y] as number : 0), 0));
  const totalVarCostsByYear = years.map(y => variableCostsStreams.reduce((sum, stream) => sum + (typeof stream.amounts[y] === 'number' ? stream.amounts[y] as number : 0), 0));
  const totalFixedCostsByYear = years.map(y => fixedCostsStreams.reduce((sum, stream) => sum + (typeof stream.amounts[y] === 'number' ? stream.amounts[y] as number : 0), 0));

  const grossMarginByYear = years.map(y => totalRevenueByYear[y] - totalVarCostsByYear[y]);
  const opProfitByYear = years.map(y => grossMarginByYear[y] - totalFixedCostsByYear[y]);

  const totalRevenue = totalRevenueByYear.reduce((a, b) => a + b, 0);
  const totalVariableCosts = totalVarCostsByYear.reduce((a, b) => a + b, 0);
  const fixedCosts = totalFixedCostsByYear.reduce((a, b) => a + b, 0);
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

  const chartData = [...years.map(y => {
    const data: any = { name: `Year ${y + 1}` };
    revenueStreams.forEach(s => data[`rev-${s.id}`] = typeof s.amounts[y] === 'number' ? s.amounts[y] : 0);
    variableCostsStreams.forEach(s => data[`var-${s.id}`] = typeof s.amounts[y] === 'number' ? s.amounts[y] : 0);
    fixedCostsStreams.forEach(s => data[`fix-${s.id}`] = typeof s.amounts[y] === 'number' ? s.amounts[y] : 0);
    data['gross-margin'] = grossMarginByYear[y];
    data['op-profit'] = opProfitByYear[y];
    return data;
  }), {
    name: 'Total',
    ...revenueStreams.reduce((acc, s) => ({...acc, [`rev-${s.id}`]: getStreamTotal(s)}), {}),
    ...variableCostsStreams.reduce((acc, s) => ({...acc, [`var-${s.id}`]: getStreamTotal(s)}), {}),
    ...fixedCostsStreams.reduce((acc, s) => ({...acc, [`fix-${s.id}`]: getStreamTotal(s)}), {}),
    'gross-margin': grossMargin,
    'op-profit': operatingProfit
  }];

  const revenueColors = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
  const varCostColors = ['#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a'];
  const fixedCostColors = ['#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa'];

  const formatTooltip = (value: any, name: any) => {
    const numValue = typeof value === 'number' ? value : Number(value);
    if (name === 'gross-margin') return [formatCurrency(numValue), 'Gross Margin'];
    if (name === 'op-profit') return [formatCurrency(numValue), 'Operating Profit'];
    
    if (typeof name === 'string') {
      if (name.startsWith('rev-')) {
        const stream = revenueStreams.find(s => s.id === name.replace('rev-', ''));
        return [formatCurrency(numValue), stream ? stream.name : name];
      }
      if (name.startsWith('var-')) {
        const stream = variableCostsStreams.find(s => s.id === name.replace('var-', ''));
        return [formatCurrency(numValue), stream ? stream.name : name];
      }
      if (name.startsWith('fix-')) {
        const stream = fixedCostsStreams.find(s => s.id === name.replace('fix-', ''));
        return [formatCurrency(numValue), stream ? stream.name : name];
      }
    }
    return [formatCurrency(numValue), name];
  };

  const renderCustomBarLabel = (props: any, name: string) => {
    const { x, y, width, height, value } = props;
    if (!value || value <= 0 || height < 24) return null;
    const displayName = name.length > 12 ? name.substring(0, 10) + '...' : name;
    return (
      <text 
        x={x + width / 2} 
        y={y + height / 2} 
        fill="#ffffff" 
        textAnchor="middle" 
        dominantBaseline="middle" 
        fontSize={11} 
        fontWeight={600}
        style={{ pointerEvents: 'none', textShadow: '0px 1px 2px rgba(0,0,0,0.2)' }}
      >
        {displayName}
      </text>
    );
  };

  const renderStreamSection = (
    title: string, 
    streams: FinancialStream[], 
    setStreams: React.Dispatch<React.SetStateAction<FinancialStream[]>>, 
    prefix: string, 
    total: number
  ) => (
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
                {formatCurrency(getStreamTotal(stream))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
        <span className="text-sm font-medium text-slate-500">Total {title}</span>
        <span className="text-lg font-semibold text-slate-900">{formatCurrency(total)}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center space-x-4">
          <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-sm">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Financial Viability Tracker</h1>
            <p className="text-slate-500 text-sm">5-Year Business Model Validation</p>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Inputs Section */}
          <div className="xl:col-span-7 space-y-6">
            {renderStreamSection('Revenue Streams', revenueStreams, setRevenueStreams, 'Revenue', totalRevenue)}
            {renderStreamSection('Variable Costs', variableCostsStreams, setVariableCostsStreams, 'Cost', totalVariableCosts)}
            {renderStreamSection('Fixed Operating Costs', fixedCostsStreams, setFixedCostsStreams, 'Fixed Cost', fixedCosts)}
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
              </div>

              {/* Operating Profit Card */}
              <div className={`p-6 rounded-2xl shadow-sm border ${operatingProfit >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-red-50 border-red-100'}`}>
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
            </div>

            {/* Chart Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-medium mb-6">5-Year Financial Overview</h2>
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
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
                    {revenueStreams.map((s, i) => (
                      <Bar key={`rev-${s.id}`} dataKey={`rev-${s.id}`} stackId="revenue" fill={revenueColors[i % revenueColors.length]}>
                        <LabelList dataKey={`rev-${s.id}`} content={(props: any) => renderCustomBarLabel(props, s.name)} />
                      </Bar>
                    ))}
                    {variableCostsStreams.map((s, i) => (
                      <Bar key={`var-${s.id}`} dataKey={`var-${s.id}`} stackId="varCosts" fill={varCostColors[i % varCostColors.length]}>
                        <LabelList dataKey={`var-${s.id}`} content={(props: any) => renderCustomBarLabel(props, s.name)} />
                      </Bar>
                    ))}
                    <Bar dataKey="gross-margin" stackId="grossMargin" fill="#8b5cf6">
                      <LabelList dataKey="gross-margin" content={(props: any) => renderCustomBarLabel(props, 'Gross Margin')} />
                    </Bar>
                    {fixedCostsStreams.map((s, i) => (
                      <Bar key={`fix-${s.id}`} dataKey={`fix-${s.id}`} stackId="fixedCosts" fill={fixedCostColors[i % fixedCostColors.length]}>
                        <LabelList dataKey={`fix-${s.id}`} content={(props: any) => renderCustomBarLabel(props, s.name)} />
                      </Bar>
                    ))}
                    <Bar dataKey="op-profit" stackId="opProfit" fill={operatingProfit >= 0 ? '#10b981' : '#ef4444'}>
                      <LabelList dataKey="op-profit" content={(props: any) => renderCustomBarLabel(props, 'Op. Profit')} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

