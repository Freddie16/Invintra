import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, History } from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TradeHistory: React.FC = () => {
  const { trades, marketData, strategies } = useTrading();
  const [filters, setFilters] = useState({ symbol: '', type: 'ALL', status: 'ALL', strategyId: 'ALL' });

  const filteredTrades = trades.filter(t => {
    const matchSymbol = t.symbol.toLowerCase().includes(filters.symbol.toLowerCase());
    const matchType = filters.type === 'ALL' || t.type === filters.type;
    const matchStatus = filters.status === 'ALL' || t.status === filters.status;
    const matchStrategy = filters.strategyId === 'ALL' || t.strategyId === filters.strategyId;
    return matchSymbol && matchType && matchStatus && matchStrategy;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by symbol (e.g. BTC)..."
              value={filters.symbol}
              onChange={(e) => setFilters({ ...filters, symbol: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <select 
              value={filters.strategyId}
              onChange={(e) => setFilters({ ...filters, strategyId: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
            >
              <option value="ALL">All Strategies</option>
              {strategies.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select 
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
            >
              <option value="ALL">All Types</option>
              <option value="BUY">Buy Only</option>
              <option value="SELL">Sell Only</option>
            </select>
            <select 
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
            >
              <option value="ALL">All Status</option>
              <option value="OPEN">Open Only</option>
              <option value="CLOSED">Closed Only</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Symbol</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entry Price</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Exit Price</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">PnL %</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fee</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.map(trade => {
              let displayPnl = trade.pnl;
              const assetMarketData = marketData[trade.assetId || 'btc'];
              
              if (trade.status === 'OPEN' && assetMarketData) {
                const currentPrice = assetMarketData.price;
                if (trade.type === 'BUY') {
                  displayPnl = ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;
                } else {
                  displayPnl = ((trade.entryPrice - currentPrice) / trade.entryPrice) * 100;
                }
              }

              return (
                <tr key={trade.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold">{trade.symbol}</td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-bold",
                      trade.type === 'BUY' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {trade.type}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-sm">${trade.entryPrice.toLocaleString()}</td>
                  <td className="p-4 font-mono text-sm">{trade.exitPrice ? `$${trade.exitPrice.toLocaleString()}` : '-'}</td>
                  <td className="p-4">
                    {displayPnl !== undefined ? (
                      <div className="flex flex-col">
                        <span className={cn("font-bold", displayPnl >= 0 ? "text-emerald-600" : "text-rose-600")}>
                          {displayPnl > 0 ? '+' : ''}{displayPnl.toFixed(2)}%
                        </span>
                        {trade.status === 'OPEN' && (
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Live</span>
                        )}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="p-4 font-mono text-sm text-slate-500">
                    {trade.tradingFee ? `KES ${trade.tradingFee.toFixed(2)}` : '-'}
                  </td>
                  <td className="p-4 text-slate-500 text-sm">{format(new Date(trade.timestamp), 'MMM dd, HH:mm')}</td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                      trade.status === 'OPEN' ? "bg-primary-light text-primary animate-pulse" : "bg-slate-100 text-slate-400"
                    )}>
                      {trade.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filteredTrades.length === 0 && (
              <tr>
                <td colSpan={8} className="p-10 text-center text-slate-400 italic">No trade history found matching your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default TradeHistory;
