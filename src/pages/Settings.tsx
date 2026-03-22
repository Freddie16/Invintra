import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings as SettingsIcon, Percent, Save, ShieldCheck, Trash2, AlertTriangle, X } from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Settings: React.FC = () => {
  const { userProfile, updateFeeRate, updateDefaultRiskSettings, deleteAccount } = useTrading();
  const [feeRate, setFeeRate] = useState(userProfile?.tradingFeeRate ? (userProfile.tradingFeeRate * 100).toString() : '0.1');
  const [defaultSL, setDefaultSL] = useState(userProfile?.defaultStopLoss?.toString() || '2');
  const [defaultTP, setDefaultTP] = useState(userProfile?.defaultTakeProfit?.toString() || '5');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingRisk, setIsSavingRisk] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveFee = async () => {
    setIsSaving(true);
    const rate = parseFloat(feeRate) / 100;
    if (!isNaN(rate) && rate >= 0) {
      await updateFeeRate(rate);
    }
    setIsSaving(false);
  };

  const handleSaveRisk = async () => {
    setIsSavingRisk(true);
    const sl = parseFloat(defaultSL);
    const tp = parseFloat(defaultTP);
    if (!isNaN(sl) && !isNaN(tp)) {
      await updateDefaultRiskSettings(sl, tp);
    }
    setIsSavingRisk(false);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
    } catch (error) {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteStep(1);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8 pb-20"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm">Configure your trading preferences and account details.</p>
        </div>
      </div>

      <div className="grid gap-8">
        {/* Trading Configuration */}
        <div className="glass-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <Percent className="text-primary" size={20} />
            <h2 className="text-lg font-bold text-slate-900">Trading Fees</h2>
          </div>
          
          <div className="space-y-6">
            <div className="max-w-xs">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Default Trading Fee (%)
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={feeRate}
                  onChange={(e) => setFeeRate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
              </div>
              <p className="mt-2 text-[10px] text-slate-400 leading-relaxed">
                This fee will be applied to the total value of each trade upon closure and deducted from your wallet balance.
              </p>
            </div>

            <button 
              onClick={handleSaveFee}
              disabled={isSaving}
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              <Save size={18} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Default Risk Settings */}
        <div className="glass-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="text-primary" size={20} />
            <h2 className="text-lg font-bold text-slate-900">Default Risk Parameters</h2>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Default Stop-Loss (%)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    value={defaultSL}
                    onChange={(e) => setDefaultSL(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Default Take-Profit (%)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    value={defaultTP}
                    onChange={(e) => setDefaultTP(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              These values will be automatically applied to all new strategies you create. You can still override them individually for each strategy.
            </p>

            <button 
              onClick={handleSaveRisk}
              disabled={isSavingRisk}
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              <Save size={18} />
              {isSavingRisk ? 'Saving...' : 'Save Default Risk Settings'}
            </button>
          </div>
        </div>

        {/* User Role Info */}
        <div className="glass-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="text-primary" size={20} />
            <h2 className="text-lg font-bold text-slate-900">User Role & Permissions</h2>
          </div>
          <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">Current Role</p>
              <p className="text-xs text-slate-500 mt-1">Your role determines your access level and permissions across the platform.</p>
            </div>
            <div className={cn(
              "px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm",
              userProfile?.role === 'admin' ? "bg-primary text-white" : 
              userProfile?.role === 'read-only' ? "bg-amber-100 text-amber-700" : 
              "bg-emerald-100 text-emerald-700"
            )}>
              {userProfile?.role || 'User'}
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div className="glass-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="text-slate-400" size={20} />
            <h2 className="text-lg font-bold text-slate-900">Account Security</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-700">Email Address</p>
                <p className="text-xs text-slate-500">{userProfile?.email}</p>
              </div>
              <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg uppercase">Verified</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-700">Account ID</p>
                <p className="text-xs text-slate-500 font-mono">{userProfile?.uid}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass-card p-8 border-rose-100 bg-rose-50/30">
          <div className="flex items-center gap-3 mb-6">
            <Trash2 className="text-rose-500" size={20} />
            <h2 className="text-lg font-bold text-slate-900">Danger Zone</h2>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-rose-100">
            <div>
              <p className="text-sm font-bold text-slate-900">Delete Account</p>
              <p className="text-xs text-slate-500 mt-1">Permanently remove your account and all associated data. This action cannot be undone.</p>
            </div>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="px-6 py-3 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 whitespace-nowrap"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
                    <AlertTriangle size={24} />
                  </div>
                  <button 
                    onClick={() => { setShowDeleteConfirm(false); setDeleteStep(1); }}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {deleteStep === 1 ? (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900">Delete Account?</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      This will permanently delete your profile, trading strategies, and history. You will lose access to your KES balance and any active subscriptions.
                    </p>
                    <div className="pt-4 flex gap-3">
                      <button 
                        onClick={() => setDeleteStep(2)}
                        className="flex-1 px-6 py-3 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 transition-all"
                      >
                        I understand, continue
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900">Final Confirmation</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Are you absolutely sure? This is your last chance to turn back. All data will be wiped from our servers.
                    </p>
                    <div className="pt-4 flex flex-col gap-3">
                      <button 
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="w-full px-6 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-all disabled:opacity-50"
                      >
                        {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
                      </button>
                      <button 
                        onClick={() => setDeleteStep(1)}
                        disabled={isDeleting}
                        className="w-full px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                      >
                        Go Back
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Settings;
