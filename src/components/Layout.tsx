import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Watchlist from './Watchlist';
import { useTrading } from '../context/TradingContext';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, TrendingUp, ShieldAlert } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Layout: React.FC = () => {
  const { user, isAuthReady, marketData, alerts, setIsNewStrategyModalOpen, role } = useTrading();
  const location = useLocation();
  const isReadOnly = role === 'read-only';

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Trading Overview';
      case '/strategies': return 'Strategy Management';
      case '/backtest': return 'Backtesting Engine';
      case '/history': return 'Trade History';
      case '/risk': return 'Risk Management';
      case '/subscription': return 'Premium Plans';
      case '/wallet': return 'M-Pesa Wallet';
      default: return 'QuantBot Pro';
    }
  };

  const getPageDesc = () => {
    switch (location.pathname) {
      case '/': return 'Real-time monitoring of your quantitative strategies.';
      case '/strategies': return 'Configure and deploy your algorithmic trading bots.';
      case '/backtest': return 'Test your strategies against historical market data.';
      case '/history': return 'Review past performance and execution logs.';
      case '/risk': return 'Institutional-grade risk management tools.';
      case '/subscription': return 'Upgrade your trading with premium features.';
      case '/wallet': return 'Securely deposit and withdraw funds via M-Pesa.';
      default: return 'Institutional-grade algorithmic trading';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      
      {/* Alerts Overlay */}
      <div className="fixed top-24 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {alerts.map(alert => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={cn(
                "pointer-events-auto p-4 rounded-2xl shadow-xl border backdrop-blur-md flex items-center gap-4 min-w-[300px]",
                alert.type === 'TP' ? "bg-emerald-50/90 border-emerald-200 text-emerald-800" : "bg-rose-50/90 border-rose-200 text-rose-800"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                alert.type === 'TP' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
              )}>
                {alert.type === 'TP' ? <TrendingUp size={20} /> : <ShieldAlert size={20} />}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">
                  {alert.type === 'TP' ? 'Take Profit Alert' : 'Stop Loss Alert'}
                </p>
                <p className="text-sm font-bold leading-tight">{alert.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">{getPageTitle()}</h2>
            <p className="text-slate-500 mt-1">{getPageDesc()}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right mr-4">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Live BTC Price</p>
              <p className="text-xl font-mono font-bold text-primary">
                ${marketData['btc']?.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            {location.pathname === '/strategies' && (
              <button 
                onClick={() => !isReadOnly && setIsNewStrategyModalOpen(true)}
                disabled={isReadOnly}
                className={cn(
                  "btn-primary flex items-center gap-2",
                  isReadOnly && "opacity-50 cursor-not-allowed"
                )}
              >
                <Plus size={20} /> New Strategy
              </button>
            )}
          </div>
        </header>

        <Outlet />
      </main>

      <Watchlist />
    </div>
  );
};

export default Layout;
