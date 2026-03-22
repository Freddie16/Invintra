export type AssetType = 'CRYPTO' | 'STOCK' | 'INDEX';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  currentPrice: number;
  change24h: number;
}

export interface Strategy {
  id: string;
  name: string;
  isActive: boolean;
  riskLimit: number;
  pnl: number;
  winRate: number;
  tradesCount: number;
  userId: string;
  stopLoss?: number;
  takeProfit?: number;
  assetId: string; // Link to an asset
}

export interface Trade {
  id: string;
  strategyId: string;
  symbol: string;
  entryPrice: number;
  exitPrice?: number;
  status: 'OPEN' | 'CLOSED';
  type: 'BUY' | 'SELL';
  timestamp: string;
  pnl?: number;
  userId: string;
  quantity: number;
  assetId?: string; // Optional for backward compatibility
  tradingFee?: number;
}

export interface MarketData {
  price: number;
  history: { time: string; price: number }[];
}

export type UserRole = 'admin' | 'user' | 'read-only';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  isSubscribed: boolean;
  subscriptionTier: 'FREE' | 'PRO' | 'LIFETIME';
  subscriptionExpiry?: string;
  isSuperAdmin?: boolean;
  role: UserRole;
  balance: number; // For M-Pesa
  favorites: string[]; // Array of asset IDs
  tradingFeeRate: number; // e.g. 0.001 for 0.1%
  defaultStopLoss?: number;
  defaultTakeProfit?: number;
}

export type AlertTriggerType = 'PNL_ABOVE' | 'PNL_BELOW' | 'TRADE_OPEN' | 'TRADE_CLOSE';

export interface StrategyAlert {
  id: string;
  strategyId: string;
  userId: string;
  triggerType: AlertTriggerType;
  threshold?: number; // For PNL triggers
  isActive: boolean;
  message: string;
  createdAt: string;
}

export interface FinancialGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  createdAt: string;
  deadline?: string;
}
