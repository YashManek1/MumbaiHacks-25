import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

const BudgetAlerts = ({ alerts, onDismiss }) => {
  if (alerts.length === 0) return null;

  const getAlertStyles = (type) => {
    switch (type) {
      case 'error':
        return 'bg-red-950/50 border border-red-900/50 text-red-300';
      case 'success':
        return 'bg-green-950/50 border border-green-900/50 text-green-300';
      case 'warning':
        return 'bg-yellow-950/50 border border-yellow-900/50 text-yellow-300';
      default:
        return 'bg-blue-950/50 border border-blue-900/50 text-blue-300';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'error': return '⚠️';
      case 'success': return '✓';
      case 'warning': return '⚡';
      default: return 'ℹ';
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="mb-6 space-y-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {alerts.slice(0, 4).map((alert) => (
          <motion.div
            key={alert.id}
            className={`px-4 py-3 rounded-lg flex items-center justify-between ${getAlertStyles(alert.type)}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{getAlertIcon(alert.type)}</span>
              <span className="text-sm">{alert.message}</span>
            </div>
            <button 
              onClick={() => onDismiss(alert.id)} 
              className="text-gray-500 hover:text-gray-300 transition"
            >
              <FiX size={16} />
            </button>
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};

export default BudgetAlerts;