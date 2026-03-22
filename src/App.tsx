import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Strategies from './pages/Strategies';
import TradeHistory from './pages/TradeHistory';
import Backtest from './pages/Backtest';
import RiskManagement from './pages/RiskManagement';
import Login from './pages/Login';
import Subscription from './pages/Subscription';
import Wallet from './pages/Wallet';
import Settings from './pages/Settings';
import { useTrading } from './context/TradingContext';

const App: React.FC = () => {
  const { user, isAuthReady } = useTrading();

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/strategies" element={<Strategies />} />
        <Route path="/history" element={<TradeHistory />} />
        <Route path="/backtest" element={<Backtest />} />
        <Route path="/risk" element={<RiskManagement />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
