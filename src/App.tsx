import React, { useState } from 'react';
import { Calculator, DollarSign, TrendingUp, Activity, Plus, Trash2, Percent } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface FinancialStream {
  id: string;
  name: string;
  amount: number | '';
  isPermanent?: boolean;
}

export default function App() {
  const [revenueStreams, setRevenueStreams] = useState<FinancialStream[]>([
    { id: '1', name: 'Monthly Subscriptions', amount: '', isPermanent: true },
    { id: '2', name: 'Booking Fees', amount: '', isPermanent: true },
    { id: '3', name: 'Others', amount: '', isPermanent: true }
  ]);
  
  const [variableCostsStreams, setVariableCostsStreams] = useState<FinancialStream[]>([
    { id: '1', name: 'Payment Processing', amount: '' },
    { id: '2', name: 'Customer Support', amount: '' }
  ]);

  const [fixedCostsStreams, setFixedCostsStreams] = useState<FinancialStream[]>([
    { id: '1', name: 'Rent', amount: '' },
    { id: '2', name: 'Salaries', amount: '' }
  ]);

  const totalRevenue = revenueStreams.reduce((sum, stream) => sum + (typeof stream.amount === 'number' ? stream.amount : 0), 0);
  const totalVariableCosts = variableCostsStreams.reduce((sum, stream) => sum + (typeof stream.amount === 'number' ? stream.amount : 0), 0);
  const fixedCosts = fixedCostsStreams.reduce((sum, stream) => sum + (typeof stream.amount === 'number' ? stream.amount : 0), 0);

  const grossMargin = totalRevenue - totalVariableCosts;
  const calculatedMarginPercent = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;
  const operatingProfit = grossMargin - fixedCosts;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const addRevenueStream = () => {
    setRevenueStreams([
      ...revenueStreams,
      { id: Date.now().toString(), name: `Revenue Stream ${revenueStreams.length + 1}`, amount: '' }
    ]);
  };

  const updateRevenueStream = (id: string, field: keyof FinancialStream, value: string | number) => {
    setRevenueStreams(revenueStreams.map(stream => 
      stream.id === id ? { ...stream, [field]: value } : stream
    ));
  };

  const removeRevenueStream = (id: string) => {
    setRevenueStreams(revenueStreams.filter(stream => stream.id !== id));
  };

  const addVariableCostStream = () => {
    setVariableCostsStreams([
      ...variableCostsStreams,
      { id: Date.now().toString(), name: `Variable Cost ${variableCostsStreams.length + 1}`, amount: '' }
    ]);
  };

  const updateVariableCostStream = (id: string, field: keyof FinancialStream, value: string | number) => {
    setVariableCostsStreams(variableCostsStreams.map(stream => 
      stream.id === id ? { ...stream, [field]: value } : stream
    ));
  };

  const removeVariableCostStream = (id: string) => {
    setVariableCostsStreams(variableCostsStreams.filter(stream => stream.id !== id));
  };

  const addFixedCostStream = () => {
    setFixedCostsStreams([
      ...fixedCostsStreams,
      { id: Date.now().toString(), name: `Fixed Cost ${fixedCostsStreams.length + 1}`, amount: '' }
    ]);
  };

  const updateFixedCostStream = (id: string, field: keyof FinancialStream, value: string | number) => {
    setFixedCostsStreams(fixedCostsStreams.map(stream => 
      stream.id === id ? { ...stream, [field]: value } : stream
    ));
  };

  const removeFixedCostStream = (id: string) => {
    setFixedCostsStreams(fixedCostsStreams.filter(stream => stream.id !== id));
  };

  const chartData = [
    { 
      name: 'Revenue', 
      ...revenueStreams.reduce((acc, s) => ({...acc, [`rev-${s.id}`]: typeof s.amount === 'number' ? s.amount : 0}), {}) 
    },
    { 
      name: 'Var. Costs', 
      ...variableCostsStreams.reduce((acc, s) => ({...acc, [`var-${s.id}`]: typeof s.amount === 'number' ? s.amount : 0}), {}) 
    },
    { 
      name: 'Gross Margin', 
      'gross-margin': grossMargin 
    },
    { 
      name: 'Fixed Costs', 
      ...fixedCostsStreams.reduce((acc, s) => ({...acc, [`fix-${s.id}`]: typeof s.amount === 'number' ? s.amount : 0}), {}) 
    },
    { 
      name: 'Op. Profit', 
      'op-profit': operatingProfit 
    },
  ];

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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center space-x-4">
          <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-sm">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Financial Viability Tracker</h1>
            <p className="text-slate-500 text-sm">Internal tool for business model validation</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Inputs Section */}
          <div className="lg:col-span-5 space-y-6">
            {/* Revenue Streams */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-slate-400" />
                  <span>Revenue Streams</span>
                </h2>
                <button 
                  onClick={addRevenueStream}
                  className="text-sm flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Stream</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {revenueStreams.map((stream) => (
                  <div key={stream.id} className="flex items-start space-x-3">
                    <div className="flex-1 space-y-2">
                      {stream.isPermanent ? (
                        <div className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700">
                          {stream.name}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={stream.name}
                          onChange={(e) => updateRevenueStream(stream.id, 'name', e.target.value)}
                          className="block w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                          placeholder="Revenue Type"
                        />
                      )}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DollarSign className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type="number"
                          value={stream.amount}
                          onChange={(e) => updateRevenueStream(stream.id, 'amount', e.target.value ? Number(e.target.value) : '')}
                          className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    {!stream.isPermanent && (
                      <button 
                        onClick={() => removeRevenueStream(stream.id)}
                        className="mt-2 p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                        title="Remove Revenue Stream"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Total Revenue</span>
                <span className="text-lg font-semibold text-slate-900">{formatCurrency(totalRevenue)}</span>
              </div>
            </div>

            {/* Variable Costs */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-slate-400" />
                  <span>Variable Costs</span>
                </h2>
                <button 
                  onClick={addVariableCostStream}
                  className="text-sm flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Cost</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {variableCostsStreams.map((stream) => (
                  <div key={stream.id} className="flex items-start space-x-3">
                    <div className="flex-1 space-y-2">
                      {stream.isPermanent ? (
                        <div className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700">
                          {stream.name}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={stream.name}
                          onChange={(e) => updateVariableCostStream(stream.id, 'name', e.target.value)}
                          className="block w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                          placeholder="Cost Type"
                        />
                      )}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DollarSign className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type="number"
                          value={stream.amount}
                          onChange={(e) => updateVariableCostStream(stream.id, 'amount', e.target.value ? Number(e.target.value) : '')}
                          className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    {!stream.isPermanent && (
                      <button 
                        onClick={() => removeVariableCostStream(stream.id)}
                        className="mt-2 p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                        title="Remove Variable Cost"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Total Variable Costs</span>
                <span className="text-lg font-semibold text-slate-900">{formatCurrency(totalVariableCosts)}</span>
              </div>
            </div>

            {/* Fixed Operating Costs */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-slate-400" />
                  <span>Fixed Operating Costs</span>
                </h2>
                <button 
                  onClick={addFixedCostStream}
                  className="text-sm flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Cost</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {fixedCostsStreams.map((stream) => (
                  <div key={stream.id} className="flex items-start space-x-3">
                    <div className="flex-1 space-y-2">
                      {stream.isPermanent ? (
                        <div className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700">
                          {stream.name}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={stream.name}
                          onChange={(e) => updateFixedCostStream(stream.id, 'name', e.target.value)}
                          className="block w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                          placeholder="Cost Type"
                        />
                      )}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DollarSign className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type="number"
                          value={stream.amount}
                          onChange={(e) => updateFixedCostStream(stream.id, 'amount', e.target.value ? Number(e.target.value) : '')}
                          className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    {!stream.isPermanent && (
                      <button 
                        onClick={() => removeFixedCostStream(stream.id)}
                        className="mt-2 p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                        title="Remove Fixed Cost"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Total Fixed Costs</span>
                <span className="text-lg font-semibold text-slate-900">{formatCurrency(fixedCosts)}</span>
              </div>
            </div>
          </div>

          {/* Outputs & Visualization Section */}
          <div className="lg:col-span-7 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Gross Margin Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Gross Margin ({calculatedMarginPercent.toFixed(1)}%)</p>
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
                      Operating Profit
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
              <h2 className="text-lg font-medium mb-6">Financial Overview</h2>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
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
                      <Bar key={`rev-${s.id}`} dataKey={`rev-${s.id}`} stackId="a" fill={revenueColors[i % revenueColors.length]} />
                    ))}
                    {variableCostsStreams.map((s, i) => (
                      <Bar key={`var-${s.id}`} dataKey={`var-${s.id}`} stackId="a" fill={varCostColors[i % varCostColors.length]} />
                    ))}
                    <Bar dataKey="gross-margin" stackId="a" fill="#8b5cf6" />
                    {fixedCostsStreams.map((s, i) => (
                      <Bar key={`fix-${s.id}`} dataKey={`fix-${s.id}`} stackId="a" fill={fixedCostColors[i % fixedCostColors.length]} />
                    ))}
                    <Bar dataKey="op-profit" stackId="a" fill={operatingProfit >= 0 ? '#10b981' : '#ef4444'} />
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
