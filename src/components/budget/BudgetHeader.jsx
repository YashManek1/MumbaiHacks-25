import React from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiAlertTriangle, FiCpu, FiLoader, FiZap } from 'react-icons/fi';

const BudgetHeader = ({
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  hasOverages,
  onStartAnalysis,
  onGenerateBudget,
  isGeneratingBudget,
  months
}) => {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="bg-gray-900/50 border-b border-gray-800 px-6 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title Section */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-100">
              Budget Overview
            </h1>
            <p className="text-gray-400 mt-1">
              Track and manage your monthly budget allocations
            </p>
          </div>

          {/* Controls Section */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Month Selector */}
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
              <FiCalendar className="text-gray-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-transparent text-gray-200 text-sm focus:outline-none cursor-pointer"
              >
                {months.map((month, idx) => (
                  <option key={month} value={idx} className="bg-gray-800">
                    {month}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Selector */}
            <div className="bg-gray-800 rounded-lg px-3 py-2">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-transparent text-gray-200 text-sm focus:outline-none cursor-pointer"
              >
                {years. map((year) => (
                  <option key={year} value={year} className="bg-gray-800">
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* AI Generate Budget Button */}
            {onGenerateBudget && (
              <motion.button
                onClick={onGenerateBudget}
                disabled={isGeneratingBudget}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  isGeneratingBudget
                    ? 'bg-purple-500/30 text-purple-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white'
                }`}
                whileHover={! isGeneratingBudget ?  { scale: 1.02 } : {}}
                whileTap={!isGeneratingBudget ?  { scale: 0.98 } : {}}
              >
                {isGeneratingBudget ? (
                  <FiLoader className="animate-spin" size={16} />
                ) : (
                  <FiZap size={16} />
                )}
                <span>{isGeneratingBudget ? 'Generating...' : 'AI Generate'}</span>
              </motion.button>
            )}

            {/* AI Analysis Button */}
            <motion.button
              onClick={onStartAnalysis}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                hasOverages
                  ? 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border border-orange-500/30'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {hasOverages ? (
                <FiAlertTriangle size={16} />
              ) : (
                <FiCpu size={16} />
              )}
              <span>{hasOverages ? 'Review Overages' : 'AI Analysis'}</span>
            </motion. button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetHeader;