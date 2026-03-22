import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Settings, Plus, ArrowLeft, TrendingUp, ArrowUpRight, ArrowDownRight, ShieldAlert, Target, Bell, Trash2 } from 'lucide-react';
import { useTrading, StrategyMetrics } from '../context/TradingContext';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { updateDoc, doc, addDoc, collection } from 'firebase/firestore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Strategy, Trade, AlertTriggerType } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StrategyCardProps {
  strategy: Strategy;
  metrics?: StrategyMetrics;
  trades: Trade[];
  onSelect: () => void;
  onToggle: (id: string, current: boolean) => void;
  onSettings: (s: Strategy) => void;
  isReadOnly: boolean;
  isComparing: boolean;
  onCompareToggle: (id: string) => void;
}

const StrategyCard: React.FC<StrategyCardProps> = ({ 
  strategy, 
  metrics, 
  trades,
  onSelect, 
  onToggle, 
  onSettings,
  isReadOnly,
  isComparing,
  onCompareToggle
}) => {
  const currentPnL = metrics?.pnl !== undefined ? metrics.pnl : strategy.pnl;
  const currentWinRate = metrics?.winRate !== undefined ? metrics.winRate : strategy.winRate;
  const currentTradesCount = metrics?.tradesCount !== undefined ? metrics.tradesCount : strategy.tradesCount;

  const strategyTrades = trades.filter(t => t.strategyId === strategy.id && t.status === 'CLOSED')
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  let cumulativePnL = 0;
  const trendData = strategyTrades.length > 0 
    ? strategyTrades.map(t => {
        cumulativePnL += (t.pnl || 0);
        return { val: cumulativePnL };
      })
    : [{ val: 0 }, { val: 0 }];

  return (
    <div 
      onClick={onSelect}
      className="glass-card p-6 space-y-6 cursor-pointer hover:border-primary/30 transition-all group"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onCompareToggle(strategy.id);
            }}
            className={cn(
              "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
              isComparing ? "bg-primary border-primary text-white" : "border-slate-200 hover:border-primary/50"
            )}
          >
            {isComparing && <Plus size={14} className="rotate-45" />}
          </div>
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center relative", 
            strategy.isActive ? "bg-primary-light text-primary" : "bg-slate-100 text-slate-400"
          )}>
            <Activity size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{strategy.name}</h3>
            <p className="text-xs text-slate-500">{strategy.assetId?.toUpperCase() || 'BTC'} • ID: {strategy.id}</p>
          </div>
        </div>
        <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", strategy.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400")}>
          {strategy.isActive ? 'Running' : 'Paused'}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-slate-50 rounded-xl relative overflow-hidden">
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Live PnL</p>
          <AnimatePresence mode="wait">
            <motion.p 
              key={currentPnL}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "text-lg font-bold", 
                currentPnL >= 0 ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {currentPnL >= 0 ? '+' : ''}{currentPnL.toFixed(2)}%
            </motion.p>
          </AnimatePresence>
          {strategy.isActive && (
            <motion.div 
              layoutId={`pulse-${strategy.id}`}
              className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>
        <div className="p-3 bg-slate-50 rounded-xl">
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Win Rate</p>
          <p className="text-lg font-bold">{currentWinRate}%</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl">
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Trades</p>
          <p className="text-lg font-bold">{currentTradesCount}</p>
        </div>
      </div>

      {/* Sparkline P&L Chart */}
      <div className="space-y-2">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">P&L Trend</p>
        <div className="h-16 w-full opacity-60 group-hover:opacity-100 transition-opacity">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <Line 
                type="monotone" 
                dataKey="val" 
                stroke={currentPnL >= 0 ? "#10B981" : "#F43F5E"} 
                strokeWidth={2} 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-500 uppercase">Risk Limit</span>
            <span>${strategy.riskLimit}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: '65%' }} />
          </div>
        </div>
        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span>SL: {strategy.stopLoss}%</span>
          <span>TP: {strategy.takeProfit}%</span>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (!isReadOnly) onToggle(strategy.id, strategy.isActive);
          }}
          disabled={isReadOnly}
          className={cn(
            "flex-1 py-3 rounded-xl font-bold text-sm transition-all",
            isReadOnly ? "bg-slate-100 text-slate-400 cursor-not-allowed" :
            strategy.isActive ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
          )}
        >
          {strategy.isActive ? 'Stop Bot' : 'Start Bot'}
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (!isReadOnly) onSettings(strategy);
          }}
          disabled={isReadOnly}
          className={cn(
            "p-3 rounded-xl transition-all",
            isReadOnly ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          )}
        >
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
};

const Strategies: React.FC = () => {
  const { 
    strategies, 
    trades, 
    liveMetrics, 
    user, 
    assets, 
    strategyAlerts, 
    createStrategyAlert, 
    deleteStrategyAlert, 
    role,
    userProfile,
    isNewStrategyModalOpen,
    setIsNewStrategyModalOpen
  } = useTrading();
  const isReadOnly = role === 'read-only';
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [newStrategy, setNewStrategy] = useState({ 
    name: '', 
    riskLimit: 500, 
    stopLoss: userProfile?.defaultStopLoss || 2, 
    takeProfit: userProfile?.defaultTakeProfit || 5, 
    assetId: 'btc' 
  });

  // Update newStrategy defaults when userProfile loads
  useEffect(() => {
    if (userProfile) {
      setNewStrategy(prev => ({
        ...prev,
        stopLoss: userProfile.defaultStopLoss || 2,
        takeProfit: userProfile.defaultTakeProfit || 5
      }));
    }
  }, [userProfile]);
  const [newAlert, setNewAlert] = useState({ triggerType: 'PNL_ABOVE' as AlertTriggerType, threshold: 5, message: '' });

  const toggleStrategy = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'strategies', id), {
        isActive: !currentStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `strategies/${id}`);
    }
  };

  const updateStrategySettings = async (id: string, sl: number, tp: number) => {
    try {
      await updateDoc(doc(db, 'strategies', id), {
        stopLoss: sl,
        takeProfit: tp
      });
      setIsSettingsModalOpen(false);
      setEditingStrategy(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `strategies/${id}`);
    }
  };

  const handleAddStrategy = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'strategies'), {
        ...newStrategy,
        isActive: false,
        pnl: 0,
        winRate: 0,
        tradesCount: 0,
        userId: user.uid
      });
      setIsNewStrategyModalOpen(false);
      setNewStrategy({ 
        name: '', 
        riskLimit: 500, 
        stopLoss: userProfile?.defaultStopLoss || 2, 
        takeProfit: userProfile?.defaultTakeProfit || 5, 
        assetId: 'btc' 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'strategies');
    }
  };

  const toggleCompare = (id: string) => {
    setCompareIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getComparisonData = () => {
    if (compareIds.length === 0) return [];
    
    // Get all unique timestamps from trades of selected strategies
    const selectedTrades = trades.filter(t => compareIds.includes(t.strategyId) && t.status === 'CLOSED');
    const timestamps = Array.from(new Set(selectedTrades.map(t => t.timestamp))).sort();
    
    let cumulativePnL: Record<string, number> = {};
    compareIds.forEach(id => cumulativePnL[id] = 0);
    
    return timestamps.map((ts: string) => {
      const data: any = { time: format(new Date(ts), 'MM/dd HH:mm') };
      compareIds.forEach(id => {
        const trade = selectedTrades.find(t => t.strategyId === id && t.timestamp === ts);
        if (trade) {
          cumulativePnL[id] += (trade.pnl || 0);
        }
        data[id] = Number(cumulativePnL[id].toFixed(2));
      });
      return data;
    });
  };

  const comparisonData = getComparisonData();
  const colors = ['#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];

  if (selectedStrategyId) {
    const strategy = strategies.find(s => s.id === selectedStrategyId);
    if (!strategy) return null;
    const strategyTrades = trades.filter(t => t.strategyId === strategy.id);
    const currentStrategyAlerts = strategyAlerts.filter(a => a.strategyId === strategy.id);

    const closedTrades = strategyTrades.filter(t => t.status === 'CLOSED')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let cumulativePnL = 0;
    const chartData = closedTrades.length > 0 
      ? closedTrades.map(t => {
          cumulativePnL += (t.pnl || 0);
          return { 
            time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
            pnl: Number(cumulativePnL.toFixed(2)) 
          };
        })
      : [{ time: 'Start', pnl: 0 }, { time: 'Now', pnl: 0 }];

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedStrategyId(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{strategy.name}</h2>
              <p className="text-sm text-slate-500">Detailed performance analysis and execution parameters</p>
            </div>
          </div>
          <button 
            onClick={() => !isReadOnly && setIsAlertModalOpen(true)}
            disabled={isReadOnly}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all",
              isReadOnly ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-primary-light text-primary hover:bg-primary/20"
            )}
          >
            <Bell size={18} />
            Configure Alerts
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-6">Historical PnL Performance</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="detailPnL" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="time" hide />
                    <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(val) => `${val}%`} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="pnl" stroke="#7C3AED" strokeWidth={3} fill="url(#detailPnL)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-6">Active Strategy Alerts</h3>
              <div className="space-y-4">
                {currentStrategyAlerts.map(alert => (
                  <div key={alert.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary-light text-primary rounded-xl">
                        <Bell size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{alert.triggerType.replace('_', ' ')} {alert.threshold !== undefined ? `${alert.threshold}%` : ''}</p>
                        <p className="text-xs text-slate-500">{alert.message}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => !isReadOnly && deleteStrategyAlert(alert.id)}
                      disabled={isReadOnly}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        isReadOnly ? "text-slate-300 cursor-not-allowed" : "text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                      )}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {currentStrategyAlerts.length === 0 && (
                  <div className="text-center py-8 text-slate-400 italic">
                    No active alerts for this strategy.
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-6">Recent Strategy Executions</h3>
              <div className="space-y-4">
                {strategyTrades.slice(0, 5).map(trade => (
                  <div key={trade.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-2 rounded-xl", trade.type === 'BUY' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600")}>
                        {trade.type === 'BUY' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{trade.symbol}</p>
                        <p className="text-xs text-slate-500">{format(new Date(trade.timestamp), 'MMM dd, HH:mm:ss')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold">${trade.entryPrice.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qty: {trade.quantity}</p>
                    </div>
                  </div>
                ))}
                {strategyTrades.length === 0 && <p className="text-center py-8 text-slate-400 italic">No trades recorded for this strategy.</p>}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-6">Performance Metrics</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={18} /></div>
                    <span className="text-sm font-medium text-slate-600">Current PnL</span>
                  </div>
                  <span className={cn("font-bold", (liveMetrics[strategy.id]?.pnl ?? strategy.pnl) >= 0 ? "text-emerald-600" : "text-rose-600")}>
                    {(liveMetrics[strategy.id]?.pnl ?? strategy.pnl) >= 0 ? '+' : ''}{(liveMetrics[strategy.id]?.pnl ?? strategy.pnl ?? 0).toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-light text-primary rounded-lg"><Activity size={18} /></div>
                    <span className="text-sm font-medium text-slate-600">Win Rate</span>
                  </div>
                  <span className="font-bold text-slate-900">{liveMetrics[strategy.id]?.winRate ?? strategy.winRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 text-slate-600 rounded-lg"><Activity size={18} /></div>
                    <span className="text-sm font-medium text-slate-600">Total Trades</span>
                  </div>
                  <span className="font-bold text-slate-900">{liveMetrics[strategy.id]?.tradesCount ?? strategy.tradesCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Comparison Section */}
      <AnimatePresence>
        {compareIds.length > 1 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-8 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Strategy Comparison</h2>
                  <p className="text-sm text-slate-500">Comparing cumulative PnL trends for {compareIds.length} strategies</p>
                </div>
              </div>
              <button 
                onClick={() => setCompareIds([])}
                className="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-sm transition-all"
              >
                Clear Selection
              </button>
            </div>
            
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="time" stroke="#94A3B8" fontSize={12} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={12} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  {compareIds.map((id, index) => (
                    <Line 
                      key={id}
                      type="monotone" 
                      dataKey={id} 
                      name={strategies.find(s => s.id === id)?.name || id}
                      stroke={colors[index % colors.length]} 
                      strokeWidth={3} 
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {strategies.map(s => (
          <StrategyCard 
            key={s.id} 
            strategy={s} 
            metrics={liveMetrics[s.id]} 
            trades={trades}
            onSelect={() => setSelectedStrategyId(s.id)}
            onToggle={toggleStrategy}
            onSettings={(strat) => {
              setEditingStrategy(strat);
              setIsSettingsModalOpen(true);
            }}
            isReadOnly={isReadOnly}
            isComparing={compareIds.includes(s.id)}
            onCompareToggle={toggleCompare}
          />
        ))}
        <button 
          onClick={() => !isReadOnly && setIsNewStrategyModalOpen(true)}
          disabled={isReadOnly}
          className={cn(
            "border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-slate-400 transition-all group min-h-[300px]",
            isReadOnly ? "bg-slate-50/50 cursor-not-allowed" : "hover:border-primary hover:text-primary"
          )}
        >
          <div className={cn(
            "w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center transition-colors",
            !isReadOnly && "group-hover:bg-primary-light"
          )}>
            <Plus size={32} />
          </div>
          <span className="font-bold">Add New Strategy</span>
        </button>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsModalOpen && editingStrategy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSettingsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary-light text-primary rounded-xl"><Settings size={24} /></div>
                <div>
                  <h3 className="text-xl font-bold">Strategy Settings</h3>
                  <p className="text-xs text-slate-500">{editingStrategy.name}</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Stop Loss (%)</label>
                    <div className="relative">
                      <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400" size={16} />
                      <input type="number" value={editingStrategy.stopLoss} onChange={(e) => setEditingStrategy({ ...editingStrategy, stopLoss: parseFloat(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Take Profit (%)</label>
                    <div className="relative">
                      <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" size={16} />
                      <input type="number" value={editingStrategy.takeProfit} onChange={(e) => setEditingStrategy({ ...editingStrategy, takeProfit: parseFloat(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setIsSettingsModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
                  <button onClick={() => updateStrategySettings(editingStrategy.id, editingStrategy.stopLoss || 2, editingStrategy.takeProfit || 5)} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all">Save Changes</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Alert Configuration Modal */}
      <AnimatePresence>
        {isAlertModalOpen && selectedStrategyId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAlertModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary-light text-primary rounded-xl"><Bell size={24} /></div>
                <h3 className="text-xl font-bold">Configure Alert</h3>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Trigger Type</label>
                  <select 
                    value={newAlert.triggerType} 
                    onChange={(e) => setNewAlert({ ...newAlert, triggerType: e.target.value as AlertTriggerType })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold"
                  >
                    <option value="PNL_ABOVE">PnL Above Threshold</option>
                    <option value="PNL_BELOW">PnL Below Threshold</option>
                    <option value="TRADE_OPEN">New Trade Opened</option>
                    <option value="TRADE_CLOSE">Trade Closed</option>
                  </select>
                </div>
                {(newAlert.triggerType === 'PNL_ABOVE' || newAlert.triggerType === 'PNL_BELOW') && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">PnL Threshold (%)</label>
                    <input 
                      type="number" 
                      value={newAlert.threshold} 
                      onChange={(e) => setNewAlert({ ...newAlert, threshold: parseFloat(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Alert Message</label>
                  <input 
                    type="text" 
                    value={newAlert.message} 
                    onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                    placeholder="e.g. Target reached! Check dashboard."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setIsAlertModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
                  <button 
                    onClick={() => {
                      createStrategyAlert({ ...newAlert, strategyId: selectedStrategyId });
                      setIsAlertModalOpen(false);
                      setNewAlert({ triggerType: 'PNL_ABOVE', threshold: 5, message: '' });
                    }} 
                    className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
                  >
                    Create Alert
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Strategy Modal */}
      <AnimatePresence>
        {isNewStrategyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNewStrategyModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">Create New Strategy</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Strategy Name</label>
                      <p className="text-[10px] text-slate-400 mb-2 leading-tight">A unique name to identify your strategy in the dashboard.</p>
                      <input type="text" value={newStrategy.name} onChange={(e) => setNewStrategy({ ...newStrategy, name: e.target.value })} placeholder="e.g. Trend Follower Alpha" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Target Asset</label>
                      <p className="text-[10px] text-slate-400 mb-2 leading-tight">The financial instrument this strategy will monitor and trade.</p>
                      <select 
                        value={newStrategy.assetId} 
                        onChange={(e) => setNewStrategy({ ...newStrategy, assetId: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold"
                      >
                        {assets.map(asset => (
                          <option key={asset.id} value={asset.id}>{asset.name} ({asset.symbol})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Risk Limit (USD)</label>
                      <p className="text-[10px] text-slate-400 mb-2 leading-tight">Maximum capital allocated per trade execution.</p>
                      <input type="number" value={newStrategy.riskLimit} onChange={(e) => setNewStrategy({ ...newStrategy, riskLimit: parseInt(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Stop Loss (%)</label>
                      <p className="text-[10px] text-slate-400 mb-2 leading-tight">Auto-close trade if price drops by this % to limit losses.</p>
                      <input type="number" value={newStrategy.stopLoss} onChange={(e) => setNewStrategy({ ...newStrategy, stopLoss: parseInt(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Take Profit (%)</label>
                      <p className="text-[10px] text-slate-400 mb-2 leading-tight">Auto-close trade if price gains this % to secure profits.</p>
                      <input type="number" value={newStrategy.takeProfit} onChange={(e) => setNewStrategy({ ...newStrategy, takeProfit: parseInt(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button onClick={() => setIsNewStrategyModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">Cancel</button>
                  <button onClick={handleAddStrategy} className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all">Deploy Strategy</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Strategies;
