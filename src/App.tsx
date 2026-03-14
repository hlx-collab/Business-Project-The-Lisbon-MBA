import React, { useState } from 'react';
import { Calculator, DollarSign, TrendingUp, Activity, Plus, Trash2, Percent } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface RevenueStream {
  id: string;
  name: string;
  amount: number | '';
}

export default function App() {
  const [revenueStreams, setRevenueStreams] = useState<RevenueStream[]>([
    { id: '1', name: 'Retail Sales', amount: '' }
  ]);
  const [fixedOperatingCosts, setFixedOperatingCosts] = useState<number | ''>('');
  const [variableOperatingCostsPercent, setVariableOperatingCostsPercent] = useState<number | ''>('');
  const [grossMarginPercent, setGrossMarginPercent] = useState<number | ''>(40);

  const totalRevenue = revenueStreams.reduce((sum, stream) => sum + (typeof stream.amount === 'number' ? stream.amount : 0), 0);
  const fixedCosts = typeof fixedOperatingCosts === 'number' ? fixedOperatingCosts : 0;
  const variableCostsPercent = typeof variableOperatingCostsPercent === 'number' ? variableOperatingCostsPercent : 0;
  const marginPercent = typeof grossMarginPercent === 'number' ? grossMarginPercent : 0;

  const grossMargin = totalRevenue * (marginPercent / 100);
  const variableCosts = totalRevenue * (variableCostsPercent / 100);
  const totalOperatingCosts = fixedCosts + variableCosts;
  const operatingProfit = grossMargin - totalOperatingCosts;

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

  const updateRevenueStream = (id: string, field: keyof RevenueStream, value: string | number) => {
    setRevenueStreams(revenueStreams.map(stream => 
      stream.id === id ? { ...stream, [field]: value } : stream
    ));
  };

  const removeRevenueStream = (id: string) => {
    if (revenueStreams.length > 1) {
      setRevenueStreams(revenueStreams.filter(stream => stream.id !== id));
    }
  };

  const chartData = [
    { name: 'Total Revenue', value: totalRevenue },
    { name: 'Total Operating Costs', value: totalOperatingCosts },
    { name: 'Operating Profit', value: operatingProfit },
  ];

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
                {revenueStreams.map((stream, index) => (
                  <div key={stream.id} className="flex items-start space-x-3">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={stream.name}
                        onChange={(e) => updateRevenueStream(stream.id, 'name', e.target.value)}
                        className="block w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                        placeholder="Revenue Type"
                      />
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
                    {revenueStreams.length > 1 && (
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

            {/* Margin Settings */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
              <h2 className="text-lg font-medium flex items-center space-x-2">
                <Percent className="w-5 h-5 text-slate-400" />
                <span>Margin Settings</span>
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="grossMarginPercent" className="block text-sm font-medium text-slate-700">
                    Gross Margin (%)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Percent className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="number"
                      id="grossMarginPercent"
                      value={grossMarginPercent}
                      onChange={(e) => setGrossMarginPercent(e.target.value ? Number(e.target.value) : '')}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                      placeholder="40"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Operating Costs */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
              <h2 className="text-lg font-medium flex items-center space-x-2">
                <Activity className="w-5 h-5 text-slate-400" />
                <span>Operating Costs</span>
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="fixedOperatingCosts" className="block text-sm font-medium text-slate-700">
                    Fixed Operating Costs
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="number"
                      id="fixedOperatingCosts"
                      value={fixedOperatingCosts}
                      onChange={(e) => setFixedOperatingCosts(e.target.value ? Number(e.target.value) : '')}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="variableOperatingCostsPercent" className="block text-sm font-medium text-slate-700">
                    Variable Operating Costs (% of Total Revenue)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Percent className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="number"
                      id="variableOperatingCostsPercent"
                      value={variableOperatingCostsPercent}
                      onChange={(e) => setVariableOperatingCostsPercent(e.target.value ? Number(e.target.value) : '')}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                      placeholder="0"
                    />
                  </div>
                  {variableCosts > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      Calculated Variable Costs: {formatCurrency(variableCosts)}
                    </p>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Total Operating Costs</span>
                <span className="text-lg font-semibold text-slate-900">{formatCurrency(totalOperatingCosts)}</span>
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
                    <p className="text-sm font-medium text-slate-500">Gross Margin ({marginPercent}%)</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">
                      {formatCurrency(grossMargin)}
                    </p>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <div className="mt-4 w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.min(Math.max(marginPercent, 0), 100)}%` }}></div>
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
                      formatter={(value: number) => formatCurrency(value)}
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={
                          entry.name === 'Total Revenue' ? '#3b82f6' : 
                          entry.name === 'Total Operating Costs' ? '#f59e0b' : 
                          (entry.value >= 0 ? '#10b981' : '#ef4444')
                        } />
                      ))}
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
