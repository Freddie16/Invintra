import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Activity, Zap, ShieldAlert, Star, Wallet, X, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { useTrading, StrategyMetrics } from '../context/TradingContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Strategy } from '../types';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const StatCard = ({ title, value, change, icon: Icon, isPositive }: {
  title: string; value: string | number; change: string; icon: any; isPositive: boolean;
}) => (
  <div className="glass-card p-6 space-y-4">
    <div className="flex justify-between items-start">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
        <Icon size={24} />
      </div>
      <div className={cn('px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1',
        isPositive ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600'
      )}>
        {isPositive ? '+' : '-'}{change}%
      </div>
    </div>
    <div>
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{title}</p>
      <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text)' }}>{value}</p>
    </div>
  </div>
);

const TradeModal = ({ isOpen, onClose, asset, strategies, onConfirm }: {
  isOpen: boolean; onClose: () => void; asset: any; strategies: Strategy[];
  onConfirm: (strategy: Strategy, type: 'BUY' | 'SELL') => void;
}) => {
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(strategies[0]?.id || '');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');

  const selectedStrategy = strategies.find(s => s.id === selectedStrategyId);
  if (!isOpen || !asset) return null;

  const quantity       = selectedStrategy ? (selectedStrategy.riskLimit / (asset.currentPrice || 1)).toFixed(4) : '0';
  const potentialProfit = selectedStrategy ? (selectedStrategy.riskLimit * (selectedStrategy.takeProfit / 100)).toFixed(2) : '0';
  const potentialLoss   = selectedStrategy ? (selectedStrategy.riskLimit * (selectedStrategy.stopLoss   / 100)).toFixed(2) : '0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="p-6 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div>
            <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Confirm Trade</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Review execution details before confirming</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl transition-all" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Asset info */}
          <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-xs">
                {asset.symbol?.substring(0, 3)}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{asset.name}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{asset.symbol}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>${asset.currentPrice?.toLocaleString()}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Current Price</p>
            </div>
          </div>

          {/* Strategy */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-muted)' }}>Select Strategy</label>
            <select
              value={selectedStrategyId}
              onChange={e => setSelectedStrategyId(e.target.value)}
              className="w-full p-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* BUY / SELL */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setTradeType('BUY')}
              className={cn('py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 border-2',
                tradeType === 'BUY' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-600' : 'border-transparent hover:opacity-80'
              )}
              style={tradeType !== 'BUY' ? { background: 'var(--surface-2)', color: 'var(--text-muted)' } : {}}
            >
              <ArrowUpRight size={18} /> BUY
            </button>
            <button
              onClick={() => setTradeType('SELL')}
              className={cn('py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 border-2',
                tradeType === 'SELL' ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600' : 'border-transparent hover:opacity-80'
              )}
              style={tradeType !== 'SELL' ? { background: 'var(--surface-2)', color: 'var(--text-muted)' } : {}}
            >
              <ArrowDownRight size={18} /> SELL
            </button>
          </div>

          {/* Summary */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            {[
              ['Quantity',   `${quantity} ${asset.symbol}`],
              ['Risk Limit', `$${selectedStrategy?.riskLimit}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{v}</span>
              </div>
            ))}
            <div className="pt-2 flex justify-between items-center" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                Est. Profit (TP) <Info size={12} style={{ color: 'var(--text-dim)' }} />
              </span>
              <span className="text-sm font-bold text-emerald-600">+${potentialProfit}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                Est. Loss (SL) <Info size={12} style={{ color: 'var(--text-dim)' }} />
              </span>
              <span className="text-sm font-bold text-rose-600">-${potentialLoss}</span>
            </div>
          </div>
        </div>

        <div className="p-6 flex gap-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl font-bold text-sm transition-all"
            style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => selectedStrategy && onConfirm(selectedStrategy, tradeType)}
            className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
          >
            Confirm {tradeType}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { marketData, strategies, liveMetrics, assets, userProfile, toggleFavorite, executeTrade, role } = useTrading();
  const isReadOnly = role === 'read-only';
  const [selectedAssetId, setSelectedAssetId] = useState('btc');
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

  const metricsList          = Object.values(liveMetrics) as StrategyMetrics[];
  const activeStrategiesCount = strategies.filter(s => s.isActive).length;
  const totalPnL             = metricsList.reduce((acc, m) => acc + m.pnl, 0);
  const totalTrades          = metricsList.reduce((acc, m) => acc + m.tradesCount, 0);
  const avgWinRate           = strategies.length > 0
    ? Math.round(metricsList.reduce((acc, m) => acc + m.winRate, 0) / strategies.length)
    : 0;

  const selectedAsset   = assets.find(a => a.id === selectedAssetId) || assets[0];
  const chartData       = marketData[selectedAssetId]?.history || [];
  const assetStrategies = strategies.filter(s => s.assetId === selectedAssetId);

  if (assets.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto animate-pulse" style={{ background: 'var(--surface-2)' }}>
            <Activity size={32} style={{ color: 'var(--text-dim)' }} />
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Loading market data...</p>
        </div>
      </div>
    );
  }

  const handleManualTrade = async (strategy: Strategy, type: 'BUY' | 'SELL') => {
    await executeTrade(strategy, type, selectedAsset.currentPrice);
    setIsTradeModalOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total PnL"      value={`${totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}%`} change="8.2" icon={TrendingUp}  isPositive={totalPnL >= 0} />
        <StatCard title="Wallet Balance" value={`KES ${userProfile?.balance?.toLocaleString() || '0'}`}    change="0"   icon={Wallet}     isPositive={true} />
        <StatCard title="Total Trades"   value={totalTrades}                                               change="12.5" icon={Zap}        isPositive={true} />
        <StatCard title="Avg Win Rate"   value={`${avgWinRate}%`}                                          change="2.1" icon={ShieldAlert} isPositive={avgWinRate > 50} />
      </div>

      {/* Active strategies */}
      {activeStrategiesCount > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Activity className="text-primary" size={20} />
              <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Active Strategy Monitoring</h3>
            </div>
            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-widest">
              {activeStrategiesCount} Running
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {strategies.filter(s => s.isActive).map(strategy => {
              const metrics = liveMetrics[strategy.id];
              const asset   = assets.find(a => a.id === strategy.assetId);
              return (
                <div key={strategy.id} className="p-4 rounded-2xl space-y-4 relative overflow-hidden group"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500 animate-pulse" />
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h4 className="text-sm font-bold group-hover:text-primary transition-colors" style={{ color: 'var(--text)' }}>{strategy.name}</h4>
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-tighter pl-4" style={{ color: 'var(--text-muted)' }}>{asset?.symbol}</p>
                    </div>
                    <div className={cn('px-2 py-1 rounded-lg text-[10px] font-bold',
                      (metrics?.pnl || 0) >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                    )}>
                      {(metrics?.pnl || 0) >= 0 ? '+' : ''}{(metrics?.pnl || 0).toFixed(2)}%
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Win Rate</p>
                      <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{metrics?.winRate || 0}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Trades</p>
                      <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{metrics?.tradesCount || 0}</p>
                    </div>
                  </div>
                  <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${metrics?.winRate || 0}%` }}
                      className="h-full rounded-full"
                      style={{ background: (metrics?.winRate || 0) > 50 ? '#10B981' : '#F59E0B' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Chart */}
        <div className="lg:col-span-3 glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{selectedAsset?.name} Performance</h3>
              <button
                onClick={() => toggleFavorite(selectedAssetId)}
                className="p-2 rounded-xl transition-all"
                style={{ color: userProfile?.favorites?.includes(selectedAssetId) ? '#F59E0B' : 'var(--text-dim)' }}
              >
                <Star size={20} fill={userProfile?.favorites?.includes(selectedAssetId) ? 'currentColor' : 'none'} />
              </button>
            </div>
            <div className="flex gap-3">
              <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                {['1H', '1D', '1W', '1M'].map(t => (
                  <button key={t} className="px-3 py-1 text-xs font-bold rounded-lg transition-all hover:opacity-80"
                    style={{ color: 'var(--text-muted)' }}>{t}</button>
                ))}
              </div>
              <button
                onClick={() => !isReadOnly && setIsTradeModalOpen(true)}
                disabled={assetStrategies.length === 0 || isReadOnly}
                className={cn('px-6 py-2 rounded-xl font-bold text-sm transition-all shadow-lg',
                  (assetStrategies.length > 0 && !isReadOnly)
                    ? 'bg-primary text-white hover:bg-primary-dark shadow-primary/20'
                    : 'cursor-not-allowed opacity-40'
                )}
                style={(assetStrategies.length === 0 || isReadOnly) ? { background: 'var(--surface-2)', color: 'var(--text-muted)' } : {}}
              >
                Trade {selectedAsset?.symbol || ''}
              </button>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="time" hide />
                <YAxis domain={['auto','auto']} stroke="var(--text-dim)" fontSize={12} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${v.toLocaleString()}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', color: 'var(--text)' }}
                  formatter={(val: number) => [`$${val.toLocaleString()}`, `${selectedAsset?.symbol} Price`]}
                />
                <Area type="monotone" dataKey="price" stroke="#7C3AED" strokeWidth={3} fill="url(#colorPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset list */}
        <div className="lg:col-span-1 glass-card p-6 flex flex-col">
          <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text)' }}>Market Assets</h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {assets.map(asset => (
              <button
                key={asset.id}
                onClick={() => setSelectedAssetId(asset.id)}
                className="w-full flex items-center justify-between p-3 rounded-2xl transition-all border"
                style={{
                  background: selectedAssetId === asset.id ? 'rgba(124,58,237,0.05)' : 'transparent',
                  borderColor: selectedAssetId === asset.id ? 'rgba(124,58,237,0.2)' : 'transparent',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs',
                    asset.type === 'CRYPTO' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600'
                      : asset.type === 'STOCK' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-600'
                        : 'bg-purple-100 dark:bg-purple-950/40 text-purple-600'
                  )}>
                    {asset.symbol?.substring(0, 3)}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{asset.symbol}</p>
                    <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{asset.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                    ${asset.currentPrice?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                  <p className={cn('text-[10px] font-bold', asset.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                    {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <TradeModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        asset={selectedAsset}
        strategies={assetStrategies}
        onConfirm={handleManualTrade}
      />
    </motion.div>
  );
};

export default Dashboard;