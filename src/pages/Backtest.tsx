import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, BarChart3, Zap, ShieldAlert, Target, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PremiumOverlay = () => (
  <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center rounded-3xl border-2 border-dashed border-primary/20">
    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-200/50">
      <Zap size={32} fill="currentColor" />
    </div>
    <h3 className="text-2xl font-bold text-slate-900 mb-2">Premium Feature</h3>
    <p className="text-slate-500 max-w-sm mb-8">
      Unlock the high-performance backtesting engine to validate your strategies against historical market data.
    </p>
    <button className="btn-primary px-8 py-4 shadow-xl shadow-primary/20">
      Upgrade to Pro
    </button>
  </div>
);

const Backtest: React.FC = () => {
  const { isSubscribed } = useTrading();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runBacktest = () => {
    setIsRunning(true);
    setTimeout(() => {
      setResults({
        equityCurve: Array.from({ length: 50 }).map((_, i) => ({ time: i, equity: 10000 + Math.random() * 2000 + i * 100 })),
        metrics: {
          totalReturn: '24.5%',
          maxDrawdown: '8.2%',
          sharpeRatio: '2.1',
          winRate: '68%',
          profitFactor: '1.8'
        }
      });
      setIsRunning(false);
    }, 2000);
  };

  return (
    <div className="relative min-h-[600px] space-y-8">
      {!isSubscribed && <PremiumOverlay />}
      
      <div className={cn("space-y-8", !isSubscribed && "opacity-20 pointer-events-none")}>
        <div className="glass-card p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Strategy</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>Trend Follower Alpha</option>
                <option>Mean Reversion Beta</option>
                <option>Scalping Gamma</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Timeframe</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
                <option>Last 1 Year</option>
                <option>Custom Range</option>
              </select>
            </div>
            <button 
              onClick={runBacktest}
              disabled={isRunning}
              className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
            >
              {isRunning ? 'Running Simulation...' : <><Play size={20} /> Start Backtest</>}
            </button>
          </div>
        </div>

        {results && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {Object.entries(results.metrics).map(([key, val]: [string, any]) => (
                <div key={key} className="glass-card p-4 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{key.replace(/([A-Z])/g, ' $1')}</p>
                  <p className="text-xl font-bold text-slate-900">{val}</p>
                </div>
              ))}
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-6">Simulated Equity Curve</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={results.equityCurve}>
                    <defs>
                      <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="time" hide />
                    <YAxis stroke="#94A3B8" fontSize={12} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val.toLocaleString()}`} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="equity" stroke="#7C3AED" strokeWidth={3} fill="url(#equityGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Backtest;
