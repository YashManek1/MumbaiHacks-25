import React from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiDownload, FiRefreshCw, FiCpu, FiZap, FiLoader } from 'react-icons/fi';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const QuickActions = ({ 
  onAddCategory, 
  onExport, 
  onRefresh, 
  onAnalysis,
  onGenerateBudget,
  isGeneratingBudget 
}) => {
  const actions = [
    {
      icon: <FiPlus size={20} />,
      label: "Add Category",
      description: "Create a new expense category",
      onClick: onAddCategory,
      color: "from-blue-600 to-blue-700",
      hoverColor: "hover:from-blue-500 hover:to-blue-600"
    },
    {
      icon: <FiDownload size={20} />,
      label: "Export CSV",
      description: "Download budget data",
      onClick: onExport,
      color: "from-green-600 to-green-700",
      hoverColor: "hover:from-green-500 hover:to-green-600"
    },
    {
      icon: <FiRefreshCw size={20} />,
      label: "Refresh Data",
      description: "Sync with latest data",
      onClick: onRefresh,
      color: "from-purple-600 to-purple-700",
      hoverColor: "hover:from-purple-500 hover:to-purple-600"
    },
    {
      icon: <FiCpu size={20} />,
      label: "AI Analysis",
      description: "Get smart insights",
      onClick: onAnalysis,
      color: "from-orange-600 to-orange-700",
      hoverColor: "hover:from-orange-500 hover:to-orange-600"
    },
  ];

  // Add AI Generate action if handler is provided
  if (onGenerateBudget) {
    actions.push({
      icon: isGeneratingBudget ? <FiLoader size={20} className="animate-spin" /> : <FiZap size={20} />,
      label: isGeneratingBudget ? "Generating..." : "AI Generate Budget",
      description: "Auto-generate optimal budget",
      onClick: isGeneratingBudget ? () => {} : onGenerateBudget,
      color: "from-cyan-600 to-blue-600",
      hoverColor: isGeneratingBudget ? "" : "hover:from-cyan-500 hover:to-blue-500",
      disabled: isGeneratingBudget
    });
  }

  return (
    <motion.div variants={itemVariants} className="mt-8">
      <h2 className="text-xl font-semibold text-gray-100 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {actions.map((action, index) => (
          <motion.button
            key={index}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`p-4 rounded-xl bg-gradient-to-br ${action.color} ${action.hoverColor} 
              text-white text-left transition-all duration-200 
              ${action.disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            whileHover={!action.disabled ?  { scale: 1.02, y: -2 } : {}}
            whileTap={!action.disabled ? { scale: 0.98 } : {}}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                {action.icon}
              </div>
            </div>
            <h3 className="font-semibold text-sm">{action.label}</h3>
            <p className="text-xs text-white/70 mt-1">{action.description}</p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default QuickActions;