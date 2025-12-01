import React from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiDollarSign } from 'react-icons/fi';
import { FaPiggyBank, FaWallet } from 'react-icons/fa';

const OverviewCards = ({ budgetData, totals, savingsPercentage }) => {
  const cards = [
    {
      icon: FaWallet,
      iconBg: 'bg-blue-900/50',
      iconColor: 'text-blue-400',
      label: 'Monthly Income',
      value: `₹${budgetData.monthlyIncome.toLocaleString()}`,
      subtitle: null
    },
    {
      icon: FiTrendingUp,
      iconBg: 'bg-red-900/50',
      iconColor: 'text-red-400',
      label: 'Total Expenses',
      value: `₹${totals.expenseSpent.toLocaleString()}`,
      subtitle: `of ₹${totals.expenseAllocated.toLocaleString()} budgeted`
    },
    {
      icon: FaPiggyBank,
      iconBg: 'bg-green-900/50',
      iconColor: 'text-green-400',
      label: 'Savings This Month',
      value: `₹${budgetData.savings.contributed.toLocaleString()}`,
      subtitle: `${savingsPercentage.toFixed(0)}% of goal`
    },
    {
      icon: FiDollarSign,
      iconBg: 'bg-purple-900/50',
      iconColor: 'text-purple-400',
      label: 'Available to Save',
      value: `₹${Math.abs(totals.availableToSave). toLocaleString()}`,
      valueColor: totals.availableToSave >= 0 ? 'text-green-400' : 'text-red-400',
      subtitle: 'After all expenses'
    }
  ];

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {cards.map((card, index) => (
        <motion.div
          key={index}
          className="bg-gray-800/50 border border-gray-700/50 p-5 rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${card.iconBg}`}>
              <card.icon className={card.iconColor} size={18} />
            </div>
            <span className="text-gray-400 text-sm">{card.label}</span>
          </div>
          <p className={`text-2xl font-bold ${card.valueColor || 'text-white'}`}>
            {card.value}
          </p>
          {card.subtitle && (
            <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default OverviewCards;