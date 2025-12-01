import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiPlus, FiArrowRight } from 'react-icons/fi';
import { FaPiggyBank } from 'react-icons/fa';

const SavingsCard = ({ savings, savingsPercentage, onAddClick }) => {
  return (
    <div className="bg-gradient-to-br from-green-900/30 to-gray-900/50 border border-green-800/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-green-900/50">
            <FaPiggyBank className="text-green-400" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Monthly Savings</h3>
            <p className="text-sm text-gray-400">Feeds into your Goals</p>
          </div>
        </div>
        <button
          onClick={onAddClick}
          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition flex items-center gap-1"
        >
          <FiPlus size={14} /> Add
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Contributed</span>
          <span className="text-green-400 font-medium">
            ₹{savings.contributed.toLocaleString()} / ₹{savings.allocated.toLocaleString()}
          </span>
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(savingsPercentage, 100)}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            Available for goals: ₹{savings.available.toLocaleString()}
          </span>
          <Link 
            to="/app/goals" 
            className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
          >
            Manage Goals <FiArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SavingsCard;