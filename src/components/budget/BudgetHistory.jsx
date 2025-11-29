import React from 'react';
import { motion } from 'framer-motion';

const BudgetHistory = ({ historyData, selectedYear }) => {
  return (
    <motion.div 
      className="mb-8 p-6 bg-gray-900/50 border border-gray-800 rounded-xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-6">
        6-Month History
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase">
              <th className="text-left pb-3">Month</th>
              <th className="text-right pb-3">Budget</th>
              <th className="text-right pb-3">Spent</th>
              <th className="text-right pb-3">Saved</th>
              <th className="text-right pb-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {historyData.map((month, idx) => (
              <motion.tr
                key={idx}
                className="text-gray-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <td className="py-3">{month.month} {selectedYear}</td>
                <td className="py-3 text-right">₹{month.budget.toLocaleString()}</td>
                <td className="py-3 text-right">₹{month.spent. toLocaleString()}</td>
                <td className={`py-3 text-right font-medium ${
                  month.saved >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {month.saved >= 0 ? '+' : ''}₹{month.saved.toLocaleString()}
                </td>
                <td className="py-3 text-right">
                  <span className={`px-2 py-1 rounded text-xs ${
                    month.saved >= 0 
                      ? 'bg-green-900/50 text-green-300' 
                      : 'bg-red-900/50 text-red-300'
                  }`}>
                    {month.saved >= 0 ? 'Saved' : 'Over'}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default BudgetHistory;