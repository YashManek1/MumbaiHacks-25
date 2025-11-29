import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

const AIAgentPanel = ({
  isOpen,
  onClose,
  agentActive,
  agentTyping,
  agentMessages,
  pendingAdjustments,
  onAdjustmentChoice,
  onApplyAll
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-2xl max-h-[90vh] bg-gray-900 border border-gray-700 rounded-xl flex flex-col overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-xl">🤖</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-100">Budget AI Agent</h3>
                <p className="text-xs text-gray-500">
                  {agentActive ? 'Analyzing.. .' : 'Analysis complete'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {agentMessages.map((msg) => (
              <motion.div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className={`max-w-[80%] px-4 py-3 rounded-xl ${
                  msg.type === 'user' ?  'bg-gray-700 text-gray-200' : 'bg-gray-800 text-gray-300'
                }`}>
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{msg.timestamp}</p>
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            {agentTyping && (
              <motion.div 
                className="flex justify-start" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
              >
                <div className="bg-gray-800 px-4 py-3 rounded-xl">
                  <div className="flex gap-1">
                    {[0, 0.1, 0.2]. map((delay, i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-gray-500 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay }}
                      />
                    ))}
                  </div>
                </div>
              </motion. div>
            )}

            {/* Pending Adjustments */}
            {pendingAdjustments.filter(a => a.status === 'pending'). map((adjustment) => (
              <motion. div
                key={adjustment.id}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{adjustment.categoryIcon}</span>
                  <div>
                    <h4 className="text-gray-200 font-medium">{adjustment.categoryName}</h4>
                    <p className="text-sm text-red-400">
                      Over budget by ₹{adjustment.overage.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Choose an option:</p>
                  {adjustment.options.map((option, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => onAdjustmentChoice(adjustment.id, option.type)}
                      className="w-full p-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg text-left transition"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <p className="text-gray-200 font-medium text-sm">{option.label}</p>
                      <p className="text-gray-500 text-xs mt-1">{option.description}</p>
                    </motion.button>
                  ))}
                  
                  <div className="flex gap-2 mt-2">
                    <input
                      type="number"
                      placeholder="Custom amount"
                      className="flex-1 bg-gray-900 text-gray-200 text-sm px-3 py-2 rounded-lg border border-gray-700"
                      id={`custom-${adjustment.id}`}
                    />
                    <motion.button
                      onClick={() => {
                        const input = document.getElementById(`custom-${adjustment. id}`);
                        if (input?. value) onAdjustmentChoice(adjustment.id, 'custom', input.value);
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded-lg"
                      whileTap={{ scale: 0.98 }}
                    >
                      Set Custom
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Apply All Buttons */}
            {pendingAdjustments.filter(a => a.status === 'pending').length > 1 && (
              <motion.div 
                className="flex gap-2 pt-4 border-t border-gray-800" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
              >
                <motion.button 
                  onClick={() => onApplyAll('keep_same')} 
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg" 
                  whileTap={{ scale: 0.98 }}
                >
                  Keep All Same
                </motion. button>
                <motion.button 
                  onClick={() => onApplyAll('adjust_increase')} 
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg" 
                  whileTap={{ scale: 0.98 }}
                >
                  Adjust All
                </motion.button>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {pendingAdjustments.filter(a => a.status === 'pending').length} adjustments pending
            </p>
            <motion.button 
              onClick={onClose} 
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg" 
              whileTap={{ scale: 0.98 }}
            >
              {pendingAdjustments.filter(a => a.status === 'pending').length === 0 ? 'Done' : 'Minimize'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIAgentPanel;