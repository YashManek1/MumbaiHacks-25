import React from 'react';
import { motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';

const ExpenseCategoryRow = ({ 
  category, 
  index, 
  isEditing, 
  editingCategory,
  setEditingCategory,
  onEdit, 
  onSave, 
  onCancelEdit, 
  onDelete 
}) => {
  const remaining = category.allocated - category.spent;
  const percentage = (category.spent / category.allocated) * 100;
  const isOver = remaining < 0;

  const getProgressColor = () => {
    if (percentage > 100) return 'bg-red-500';
    if (percentage > 80) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <motion.div
      className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition ${
        isOver ? 'bg-red-950/20' : 'hover:bg-gray-800/30'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.03 }}
    >
      {/* Category Name & Progress */}
      <div className="col-span-4 flex items-center gap-3">
        <span className="text-xl">{category.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-gray-200 font-medium truncate">{category. name}</p>
            {category.adjusted && (
              <span className="px-1. 5 py-0.5 bg-green-900/50 text-green-400 text-xs rounded">
                Adjusted
              </span>
            )}
          </div>
          <div className="mt-1 h-1. 5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${getProgressColor()}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentage, 100)}%` }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            />
          </div>
        </div>
      </div>

      {/* Allocated */}
      <div className="col-span-2 text-right">
        {isEditing ? (
          <input
            type="number"
            value={editingCategory.allocated}
            onChange={(e) => setEditingCategory(prev => ({ 
              ...prev, 
              allocated: parseFloat(e.target.value) || 0 
            }))}
            className="w-full bg-gray-800 text-gray-200 text-sm px-2 py-1 rounded border border-gray-700 text-right"
          />
        ) : (
          <span className="text-gray-300">₹{category.allocated.toLocaleString()}</span>
        )}
      </div>

      {/* Spent */}
      <div className="col-span-2 text-right">
        <span className={isOver ? 'text-red-400' : 'text-gray-300'}>
          ₹{category.spent.toLocaleString()}
        </span>
      </div>

      {/* Remaining */}
      <div className="col-span-2 text-right">
        <span className={`font-medium ${remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {remaining >= 0 ? '' : '-'}₹{Math.abs(remaining).toLocaleString()}
        </span>
      </div>

      {/* Actions */}
      <div className="col-span-2 flex justify-end gap-1">
        {isEditing ? (
          <>
            <motion.button 
              onClick={onSave} 
              className="p-1. 5 text-green-400 hover:bg-green-900/30 rounded" 
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.button>
            <motion.button 
              onClick={onCancelEdit} 
              className="p-1.5 text-gray-400 hover:bg-gray-800 rounded" 
              whileTap={{ scale: 0.9 }}
            >
              <FiX size={16} />
            </motion.button>
          </>
        ) : (
          <>
            <motion.button 
              onClick={() => onEdit(category)} 
              className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded" 
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15. 232 5.232l3.536 3.536m-2.036-5.036a2. 5 2.5 0 113.536 3.536L6.5 21. 036H3v-3.572L16.732 3.732z" />
              </svg>
            </motion.button>
            <motion. button 
              onClick={() => onDelete(category. id)} 
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded" 
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-. 867 12.142A2 2 0 0116. 138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default ExpenseCategoryRow;