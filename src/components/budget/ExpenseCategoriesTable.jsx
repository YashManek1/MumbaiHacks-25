import React from 'react';
import { motion } from 'framer-motion';
import { FiPlus } from 'react-icons/fi';
import ExpenseCategoryRow from './ExpenseCategoryRow';

const ExpenseCategoriesTable = ({
  categories,
  totals,
  editingCategory,
  setEditingCategory,
  onAddClick,
  onEdit,
  onSave,
  onCancelEdit,
  onDelete
}) => {
  return (
    <motion. div 
      className="mb-8 bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
          Expense Categories
        </h2>
        <motion.button
          onClick={onAddClick}
          className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FiPlus size={16} /> Add Category
        </motion. button>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-900/80 text-xs font-medium text-gray-500 uppercase tracking-wide">
        <div className="col-span-4">Category</div>
        <div className="col-span-2 text-right">Allocated</div>
        <div className="col-span-2 text-right">Spent</div>
        <div className="col-span-2 text-right">Remaining</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-800/50">
        {categories. map((category, idx) => (
          <ExpenseCategoryRow
            key={category. id}
            category={category}
            index={idx}
            isEditing={editingCategory?. id === category.id}
            editingCategory={editingCategory}
            setEditingCategory={setEditingCategory}
            onEdit={onEdit}
            onSave={onSave}
            onCancelEdit={onCancelEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Table Footer */}
      <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-900/80 border-t border-gray-800 font-medium">
        <div className="col-span-4 text-gray-300">Total Expenses</div>
        <div className="col-span-2 text-right text-gray-300">
          ₹{totals.expenseAllocated.toLocaleString()}
        </div>
        <div className="col-span-2 text-right text-gray-300">
          ₹{totals.expenseSpent.toLocaleString()}
        </div>
        <div className="col-span-2 text-right">
          <span className={totals.remaining >= 0 ?  'text-green-400' : 'text-red-400'}>
            {totals.remaining >= 0 ? '' : '-'}₹{Math.abs(totals.remaining). toLocaleString()}
          </span>
        </div>
        <div className="col-span-2"></div>
      </div>
    </motion.div>
  );
};

export default ExpenseCategoriesTable;