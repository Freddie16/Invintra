import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, TrendingUp, TrendingDown, Search, X, Plus, Activity, ChevronRight, ChevronLeft } from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Watchlist: React.FC = () => {
  const { assets, userProfile, marketData, toggleFavorite } = useTrading();
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const favoriteAssets = assets.filter(a => userProfile?.favorites?.includes(a.id));
  const nonFavoriteAssets = assets.filter(a => !userProfile?.favorites?.includes(a.id));

  const filteredAssets = searchQuery 
    ? nonFavoriteAssets.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        a.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : nonFavoriteAssets;

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isExpanded ? 320 : 80 }}
      className="bg-white border-l border-slate-100 flex flex-col h-screen sticky top-0 z-40 transition-all duration-300"
    >
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-slate-50">
        {isExpanded ? (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-500 rounded-xl">
              <Star size={20} fill="currentColor" />
            </div>
            <h2 className="font-bold text-slate-900">Watchlist</h2>
          </div>
        ) : (
          <div className="mx-auto p-2 bg-amber-50 text-amber-500 rounded-xl">
            <Star size={20} fill="currentColor" />
          </div>
        )}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-all"
        >
          {isExpanded ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Search Toggle (Only when expanded) */}
      {isExpanded && (
        <div className="px-6 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearch(true)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>
      )}

      {/* Search Results / All Assets (Overlay-like when searching) */}
      <AnimatePresence>
        {isExpanded && showSearch && searchQuery && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-[130px] left-6 right-6 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 max-h-[300px] overflow-y-auto p-2"
          >
            <div className="flex justify-between items-center p-2 mb-2 border-b border-slate-50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Search Results</span>
              <button onClick={() => { setSearchQuery(''); setShowSearch(false); }} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400">
                <X size={14} />
              </button>
            </div>
            {filteredAssets.length > 0 ? (
              filteredAssets.map(asset => (
                <button
                  key={asset.id}
                  onClick={() => toggleFavorite(asset.id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px]",
                      asset.type === 'CRYPTO' ? "bg-amber-100 text-amber-600" : asset.type === 'STOCK' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                    )}>
                      {asset.symbol.substring(0, 3)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{asset.symbol}</p>
                      <p className="text-[10px] text-slate-400">{asset.name}</p>
                    </div>
                  </div>
                  <Plus size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
                </button>
              ))
            ) : (
              <p className="text-center py-4 text-xs text-slate-400 italic">No assets found</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Favorites List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 custom-scrollbar">
        {favoriteAssets.length > 0 ? (
          favoriteAssets.map(asset => {
            const data = marketData[asset.id];
            const isPositive = asset.change24h >= 0;

            return (
              <div 
                key={asset.id}
                className={cn(
                  "p-3 rounded-2xl border border-transparent hover:bg-slate-50 transition-all group relative",
                  !isExpanded && "flex justify-center"
                )}
              >
                <div className={cn("flex items-center justify-between", !isExpanded && "flex-col gap-2")}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0",
                      asset.type === 'CRYPTO' ? "bg-amber-100 text-amber-600" : asset.type === 'STOCK' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                    )}>
                      {asset.symbol.substring(0, 3)}
                    </div>
                    {isExpanded && (
                      <div>
                        <p className="text-sm font-bold text-slate-900">{asset.symbol}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">{asset.type}</p>
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">${asset.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        <div className={cn(
                          "flex items-center justify-end gap-1 text-[10px] font-bold",
                          isPositive ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {isPositive ? '+' : ''}{asset.change24h.toFixed(2)}%
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleFavorite(asset.id)}
                        className="p-2 text-slate-300 hover:text-amber-500 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Star size={16} fill="currentColor" />
                      </button>
                    </div>
                  )}

                  {!isExpanded && (
                    <div className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-lg",
                      isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {isPositive ? '+' : ''}{asset.change24h.toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          isExpanded && (
            <div className="text-center py-12 px-6">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="text-slate-200" size={24} />
              </div>
              <p className="text-xs text-slate-400 font-medium">Your watchlist is empty. Search for assets to add them.</p>
            </div>
          )
        )}
      </div>

      {/* Footer / Quick Stats (Optional) */}
      {isExpanded && (
        <div className="p-6 bg-slate-50/50 border-t border-slate-50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Market Health</span>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Bullish</span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-[65%] rounded-full" />
          </div>
        </div>
      )}
    </motion.aside>
  );
};

export default Watchlist;
