import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiDollarSign } from 'react-icons/fi';
import { FaPiggyBank } from 'react-icons/fa';
import { FiShield } from 'react-icons/fi';

const AllocateModal = ({ isOpen, onClose, allocateType, onAllocate }) => {
  const [amount, setAmount] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (parsedAmount > 0) {
      onAllocate(parsedAmount, allocateType);
      setAmount('');
      onClose();
    }
  };

  const isSavings = allocateType === 'savings';
  const quickAmounts = [500, 1000, 2000, 5000];

  return (
    <AnimatePresence>
      <motion. div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-md mx-4 p-6 bg-gray-900 border border-gray-700 rounded-xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${isSavings ? 'bg-green-900/50' : 'bg-orange-900/50'}`}>
                {isSavings ?  (
                  <FaPiggyBank className="text-green-400" size={24} />
                ) : (
                  <FiShield className="text-orange-400" size={24} />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-100">
                  Add to {isSavings ? 'Savings' : 'Emergency Fund'}
                </h3>
                <p className="text-sm text-gray-400">
                  {isSavings ? 'Boost your goals fund' : 'Build your safety net'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
              <FiX size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Amount (₹)</label>
              <div className="relative">
                <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-gray-800 text-gray-200 pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-gray-600"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt. toString())}
                  className={`px-4 py-2 rounded-lg text-sm transition ${
                    amount === amt.toString()
                      ? isSavings ?  'bg-green-600 text-white' : 'bg-orange-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  ₹{amt. toLocaleString()}
                </button>
              ))}
            </div>

            <div className="bg-gray-800/50 p-4 rounded-lg">
              <p className="text-sm text-gray-400">
                💡 <span className="text-gray-300">Tip:</span>{' '}
                {isSavings 
                  ? 'Money added here will be available to allocate to your financial goals.'
                  : 'Building an emergency fund protects you from unexpected expenses.'}
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <motion. button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={handleSubmit}
              disabled={!amount || parseFloat(amount) <= 0}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                isSavings 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              Add ₹{amount || '0'}
            </motion. button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AllocateModal;