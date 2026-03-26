import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Watchlist from './Watchlist';
import { useTrading } from '../context/TradingContext';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, TrendingUp, ShieldAlert } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const Layout: React.FC = () => {
  const { user, isAuthReady, alerts, setIsNewStrategyModalOpen, role } = useTrading();
  const location = useLocation();
  const isReadOnly = role === 'read-only';

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const PAGE: Record<string, [string, string]> = {
    '/':             ['Trading Overview',    'Real-time monitoring of your quantitative strategies.'],
    '/strategies':   ['Strategy Management', 'Configure and deploy your algorithmic trading bots.'],
    '/backtest':     ['Backtesting Engine',  'Test your strategies against historical market data.'],
    '/history':      ['Trade History',       'Review past performance and execution logs.'],
    '/risk':         ['Risk Management',     'Institutional-grade risk management tools.'],
    '/subscription': ['Premium Plans',       'Upgrade your trading with premium features.'],
    '/wallet':       ['M-Pesa Wallet',        'Securely deposit and withdraw funds via M-Pesa.'],
    '/settings':     ['Settings',            'Manage account preferences and configurations.'],
  };
  const [title, desc] = PAGE[location.pathname] ?? ['QuantBot Pro', ''];

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <Sidebar />

      {/* Toast alerts */}
      <div className="fixed top-24 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {alerts.map(alert => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={cn(
                'pointer-events-auto p-4 rounded-2xl shadow-xl border backdrop-blur-md flex items-center gap-4 min-w-[300px]',
                alert.type === 'TP'
                  ? 'bg-emerald-50/90 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50/90 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300',
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                alert.type === 'TP' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900 text-rose-600',
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
            <h2 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{title}</h2>
            <p className="mt-1" style={{ color: 'var(--text-muted)' }}>{desc}</p>
          </div>
          {location.pathname === '/strategies' && (
            <button
              onClick={() => !isReadOnly && setIsNewStrategyModalOpen(true)}
              disabled={isReadOnly}
              className={cn('btn-primary', isReadOnly && 'opacity-50 cursor-not-allowed')}
            >
              <Plus size={20} /> New Strategy
            </button>
          )}
        </header>
        <Outlet />
      </main>

      <Watchlist />
    </div>
  );
};

export default Layout;