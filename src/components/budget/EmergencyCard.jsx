import React from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiShield } from 'react-icons/fi';

const EmergencyCard = ({ emergency, emergencyPercentage, onAddClick }) => {
  return (
    <div className="bg-gradient-to-br from-orange-900/30 to-gray-900/50 border border-orange-800/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-orange-900/50">
            <FiShield className="text-orange-400" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Emergency Fund</h3>
            <p className="text-sm text-gray-400">6 months target</p>
          </div>
        </div>
        <button
          onClick={onAddClick}
          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg transition flex items-center gap-1"
        >
          <FiPlus size={14} /> Add
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Total Accumulated</span>
          <span className="text-orange-400 font-medium">
            ₹{emergency.current.toLocaleString()} / ₹{emergency.target.toLocaleString()}
          </span>
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(emergencyPercentage, 100)}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Monthly: ₹{emergency.allocated.toLocaleString()}</span>
          <span>{emergencyPercentage.toFixed(0)}% funded</span>
        </div>
      </div>
    </div>
  );
};

export default EmergencyCard;