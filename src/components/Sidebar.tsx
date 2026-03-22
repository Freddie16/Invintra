import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  History, 
  Settings, 
  Activity, 
  BarChart3, 
  ShieldAlert, 
  Zap, 
  Crown,
  ShieldCheck,
  LogOut,
  Wallet as WalletIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTrading } from '../context/TradingContext';
import { logout } from '../firebase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Sidebar: React.FC = () => {
  const { isSubscribed, isSuperAdmin, userProfile } = useTrading();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Activity, label: 'Strategies', path: '/strategies' },
    { icon: BarChart3, label: 'Backtest', path: '/backtest', premium: true },
    { icon: History, label: 'Trade History', path: '/history' },
    { icon: WalletIcon, label: 'Wallet', path: '/wallet' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: ShieldAlert, label: 'Risk Management', path: '/risk', premium: true },
  ];

  return (
    <aside className="w-80 bg-white border-r border-slate-100 flex flex-col h-screen sticky top-0">
      <div className="p-8 flex items-center gap-4">
        <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
          <ShieldCheck size={28} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">QuantBot Pro</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">v2.5.0 Stable</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center justify-between p-4 rounded-2xl transition-all group",
              isActive 
                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon size={20} className={cn("transition-transform group-hover:scale-110")} />
              <span className="font-bold text-sm">{item.label}</span>
            </div>
            {item.premium && !isSubscribed && (
              <Zap size={14} className="text-amber-500 fill-amber-500" />
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 space-y-4">
        {/* Subscription Status Card */}
        <NavLink to="/subscription" className="block">
          <div className={cn(
            "p-4 rounded-2xl border transition-all hover:scale-[1.02]",
            isSubscribed 
              ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
              : "bg-amber-50 border-amber-100 text-amber-800"
          )}>
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                "p-2 rounded-xl",
                isSubscribed ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
              )}>
                {isSuperAdmin ? <Crown size={16} /> : <Zap size={16} />}
              </div>
              <span className="text-xs font-bold uppercase tracking-widest">
                {isSuperAdmin ? 'Super Admin' : isSubscribed ? 'Pro Plan Active' : 'Free Plan'}
              </span>
            </div>
            {!isSubscribed && (
              <p className="text-[10px] font-medium opacity-80 leading-relaxed">
                Upgrade to Pro to unlock advanced backtesting and risk tools.
              </p>
            )}
          </div>
        </NavLink>

        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white overflow-hidden">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.uid}`} alt="Avatar" />
            </div>
            <div className="max-w-[120px]">
              <p className="text-xs font-bold text-slate-900 truncate">{userProfile?.displayName}</p>
              <p className="text-[10px] text-slate-400 truncate">{userProfile?.email}</p>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
