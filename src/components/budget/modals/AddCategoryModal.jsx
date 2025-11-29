import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

const ICONS = ["📦", "🎮", "📱", "🎵", "📚", "✈️", "🎁", "💳", "🏋️", "☕", "🍕", "🚗"];

const AddCategoryModal = ({ isOpen, onClose, newCategory, setNewCategory, onAdd }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
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
            <h3 className="text-lg font-semibold text-gray-100">Add Expense Category</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
              <FiX size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Category Name</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e. target.value }))}
                placeholder="e.g., Subscriptions"
                className="w-full bg-gray-800 text-gray-200 px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-gray-600"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Monthly Budget (₹)</label>
              <input
                type="number"
                value={newCategory.allocated}
                onChange={(e) => setNewCategory(prev => ({ ...prev, allocated: e.target.value }))}
                placeholder="5000"
                className="w-full bg-gray-800 text-gray-200 px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-gray-600"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Icon</label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setNewCategory(prev => ({ ...prev, icon }))}
                    className={`p-2 text-xl rounded-lg transition ${
                      newCategory.icon === icon 
                        ? 'bg-gray-700 ring-2 ring-gray-500' 
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <motion.button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={onAdd}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              whileTap={{ scale: 0.98 }}
            >
              Add Category
            </motion. button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddCategoryModal;