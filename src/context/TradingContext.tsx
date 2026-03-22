import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, where, orderBy, doc, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { Strategy, Trade, MarketData, UserProfile, Asset, StrategyAlert, FinancialGoal, UserRole } from '../types';

export interface StrategyMetrics {
  pnl: number;
  realizedPnL: number;
  unrealizedPnL: number;
  winRate: number;
  tradesCount: number;
}

interface TradingContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAuthReady: boolean;
  assets: Asset[];
  marketData: Record<string, MarketData>;
  strategies: Strategy[];
  trades: Trade[];
  liveMetrics: Record<string, StrategyMetrics>;
  alerts: { id: string, type: 'TP' | 'SL' | 'INFO', message: string }[];
  isSubscribed: boolean;
  isSuperAdmin: boolean;
  role: UserRole;
  handleStopLossAlert: (strategyName: string, pnl: number) => void;
  deposit: (phoneNumber: string, amount: number) => Promise<void>;
  withdraw: (phoneNumber: string, amount: number) => Promise<void>;
  toggleFavorite: (assetId: string) => Promise<void>;
  updateFeeRate: (rate: number) => Promise<void>;
  updateDefaultRiskSettings: (sl: number, tp: number) => Promise<void>;
  deleteAccount: () => Promise<void>;
  strategyAlerts: StrategyAlert[];
  createStrategyAlert: (alert: Omit<StrategyAlert, 'id' | 'userId' | 'createdAt' | 'isActive'>) => Promise<void>;
  deleteStrategyAlert: (alertId: string) => Promise<void>;
  goals: FinancialGoal[];
  createGoal: (goal: Omit<FinancialGoal, 'id' | 'userId' | 'createdAt' | 'currentAmount'>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  updateGoalAmount: (goalId: string, amount: number) => Promise<void>;
  executeTrade: (strategy: Strategy, type: 'BUY' | 'SELL', price: number) => Promise<void>;
  isNewStrategyModalOpen: boolean;
  setIsNewStrategyModalOpen: (isOpen: boolean) => void;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({});
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [strategyAlerts, setStrategyAlerts] = useState<StrategyAlert[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [liveMetrics, setLiveMetrics] = useState<Record<string, StrategyMetrics>>({});
  const [alerts, setAlerts] = useState<{ id: string, type: 'TP' | 'SL' | 'INFO', message: string }[]>([]);
  const [isNewStrategyModalOpen, setIsNewStrategyModalOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const lastExecutionRef = useRef<Record<string, number>>({});

  const executeTrade = async (strategy: Strategy, type: 'BUY' | 'SELL', price: number) => {
    if (!user) return;
    const asset = assets.find(a => a.id === strategy.assetId);
    try {
      await addDoc(collection(db, 'trades'), {
        strategyId: strategy.id,
        symbol: asset?.symbol || 'UNKNOWN',
        assetId: strategy.assetId,
        entryPrice: price,
        status: 'OPEN',
        type,
        timestamp: new Date().toISOString(),
        userId: user.uid,
        quantity: Math.floor(strategy.riskLimit / price * 10) / 10 || 0.1
      });

      // Check for TRADE_OPEN alerts
      strategyAlerts.filter(a => a.strategyId === strategy.id && a.triggerType === 'TRADE_OPEN').forEach(a => {
        addAlert('INFO', `Alert: ${strategy.name} - ${a.message}`);
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'trades');
    }
  };

  const closeTrade = async (trade: Trade, exitPrice: number) => {
    if (!user || !userProfile) return;
    try {
      const pnl = trade.type === 'BUY'
        ? ((exitPrice - trade.entryPrice) / trade.entryPrice) * 100
        : ((trade.entryPrice - exitPrice) / trade.entryPrice) * 100;

      const feeRate = userProfile.tradingFeeRate || 0.001; // Default 0.1%
      const tradeValue = exitPrice * trade.quantity;
      const tradingFee = tradeValue * feeRate;

      await updateDoc(doc(db, 'trades', trade.id), {
        status: 'CLOSED',
        exitPrice,
        pnl,
        tradingFee,
        timestamp: new Date().toISOString()
      });

      // Deduct fee from balance
      await updateDoc(doc(db, 'users', user.uid), {
        balance: (userProfile.balance || 0) - tradingFee
      });

      // Check for TRADE_CLOSE alerts
      strategyAlerts.filter(a => a.strategyId === trade.strategyId && a.triggerType === 'TRADE_CLOSE').forEach(a => {
        addAlert('INFO', `Alert: Trade Closed - ${a.message}`);
      });

      addAlert('INFO', `Trade closed. Fee of KES ${tradingFee.toFixed(2)} deducted.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `trades/${trade.id}`);
    }
  };

  useEffect(() => {
    if (Object.keys(marketData).length === 0 || !user || strategies.length === 0) return;

    const now = Date.now();
    strategies.filter(s => s.isActive).forEach(async (s) => {
      const assetData = marketData[s.assetId];
      if (!assetData) return;

      const strategyTrades = trades.filter(t => t.strategyId === s.id);
      const openTrade = strategyTrades.find(t => t.status === 'OPEN');

      if (openTrade) {
        // Check for TP/SL
        const currentPnL = openTrade.type === 'BUY'
          ? ((assetData.price - openTrade.entryPrice) / openTrade.entryPrice) * 100
          : ((openTrade.entryPrice - assetData.price) / openTrade.entryPrice) * 100;

        if (s.takeProfit && currentPnL >= s.takeProfit) {
          await closeTrade(openTrade, assetData.price);
          addAlert('TP', `Take Profit hit for ${s.name}: +${currentPnL.toFixed(2)}%`);
        } else if (s.stopLoss && currentPnL <= -s.stopLoss) {
          await closeTrade(openTrade, assetData.price);
          handleStopLossAlert(s.name, currentPnL);
        }
      } else {
        // Simulate opening a trade every 30 seconds if none open
        const lastExec = lastExecutionRef.current[s.id] || 0;
        if (now - lastExec > 30000) {
          lastExecutionRef.current[s.id] = now;
          const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
          await executeTrade(s, type, assetData.price);
        }
      }
    });
  }, [marketData, strategies, trades, user]);

  useEffect(() => {
    if (Object.keys(marketData).length === 0 || strategies.length === 0) return;
  }, [marketData, strategies]);

  const addAlert = (type: 'TP' | 'SL' | 'INFO', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setAlerts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }, 5000);
  };

  const handleStopLossAlert = (strategyName: string, pnl: number) => {
    addAlert('SL', `Stop Loss hit for ${strategyName}: ${pnl.toFixed(2)}%`);
  };

  const deposit = async (phoneNumber: string, amount: number) => {
    if (!user || !userProfile) return;
    try {
      const response = await fetch('/api/mpesa/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, amount })
      });
      const data = await response.json();
      if (data.ResponseCode === "0") {
        addAlert('INFO', `M-Pesa deposit of KES ${amount} initiated.`);
        // In real app, wait for callback. Here we update immediately for demo.
        await updateDoc(doc(db, 'users', user.uid), {
          balance: (userProfile.balance || 0) + amount
        });
      }
    } catch (error) {
      console.error('Deposit error:', error);
    }
  };

  const withdraw = async (phoneNumber: string, amount: number) => {
    if (!user || !userProfile) return;
    if ((userProfile.balance || 0) < amount) {
      addAlert('INFO', 'Insufficient balance for withdrawal.');
      return;
    }
    try {
      const response = await fetch('/api/mpesa/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, amount })
      });
      const data = await response.json();
      if (data.ResponseCode === "0") {
        addAlert('INFO', `M-Pesa withdrawal of KES ${amount} initiated.`);
        await updateDoc(doc(db, 'users', user.uid), {
          balance: (userProfile.balance || 0) - amount
        });
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
    }
  };

  const toggleFavorite = async (assetId: string) => {
    if (!user || !userProfile) return;
    const favorites = userProfile.favorites || [];
    const newFavorites = favorites.includes(assetId)
      ? favorites.filter(id => id !== assetId)
      : [...favorites, assetId];
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        favorites: newFavorites
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };
  
  const updateFeeRate = async (rate: number) => {
    if (!user || !userProfile) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        tradingFeeRate: rate
      });
      addAlert('INFO', `Trading fee rate updated to ${(rate * 100).toFixed(2)}%`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const updateDefaultRiskSettings = async (sl: number, tp: number) => {
    if (!user || !userProfile) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        defaultStopLoss: sl,
        defaultTakeProfit: tp
      });
      addAlert('INFO', `Default risk settings updated: SL ${sl}%, TP ${tp}%`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const createStrategyAlert = async (alert: Omit<StrategyAlert, 'id' | 'userId' | 'createdAt' | 'isActive'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'strategyAlerts'), {
        ...alert,
        userId: user.uid,
        isActive: true,
        createdAt: new Date().toISOString()
      });
      addAlert('INFO', 'Strategy alert created successfully.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'strategyAlerts');
    }
  };

  const deleteStrategyAlert = async (alertId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'strategyAlerts', alertId), { isActive: false });
      addAlert('INFO', 'Strategy alert removed.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `strategyAlerts/${alertId}`);
    }
  };

  const createGoal = async (goal: Omit<FinancialGoal, 'id' | 'userId' | 'createdAt' | 'currentAmount'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'goals'), {
        ...goal,
        userId: user.uid,
        currentAmount: 0,
        createdAt: new Date().toISOString()
      });
      addAlert('INFO', 'Financial goal created successfully.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'goals');
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'goals', goalId));
      addAlert('INFO', 'Financial goal removed.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `goals/${goalId}`);
    }
  };

  const updateGoalAmount = async (goalId: string, amount: number) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'goals', goalId), {
        currentAmount: amount
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `goals/${goalId}`);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    try {
      // 1. Delete user profile from Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        isDeleted: true,
        balance: 0
      });
      
      // 2. Delete user from Auth
      await user.delete();
      addAlert('INFO', 'Account successfully deleted.');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        addAlert('SL', 'Please logout and login again to delete your account for security reasons.');
      } else {
        console.error('Delete account error:', error);
        addAlert('SL', 'Failed to delete account. Please try again later.');
      }
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        setUserProfile({ uid: snapshot.id, ...snapshot.data() } as UserProfile);
      } else {
        // Handle new user profile creation if needed
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'User',
          isSubscribed: user.email === 'freddie16@superadmin.com' || user.email === 'freddiemurigi@gmail.com',
          subscriptionTier: (user.email === 'freddie16@superadmin.com' || user.email === 'freddiemurigi@gmail.com') ? 'LIFETIME' : 'FREE',
          isSuperAdmin: user.email === 'freddie16@superadmin.com' || user.email === 'freddiemurigi@gmail.com',
          role: (user.email === 'freddie16@superadmin.com' || user.email === 'freddiemurigi@gmail.com') ? 'admin' : 'user',
          balance: 0,
          favorites: [],
          tradingFeeRate: 0.001, // Default 0.1%
          defaultStopLoss: 2,
          defaultTakeProfit: 5
        };
        setUserProfile(newProfile);
        // Persist to Firestore
        setDoc(doc(db, 'users', user.uid), newProfile).catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}`));

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Fetch initial assets
    fetch('/api/assets')
      .then(res => res.json())
      .then(data => setAssets(data));

    socketRef.current = io(window.location.origin);
    
    socketRef.current.on('initial-history-all', (allHistory: Record<string, any[]>) => {
      const initialMarketData: Record<string, MarketData> = {};
      Object.entries(allHistory).forEach(([assetId, history]) => {
        initialMarketData[assetId] = {
          price: history[history.length - 1]?.price || 0,
          history
        };
      });
      setMarketData(initialMarketData);
    });

    socketRef.current.on('price-update', (point: { assetId: string, time: string, price: number }) => {
      setMarketData(prev => {
        const assetPrev = prev[point.assetId];
        if (!assetPrev) return { ...prev, [point.assetId]: { price: point.price, history: [point] } };
        const newHistory = [...assetPrev.history, point];
        if (newHistory.length > 200) newHistory.shift();
        return { 
          ...prev, 
          [point.assetId]: { price: point.price, history: newHistory } 
        };
      });
      
      // Update assets list current price
      setAssets(prev => prev.map(a => a.id === point.assetId ? { ...a, currentPrice: point.price } : a));
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const strategiesQuery = query(
      collection(db, 'strategies'),
      where('userId', '==', user.uid)
    );

    const tradesQuery = query(
      collection(db, 'trades'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeStrategies = onSnapshot(strategiesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Strategy));
      setStrategies(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'strategies'));

    const unsubscribeTrades = onSnapshot(tradesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trade));
      setTrades(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'trades'));

    const alertsQuery = query(
      collection(db, 'strategyAlerts'),
      where('userId', '==', user.uid),
      where('isActive', '==', true)
    );

    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StrategyAlert));
      setStrategyAlerts(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'strategyAlerts'));

    const goalsQuery = query(
      collection(db, 'goals'),
      where('userId', '==', user.uid)
    );

    const unsubscribeGoals = onSnapshot(goalsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialGoal));
      setGoals(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'goals'));

    return () => {
      unsubscribeStrategies();
      unsubscribeTrades();
      unsubscribeAlerts();
      unsubscribeGoals();
    };
  }, [user]);

  useEffect(() => {
    if (Object.keys(marketData).length === 0 || strategies.length === 0) return;

    const newMetrics: Record<string, StrategyMetrics> = {};
    strategies.forEach(s => {
      const assetData = marketData[s.assetId];
      if (!assetData) return;

      const strategyTrades = trades.filter(t => t.strategyId === s.id);
      const closedTrades = strategyTrades.filter(t => t.status === 'CLOSED');
      const openTrades = strategyTrades.filter(t => t.status === 'OPEN');
      
      const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
      const winRate = closedTrades.length > 0 
        ? Math.round((winningTrades.length / closedTrades.length) * 100) 
        : 0;
      
      const realizedPnL = closedTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
      
      let unrealizedPnL = 0;
      openTrades.forEach(t => {
        const pnl = t.type === 'BUY' 
          ? ((assetData.price - t.entryPrice) / t.entryPrice) * 100
          : ((t.entryPrice - assetData.price) / t.entryPrice) * 100;
        unrealizedPnL += pnl;
      });

      newMetrics[s.id] = {
        pnl: realizedPnL + unrealizedPnL,
        realizedPnL,
        unrealizedPnL,
        winRate,
        tradesCount: strategyTrades.length
      };

      // Check for PnL alerts
      const strategyPnL = realizedPnL + unrealizedPnL;
      strategyAlerts.filter(a => a.strategyId === s.id).forEach(a => {
        if (a.triggerType === 'PNL_ABOVE' && a.threshold !== undefined && strategyPnL >= a.threshold) {
          addAlert('INFO', `Alert: ${s.name} PnL Above ${a.threshold}% - ${a.message}`);
        } else if (a.triggerType === 'PNL_BELOW' && a.threshold !== undefined && strategyPnL <= a.threshold) {
          addAlert('INFO', `Alert: ${s.name} PnL Below ${a.threshold}% - ${a.message}`);
        }
      });
    });
    setLiveMetrics(newMetrics);
  }, [marketData, strategies, trades]);

  const isSuperAdmin = userProfile?.isSuperAdmin || 
                      userProfile?.role === 'admin' ||
                      (user?.email === 'freddiemurigi@gmail.com') || 
                      (user?.email === 'freddie16@superadmin.com');
  const isSubscribed = isSuperAdmin || userProfile?.isSubscribed || false;
  const role = userProfile?.role || 'user';

  return (
    <TradingContext.Provider value={{
      user,
      userProfile,
      isAuthReady,
      assets,
      marketData,
      strategies,
      trades,
      liveMetrics,
      alerts,
      isSubscribed,
      isSuperAdmin,
      role,
      handleStopLossAlert,
      deposit,
      withdraw,
      toggleFavorite,
      updateFeeRate,
      updateDefaultRiskSettings,
      deleteAccount,
      strategyAlerts,
      createStrategyAlert,
      deleteStrategyAlert,
      goals,
      createGoal,
      deleteGoal,
      updateGoalAmount,
      executeTrade,
      isNewStrategyModalOpen,
      setIsNewStrategyModalOpen
    }}>
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (context === undefined) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};
