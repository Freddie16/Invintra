import React from 'react';
import { motion } from 'motion/react';
import { Check, Zap, Shield, Crown, CreditCard } from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const Subscription: React.FC = () => {
  const { user, userProfile, isSuperAdmin } = useTrading();

  const handleSubscribe = async (tier: 'PRO' | 'LIFETIME') => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isSubscribed: true,
        subscriptionTier: tier,
        subscriptionExpiry: tier === 'LIFETIME' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      alert(`Successfully subscribed to ${tier} tier!`);
    } catch (error) {
      console.error('Subscription failed', error);
      alert('Subscription failed. Please try again.');
    }
  };

  if (isSuperAdmin) {
    return (
      <div className="p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <Crown size={40} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900">Super Admin Access</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          You have lifetime free access to all premium features. No subscription required.
        </p>
        <div className="inline-block px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-bold border border-emerald-100">
          Status: Lifetime Active
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-slate-900">Upgrade Your Trading</h2>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Unlock advanced algorithmic strategies, real-time backtesting, and institutional-grade risk management tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Free Tier */}
        <div className="glass-card p-8 flex flex-col h-full border-2 border-transparent">
          <div className="space-y-4 flex-1">
            <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-bold">Free</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-slate-400 font-medium">/mo</span>
            </div>
            <ul className="space-y-4 pt-6">
              <li className="flex items-center gap-3 text-sm text-slate-600">
                <Check size={18} className="text-emerald-500" />
                <span>1 Active Strategy</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600">
                <Check size={18} className="text-emerald-500" />
                <span>Basic Trade History</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600">
                <Check size={18} className="text-emerald-500" />
                <span>Standard Market Data</span>
              </li>
            </ul>
          </div>
          <button disabled className="mt-8 w-full py-4 bg-slate-100 text-slate-400 font-bold rounded-2xl cursor-not-allowed">
            Current Plan
          </button>
        </div>

        {/* Pro Tier */}
        <div className="glass-card p-8 flex flex-col h-full border-2 border-primary relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-widest">
            Recommended
          </div>
          <div className="space-y-4 flex-1">
            <div className="w-12 h-12 bg-primary-light text-primary rounded-xl flex items-center justify-center">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold">Pro</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">$49</span>
              <span className="text-slate-400 font-medium">/mo</span>
            </div>
            <ul className="space-y-4 pt-6">
              <li className="flex items-center gap-3 text-sm text-slate-600">
                <Check size={18} className="text-emerald-500" />
                <span>Unlimited Strategies</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600">
                <Check size={18} className="text-emerald-500" />
                <span>Advanced Backtesting</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600">
                <Check size={18} className="text-emerald-500" />
                <span>Real-time Risk Alerts</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600">
                <Check size={18} className="text-emerald-500" />
                <span>Priority Execution</span>
              </li>
            </ul>
          </div>
          <button 
            onClick={() => handleSubscribe('PRO')}
            className="mt-8 w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
          >
            <CreditCard size={18} /> Upgrade to Pro
          </button>
        </div>

        {/* Lifetime Tier */}
        <div className="glass-card p-8 flex flex-col h-full border-2 border-transparent">
          <div className="space-y-4 flex-1">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
              <Crown size={24} />
            </div>
            <h3 className="text-xl font-bold">Lifetime</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">$499</span>
              <span className="text-slate-400 font-medium">once</span>
            </div>
            <ul className="space-y-4 pt-6">
              <li className="flex items-center gap-3 text-sm text-slate-600">
                <Check size={18} className="text-emerald-500" />
                <span>All Pro Features</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600">
                <Check size={18} className="text-emerald-500" />
                <span>Early Access to New Bots</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600">
                <Check size={18} className="text-emerald-500" />
                <span>Private Discord Access</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600">
                <Check size={18} className="text-emerald-500" />
                <span>1-on-1 Strategy Review</span>
              </li>
            </ul>
          </div>
          <button 
            onClick={() => handleSubscribe('LIFETIME')}
            className="mt-8 w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            <Crown size={18} /> Get Lifetime
          </button>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
