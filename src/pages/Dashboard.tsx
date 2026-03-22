import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Activity, Zap, ShieldAlert, Star, Wallet, X, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { useTrading, StrategyMetrics } from '../context/TradingContext';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Strategy } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const StatCard = ({ title, value, change, icon: Icon, isPositive }: { title: string, value: string | number, change: string, icon: any, isPositive: boolean }) => (
  <div className="glass-card p-6 space-y-4">
    <div className="flex justify-between items-start">
      <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center">
        <Icon size={24} />
      </div>
      <div className={cn(
        "px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1",
        isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
      )}>
        {isPositive ? '+' : '-'}{change}%
      </div>
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  </div>
);

const TradeModal = ({ 
  isOpen, 
  onClose, 
  asset, 
  strategies, 
  onConfirm 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  asset: any, 
  strategies: Strategy[], 
  onConfirm: (strategy: Strategy, type: 'BUY' | 'SELL') => void 
}) => {
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(strategies[0]?.id || '');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');

  const selectedStrategy = strategies.find(s => s.id === selectedStrategyId);
  
  if (!isOpen || !asset) return null;

  const quantity = selectedStrategy ? (selectedStrategy.riskLimit / (asset.currentPrice || 1)).toFixed(4) : '0';
  const potentialProfit = selectedStrategy ? (selectedStrategy.riskLimit * (selectedStrategy.takeProfit / 100)).toFixed(2) : '0';
  const potentialLoss = selectedStrategy ? (selectedStrategy.riskLimit * (selectedStrategy.stopLoss / 100)).toFixed(2) : '0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Confirm Trade</h3>
            <p className="text-xs text-slate-500 font-medium">Review execution details before confirming</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-xs">
                {asset.symbol?.substring(0, 3) || '???'}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{asset.name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{asset.symbol}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">${asset.currentPrice?.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Current Price</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Select Strategy</label>
            <select 
              value={selectedStrategyId}
              onChange={(e) => setSelectedStrategyId(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            >
              {strategies.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setTradeType('BUY')}
              className={cn(
                "py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 border-2",
                tradeType === 'BUY' ? "bg-emerald-50 border-emerald-500 text-emerald-600" : "bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100"
              )}
            >
              <ArrowUpRight size={18} />
              BUY
            </button>
            <button 
              onClick={() => setTradeType('SELL')}
              className={cn(
                "py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 border-2",
                tradeType === 'SELL' ? "bg-rose-50 border-rose-500 text-rose-600" : "bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100"
              )}
            >
              <ArrowDownRight size={18} />
              SELL
            </button>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quantity</span>
              <span className="text-sm font-bold text-slate-900">{quantity} {asset.symbol}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Risk Limit</span>
              <span className="text-sm font-bold text-slate-900">${selectedStrategy?.riskLimit}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Est. Profit (TP)</span>
                <Info size={12} className="text-slate-300" />
              </div>
              <span className="text-sm font-bold text-emerald-600">+${potentialProfit}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Est. Loss (SL)</span>
                <Info size={12} className="text-slate-300" />
              </div>
              <span className="text-sm font-bold text-rose-600">-${potentialLoss}</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-white text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all border border-slate-200"
          >
            Cancel
          </button>
          <button 
            onClick={() => selectedStrategy && onConfirm(selectedStrategy, tradeType)}
            className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
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

  const metricsList = Object.values(liveMetrics) as StrategyMetrics[];
  const activeStrategiesCount = strategies.filter(s => s.isActive).length;
  const totalPnL = metricsList.reduce((acc, m) => acc + m.pnl, 0);
  const totalTrades = metricsList.reduce((acc, m) => acc + m.tradesCount, 0);
  const avgWinRate = strategies.length > 0 
    ? Math.round(metricsList.reduce((acc, m) => acc + m.winRate, 0) / strategies.length) 
    : 0;

  const selectedAsset = assets.find(a => a.id === selectedAssetId) || assets[0];
  const chartData = marketData[selectedAssetId]?.history || [];

  if (assets.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Activity className="text-slate-300" size={32} />
          </div>
          <p className="text-slate-500 font-medium">Loading market data...</p>
        </div>
      </div>
    );
  }

  const assetStrategies = strategies.filter(s => s.assetId === selectedAssetId);

  const handleManualTrade = async (strategy: Strategy, type: 'BUY' | 'SELL') => {
    await executeTrade(strategy, type, selectedAsset.currentPrice);
    setIsTradeModalOpen(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total PnL" value={`${totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}%`} change="8.2" icon={TrendingUp} isPositive={totalPnL >= 0} />
        <StatCard title="Wallet Balance" value={`KES ${userProfile?.balance?.toLocaleString() || '0'}`} change="0" icon={Wallet} isPositive={true} />
        <StatCard title="Total Trades" value={totalTrades} change="12.5" icon={Zap} isPositive={true} />
        <StatCard title="Avg Win Rate" value={`${avgWinRate}%`} change="2.1" icon={ShieldAlert} isPositive={avgWinRate > 50} />
      </div>

      {/* Active Strategy Monitoring */}
      {strategies.filter(s => s.isActive).length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Activity className="text-primary" size={20} />
              <h3 className="text-lg font-bold">Active Strategy Monitoring</h3>
            </div>
            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-widest">
              {strategies.filter(s => s.isActive).length} Running
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {strategies.filter(s => s.isActive).map(strategy => {
              const metrics = liveMetrics[strategy.id];
              const asset = assets.find(a => a.id === strategy.assetId);
              
              return (
                <div key={strategy.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 hover:border-primary/20 transition-all group relative overflow-hidden">
                  {/* Active Indicator */}
                  <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500 animate-pulse" />
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{strategy.name}</h4>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter pl-4">{asset?.symbol || 'Unknown Asset'}</p>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-bold",
                        (metrics?.pnl || 0) >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      )}>
                        {(metrics?.pnl || 0) >= 0 ? '+' : ''}{(metrics?.pnl || 0).toFixed(2)}%
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Total PnL</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Realized</p>
                      <p className={cn(
                        "text-xs font-bold",
                        (metrics?.realizedPnL || 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {(metrics?.realizedPnL || 0) >= 0 ? '+' : ''}{(metrics?.realizedPnL || 0).toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Unrealized</p>
                      <p className={cn(
                        "text-xs font-bold",
                        (metrics?.unrealizedPnL || 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {(metrics?.unrealizedPnL || 0) >= 0 ? '+' : ''}{(metrics?.unrealizedPnL || 0).toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Win Rate</p>
                      <p className="text-sm font-bold text-slate-900">{metrics?.winRate || 0}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Trades</p>
                      <p className="text-sm font-bold text-slate-900">{metrics?.tradesCount || 0}</p>
                    </div>
                  </div>
                  
                  <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${metrics?.winRate || 0}%` }}
                      className={cn(
                        "h-full rounded-full",
                        (metrics?.winRate || 0) > 50 ? "bg-emerald-500" : "bg-amber-500"
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-3 glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold">{selectedAsset?.name} Performance</h3>
              <button 
                onClick={() => toggleFavorite(selectedAssetId)}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  userProfile?.favorites?.includes(selectedAssetId) ? "text-amber-500 bg-amber-50" : "text-slate-300 hover:text-slate-400"
                )}
              >
                <Star size={20} fill={userProfile?.favorites?.includes(selectedAssetId) ? "currentColor" : "none"} />
              </button>
            </div>
            <div className="flex gap-3">
              <div className="flex gap-2 bg-slate-50 p-1 rounded-xl">
                {['1H', '1D', '1W', '1M'].map(t => (
                  <button key={t} className="px-3 py-1 text-xs font-bold rounded-lg hover:bg-white hover:shadow-sm text-slate-500 transition-all">{t}</button>
                ))}
              </div>
              <button 
                onClick={() => !isReadOnly && setIsTradeModalOpen(true)}
                disabled={assetStrategies.length === 0 || isReadOnly}
                className={cn(
                  "px-6 py-2 rounded-xl font-bold text-sm transition-all shadow-lg",
                  isReadOnly ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none" :
                  assetStrategies.length > 0 
                    ? "bg-primary text-white hover:bg-primary/90 shadow-primary/20" 
                    : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                )}
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
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="time" hide />
                <YAxis domain={['auto', 'auto']} stroke="#94A3B8" fontSize={12} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val.toLocaleString()}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: number) => [`$${val.toLocaleString()}`, `${selectedAsset?.symbol} Price`]}
                />
                <Area type="monotone" dataKey="price" stroke="#7C3AED" strokeWidth={3} fill="url(#colorPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset List */}
        <div className="lg:col-span-1 glass-card p-6 flex flex-col">
          <h3 className="text-lg font-bold mb-6">Market Assets</h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {assets.map(asset => (
              <button
                key={asset.id}
                onClick={() => setSelectedAssetId(asset.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-2xl transition-all border",
                  selectedAssetId === asset.id ? "bg-primary/5 border-primary/20" : "border-transparent hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs",
                    asset.type === 'CRYPTO' ? "bg-amber-100 text-amber-600" : asset.type === 'STOCK' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                  )}>
                    {asset.symbol?.substring(0, 3) || '???'}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900">{asset.symbol}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">{asset.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">${asset.currentPrice?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  <p className={cn(
                    "text-[10px] font-bold",
                    asset.change24h >= 0 ? "text-emerald-500" : "text-rose-500"
                  )}>
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
