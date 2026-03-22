import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Zap, Activity, Target, ShieldCheck, AlertCircle } from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PremiumOverlay = () => (
  <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center rounded-3xl border-2 border-dashed border-primary/20">
    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-200/50">
      <ShieldAlert size={32} fill="currentColor" />
    </div>
    <h3 className="text-2xl font-bold text-slate-900 mb-2">Premium Feature</h3>
    <p className="text-slate-500 max-w-sm mb-8">
      Unlock institutional-grade risk management tools, including portfolio stress testing and automated emergency protocols.
    </p>
    <button className="btn-primary px-8 py-4 shadow-xl shadow-primary/20">
      Upgrade to Pro
    </button>
  </div>
);

const RiskManagement: React.FC = () => {
  const { isSubscribed } = useTrading();

  const riskData = [
    { name: 'Strategy A', value: 35, color: '#7C3AED' },
    { name: 'Strategy B', value: 25, color: '#8B5CF6' },
    { name: 'Strategy C', value: 20, color: '#A78BFA' },
    { name: 'Cash Reserve', value: 20, color: '#C4B5FD' },
  ];

  return (
    <div className="relative min-h-[600px] space-y-8">
      {!isSubscribed && <PremiumOverlay />}
      
      <div className={cn("space-y-8", !isSubscribed && "opacity-20 pointer-events-none")}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-6">Portfolio Risk Allocation</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-6">Active Risk Protocols</h3>
              <div className="space-y-4">
                {[
                  { title: 'Volatility Protection', status: 'Active', desc: 'Automatically reduces position size during high market volatility.', icon: Activity, color: 'emerald' },
                  { title: 'Drawdown Limiter', status: 'Active', desc: 'Pauses all strategies if daily drawdown exceeds 5%.', icon: ShieldAlert, color: 'emerald' },
                  { title: 'Correlation Guard', status: 'Warning', desc: 'High correlation detected between Strategy A and Strategy B.', icon: AlertCircle, color: 'amber' },
                ].map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-2 rounded-xl", p.color === 'emerald' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600")}>
                        <p.icon size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{p.title}</p>
                        <p className="text-xs text-slate-500">{p.desc}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      p.color === 'emerald' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="glass-card p-6 border-2 border-rose-100 bg-rose-50/30">
              <div className="flex items-center gap-3 text-rose-600 mb-6">
                <ShieldAlert size={24} />
                <h3 className="text-lg font-bold">Emergency Controls</h3>
              </div>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                In case of extreme market conditions or system failure, use the emergency kill switch to immediately close all open positions and pause all active strategies.
              </p>
              <button className="w-full py-4 bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all flex items-center justify-center gap-2 group">
                <ShieldAlert size={20} className="group-hover:scale-110 transition-transform" />
                Emergency Kill Switch
              </button>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-6">Risk Metrics Summary</h3>
              <div className="space-y-4">
                {[
                  { label: 'Value at Risk (VaR)', value: '$12,450', detail: '95% Confidence' },
                  { label: 'Expected Shortfall', value: '$18,200', detail: 'Tail Risk' },
                  { label: 'Beta to BTC', value: '1.24', detail: 'Market Sensitivity' },
                  { label: 'Sharpe Ratio', value: '2.1', detail: 'Risk-Adjusted Return' },
                ].map((m, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{m.label}</p>
                      <p className="text-[10px] text-slate-400">{m.detail}</p>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{m.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskManagement;
