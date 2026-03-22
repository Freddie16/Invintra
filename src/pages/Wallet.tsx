import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Wallet as WalletIcon, ArrowUpCircle, ArrowDownCircle, Phone, CreditCard, History, Plus, Target, Trash2, Edit2, Check, X, ShieldAlert } from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AnimatePresence } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Wallet: React.FC = () => {
  const { userProfile, deposit, withdraw, goals, createGoal, deleteGoal, updateGoalAmount, role } = useTrading();
  const isReadOnly = role === 'read-only';
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  
  const [phoneError, setPhoneError] = useState('');
  const [amountError, setAmountError] = useState('');
  
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', targetAmount: 0, deadline: '' });
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  React.useEffect(() => {
    if (amount) validateAmount(amount);
  }, [activeTab]);

  const validatePhone = (phone: string) => {
    if (!phone) {
      setPhoneError('Phone number is required');
      return false;
    }
    if (!phone.match(/^(?:254|\+254|0)?(7|1)\d{8}$/)) {
      setPhoneError('Invalid M-Pesa number (e.g. 0712345678)');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const validateAmount = (val: string) => {
    const num = parseFloat(val);
    if (!val) {
      setAmountError('Amount is required');
      return false;
    }
    if (isNaN(num) || num <= 0) {
      setAmountError('Amount must be greater than 0');
      return false;
    }
    if (activeTab === 'withdraw' && userProfile && num > userProfile.balance) {
      setAmountError('Insufficient balance');
      return false;
    }
    setAmountError('');
    return true;
  };

  const handleAction = async () => {
    const isPhoneValid = validatePhone(phoneNumber);
    const isAmountValid = validateAmount(amount);

    if (!isPhoneValid || !isAmountValid) return;

    const numAmount = parseFloat(amount);

    if (activeTab === 'deposit') {
      await deposit(phoneNumber, numAmount);
    } else {
      await withdraw(phoneNumber, numAmount);
    }
    setAmount('');
  };

  const handleAddGoal = async () => {
    if (!newGoal.name || newGoal.targetAmount <= 0) return;
    await createGoal(newGoal);
    setNewGoal({ name: '', targetAmount: 0, deadline: '' });
    setIsGoalModalOpen(false);
  };

  const handleUpdateGoal = async (id: string) => {
    const val = parseFloat(editAmount);
    if (isNaN(val)) return;
    await updateGoalAmount(id, val);
    setEditingGoalId(null);
    setEditAmount('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Balance Card */}
        <div className="md:col-span-1">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 bg-gradient-to-br from-primary to-indigo-600 text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <WalletIcon size={120} />
            </div>
            <p className="text-primary-foreground/80 text-sm font-medium mb-2 uppercase tracking-wider">Total Balance</p>
            <h2 className="text-4xl font-bold mb-6">KES {userProfile?.balance?.toLocaleString() || '0'}</h2>
            <div className="flex gap-4">
              <div className="flex-1 p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                <p className="text-[10px] uppercase opacity-70 mb-1">Currency</p>
                <p className="font-bold">KES</p>
              </div>
              <div className="flex-1 p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                <p className="text-[10px] uppercase opacity-70 mb-1">Status</p>
                <p className="font-bold text-emerald-300">Active</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Transaction Form */}
        <div className="md:col-span-2">
          <div className="glass-card p-8">
            <div className="flex gap-4 mb-8 p-1 bg-slate-100 rounded-2xl">
              <button 
                onClick={() => setActiveTab('deposit')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all",
                  activeTab === 'deposit' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <ArrowUpCircle size={20} />
                Deposit
              </button>
              <button 
                onClick={() => setActiveTab('withdraw')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all",
                  activeTab === 'withdraw' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <ArrowDownCircle size={20} />
                Withdraw
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">M-Pesa Phone Number</label>
                <div className="relative">
                  <Phone className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                    phoneError ? "text-rose-400" : "text-slate-400"
                  )} size={20} />
                  <input 
                    type="text" 
                    placeholder="0712345678"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      validatePhone(e.target.value);
                    }}
                    className={cn(
                      "w-full bg-slate-50 border rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 transition-all",
                      phoneError 
                        ? "border-rose-200 focus:ring-rose-500/10 focus:border-rose-500" 
                        : "border-slate-200 focus:ring-primary/20 focus:border-primary"
                    )}
                  />
                </div>
                {phoneError && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-rose-500 text-[10px] font-bold mt-2 uppercase tracking-wider"
                  >
                    {phoneError}
                  </motion.p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Amount (KES)</label>
                <div className="relative">
                  <CreditCard className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                    amountError ? "text-rose-400" : "text-slate-400"
                  )} size={20} />
                  <input 
                    type="number" 
                    placeholder="Min 100"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      validateAmount(e.target.value);
                    }}
                    className={cn(
                      "w-full bg-slate-50 border rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 transition-all",
                      amountError 
                        ? "border-rose-200 focus:ring-rose-500/10 focus:border-rose-500" 
                        : "border-slate-200 focus:ring-primary/20 focus:border-primary"
                    )}
                  />
                </div>
                {amountError && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-rose-500 text-[10px] font-bold mt-2 uppercase tracking-wider"
                  >
                    {amountError}
                  </motion.p>
                )}
              </div>

              <button 
                onClick={() => !isReadOnly && handleAction()}
                disabled={isReadOnly}
                className={cn(
                  "w-full py-4 font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2",
                  isReadOnly ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none" : "bg-primary text-white shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                {isReadOnly ? <ShieldAlert size={20} /> : activeTab === 'deposit' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                {isReadOnly ? 'Read-Only Access' : activeTab === 'deposit' ? 'Initiate Deposit' : 'Initiate Withdrawal'}
              </button>

              <p className="text-center text-xs text-slate-400">
                Transactions are processed securely via M-Pesa STK Push.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card p-8">
        {/* ... existing transactions code ... */}
      </div>

      {/* Financial Goals Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-light text-primary rounded-xl">
              <Target size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Financial Goals</h3>
          </div>
          <button 
            onClick={() => !isReadOnly && setIsGoalModalOpen(true)}
            disabled={isReadOnly}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all",
              isReadOnly ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-primary text-white hover:bg-primary-dark"
            )}
          >
            <Plus size={18} />
            Add Goal
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            return (
              <motion.div 
                key={goal.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6 group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">{goal.name}</h4>
                    <p className="text-xs text-slate-400">Target: KES {goal.targetAmount.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        if (!isReadOnly) {
                          setEditingGoalId(goal.id);
                          setEditAmount(goal.currentAmount.toString());
                        }
                      }}
                      disabled={isReadOnly}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        isReadOnly ? "text-slate-300 cursor-not-allowed" : "text-slate-400 hover:text-primary hover:bg-primary-light"
                      )}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => !isReadOnly && deleteGoal(goal.id)}
                      disabled={isReadOnly}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        isReadOnly ? "text-slate-300 cursor-not-allowed" : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      )}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-bold text-primary">KES {goal.currentAmount.toLocaleString()}</span>
                    <span className="text-sm font-bold text-slate-400">{progress.toFixed(1)}%</span>
                  </div>
                  
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className={cn(
                        "h-full transition-all duration-1000",
                        progress >= 100 ? "bg-emerald-500" : "bg-primary"
                      )}
                    />
                  </div>

                  {editingGoalId === goal.id && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pt-4 flex gap-2"
                    >
                      <input 
                        type="number" 
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Update current amount"
                      />
                      <button 
                        onClick={() => handleUpdateGoal(goal.id)}
                        className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        onClick={() => setEditingGoalId(null)}
                        className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-all"
                      >
                        <X size={16} />
                      </button>
                    </motion.div>
                  )}

                  {goal.deadline && (
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest pt-2">
                      Deadline: {new Date(goal.deadline).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
          {goals.length === 0 && (
            <div className="md:col-span-2 py-12 text-center glass-card border-dashed border-2 border-slate-200 bg-transparent">
              <p className="text-slate-400 italic">No financial goals set yet. Start planning your future today!</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {isGoalModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsGoalModalOpen(false)} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary-light text-primary rounded-xl">
                  <Target size={24} />
                </div>
                <h3 className="text-xl font-bold">Set New Goal</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Goal Name</label>
                  <input 
                    type="text" 
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                    placeholder="e.g. New Car, Retirement"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Target Amount (KES)</label>
                  <input 
                    type="number" 
                    value={newGoal.targetAmount || ''}
                    onChange={(e) => setNewGoal({ ...newGoal, targetAmount: parseFloat(e.target.value) })}
                    placeholder="e.g. 1,000,000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Target Deadline (Optional)</label>
                  <input 
                    type="date" 
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setIsGoalModalOpen(false)} 
                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddGoal}
                    className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
                  >
                    Set Goal
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Wallet;
