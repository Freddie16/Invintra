import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star, TrendingUp, TrendingDown, Search, X, Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { useTrading } from '../context/TradingContext';

const Watchlist: React.FC = () => {
  const { assets, userProfile, toggleFavorite } = useTrading();
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const favoriteAssets    = assets.filter(a => userProfile?.favorites?.includes(a.id));
  const nonFavoriteAssets = assets.filter(a => !userProfile?.favorites?.includes(a.id));
  const filteredAssets    = searchQuery
    ? nonFavoriteAssets.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : nonFavoriteAssets;

  return (
    <motion.aside
      initial={false}
      animate={{ width: isExpanded ? 320 : 72 }}
      className="flex flex-col h-screen sticky top-0 z-40 overflow-hidden"
      style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        {isExpanded ? (
          <>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
                <Star size={18} fill="currentColor" />
              </div>
              <h2 className="font-bold" style={{ color: 'var(--text)' }}>Watchlist</h2>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => { setShowSearch(!showSearch); setSearchQuery(''); }}
                className="p-2 rounded-xl transition-all hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
                {showSearch ? <X size={16} /> : <Search size={16} />}
              </button>
              <button onClick={() => setIsExpanded(false)}
                className="p-2 rounded-xl transition-all hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        ) : (
          <button onClick={() => setIsExpanded(true)} className="mx-auto" style={{ color: '#F59E0B' }}>
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="flex-1 overflow-y-auto">
          {/* Search box */}
          {showSearch && (
            <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <input
                autoFocus
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>
          )}

          {/* Favorites */}
          {!showSearch && favoriteAssets.length > 0 && (
            <div className="p-4">
              <p className="text-[9px] font-bold uppercase tracking-widest mb-3 px-2" style={{ color: 'var(--text-muted)' }}>
                Favorites
              </p>
              {favoriteAssets.map(asset => (
                <div key={asset.id} className="flex items-center justify-between p-3 rounded-2xl mb-1 group"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleFavorite(asset.id)}
                      className="opacity-0 group-hover:opacity-100 transition-all" style={{ color: '#F59E0B' }}>
                      <X size={12} />
                    </button>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{asset.symbol}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{asset.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                      ${asset.currentPrice?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center justify-end gap-1">
                      {asset.change24h >= 0
                        ? <TrendingUp size={10} className="text-emerald-500" />
                        : <TrendingDown size={10} className="text-rose-500" />
                      }
                      <p className={asset.change24h >= 0 ? 'text-[10px] font-bold text-emerald-500' : 'text-[10px] font-bold text-rose-500'}>
                        {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* All / Search results */}
          <div className="p-4">
            <p className="text-[9px] font-bold uppercase tracking-widest mb-3 px-2" style={{ color: 'var(--text-muted)' }}>
              {showSearch ? 'Search Results' : 'All Assets'}
            </p>
            {filteredAssets.map(asset => (
              <div key={asset.id} className="flex items-center justify-between p-3 rounded-2xl mb-1 group transition-all hover:opacity-90">
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleFavorite(asset.id)}
                    className="opacity-0 group-hover:opacity-100 transition-all" style={{ color: 'var(--text-muted)' }}>
                    <Plus size={12} />
                  </button>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{asset.symbol}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{asset.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm" style={{ color: 'var(--text)' }}>
                    ${asset.currentPrice?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                  <p className={asset.change24h >= 0 ? 'text-[10px] font-bold text-emerald-500' : 'text-[10px] font-bold text-rose-500'}>
                    {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.aside>
  );
};

export default Watchlist;