import React, { useState, useEffect, useCallback } from "react";
import {
  FiPlus,
  FiMoreVertical,
  FiTarget,
  FiX,
  FiTrendingUp,
  FiEdit2,
  FiTrash2,
  FiDollarSign,
  FiRefreshCw,
} from "react-icons/fi";
import { FaLightbulb, FaPiggyBank, FaWallet } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { goalsApi } from "../../services/api.js";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

// Loading Spinner Component
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <motion.div
      className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
    <p className="text-gray-400 mt-4">{message}</p>
  </div>
);

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    type === "success"
      ? "bg-green-600"
      : type === "error"
      ? "bg-red-600"
      : "bg-blue-600";

  return (
    <motion.div
      className={`fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2`}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
    >
      {type === "success" && <span>✓</span>}
      {type === "error" && <span>✕</span>}
      {message}
    </motion.div>
  );
};

const CircularProgress = ({
  percentage,
  size = 140,
  strokeWidth = 12,
  color = "text-blue-500",
}) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(
      () => setAnimatedPercentage(Math.min(Math.max(percentage, 0), 100)),
      100
    );
    return () => clearTimeout(timer);
  }, [percentage]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercentage / 100) * circumference;
  const center = size / 2;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="text-gray-700"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
        />
        <circle
          className={color}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
            transition: "stroke-dashoffset 0.8s ease-out",
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-white">{`${Math.round(
          animatedPercentage
        )}%`}</span>
        <span className="text-xs text-gray-400">Available</span>
      </div>
    </div>
  );
};

const GoalCard = ({
  goal,
  onDelete,
  onEdit,
  onFund,
  availableSavings,
  isLoading,
}) => {
  const {
    id,
    title,
    current,
    total,
    priority,
    monthly_contribution,
    estimated_completion,
    icon,
    is_completed,
  } = goal;
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [funding, setFunding] = useState(false);

  const currentVal = Number(current) || 0;
  const totalVal = Number(total) || 1;
  const remainingVal = Math.max(totalVal - currentVal, 0);

  const calculatedProgress = (currentVal / totalVal) * 100;
  const displayProgress = Math.min(Math.max(calculatedProgress, 0), 100);

  const priorityColors = {
    high: "bg-red-900/30 text-red-400 border-red-800/50",
    medium: "bg-yellow-900/30 text-yellow-400 border-yellow-800/50",
    low: "bg-green-900/30 text-green-400 border-green-800/50",
  };

  const handleFund = async () => {
    const amount = parseFloat(fundAmount);
    if (amount > 0 && amount <= availableSavings) {
      setFunding(true);
      await onFund(id, amount);
      setFunding(false);
      setFundAmount("");
      setShowFundModal(false);
    }
  };

  return (
    <>
      <motion.div
        className={`bg-gray-800/50 border ${
          is_completed ? "border-green-700/50" : "border-gray-700/50"
        } p-5 rounded-xl relative overflow-hidden`}
        variants={itemVariants}
        layout
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {is_completed && (
          <div className="absolute top-0 right-0 bg-green-600 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
            ✓ Completed
          </div>
        )}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            <div className="text-3xl">{icon}</div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">{title}</h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[priority]}`}
                >
                  {priority}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                ${currentVal.toLocaleString()} of ${totalVal.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition"
            >
              <FiMoreVertical size={18} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  className="absolute right-0 mt-2 w-36 bg-gray-700 rounded-lg shadow-lg z-10 overflow-hidden"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <button
                    onClick={() => {
                      onEdit(goal);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 flex items-center gap-2"
                  >
                    <FiEdit2 size={14} /> Edit Goal
                  </button>
                  <button
                    onClick={() => {
                      onDelete(id);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600 flex items-center gap-2"
                  >
                    <FiTrash2 size={14} /> Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Progress</span>
              <span className="text-gray-300">
                {displayProgress.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <motion.div
                className={`h-2.5 rounded-full ${
                  is_completed
                    ? "bg-green-500"
                    : displayProgress >= 75
                    ? "bg-green-500"
                    : displayProgress >= 50
                    ? "bg-blue-500"
                    : "bg-yellow-500"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${displayProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center text-sm">
            <div className="text-gray-400">
              {is_completed ? (
                <span className="text-green-400">Goal achieved! 🎉</span>
              ) : (
                <>
                  <span className="text-gray-300">
                    ${remainingVal.toLocaleString()}
                  </span>{" "}
                  remaining
                </>
              )}
            </div>
            <div className="text-gray-400">
              Est.{" "}
              <span className="text-gray-300">
                {estimated_completion || "N/A"}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-gray-700/50">
            <div className="text-xs text-gray-500">
              Monthly:{" "}
              <span className="text-gray-300">${monthly_contribution}/mo</span>
            </div>
            {!is_completed && (
              <button
                onClick={() => setShowFundModal(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={availableSavings <= 0 || isLoading}
              >
                <FiPlus size={14} /> Fund
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Fund Modal */}
      <AnimatePresence>
        {showFundModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-800 p-6 rounded-xl w-full max-w-md relative mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <button
                onClick={() => setShowFundModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white"
                disabled={funding}
              >
                <FiX size={20} />
              </button>
              <h2 className="text-xl font-bold text-white mb-2">
                Fund {title}
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                Available from savings:{" "}
                <span className="text-green-400">
                  ${availableSavings?.toLocaleString()}
                </span>
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Remaining for goal:{" "}
                <span className="text-yellow-400">
                  ${remainingVal.toLocaleString()}
                </span>
              </p>
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">
                  Amount to Transfer
                </label>
                <input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  max={Math.min(availableSavings, remainingVal)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter amount"
                  disabled={funding}
                />
                {fundAmount && parseFloat(fundAmount) > availableSavings && (
                  <p className="text-red-400 text-xs mt-1">
                    Amount exceeds available savings
                  </p>
                )}
              </div>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() =>
                    setFundAmount(
                      Math.min(100, availableSavings, remainingVal).toString()
                    )
                  }
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg"
                  disabled={funding}
                >
                  $100
                </button>
                <button
                  onClick={() =>
                    setFundAmount(
                      Math.min(500, availableSavings, remainingVal).toString()
                    )
                  }
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg"
                  disabled={funding}
                >
                  $500
                </button>
                <button
                  onClick={() =>
                    setFundAmount(
                      Math.min(remainingVal, availableSavings).toString()
                    )
                  }
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg"
                  disabled={funding}
                >
                  Complete Goal
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFundModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition"
                  disabled={funding}
                >
                  Cancel
                </button>
                <button
                  onClick={handleFund}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={
                    !fundAmount ||
                    parseFloat(fundAmount) <= 0 ||
                    parseFloat(fundAmount) > availableSavings ||
                    funding
                  }
                >
                  {funding ? (
                    <>
                      <motion.div
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      Processing...
                    </>
                  ) : (
                    "Transfer Funds"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const GoalModal = ({
  isOpen,
  onClose,
  onSave,
  editingGoal = null,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    total: "",
    monthly_contribution: "",
    priority: "medium",
    icon: "🎯",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingGoal) {
      setFormData({
        title: editingGoal.title,
        total: editingGoal.total.toString(),
        monthly_contribution: editingGoal.monthly_contribution.toString(),
        priority: editingGoal.priority,
        icon: editingGoal.icon,
      });
    } else {
      setFormData({
        title: "",
        total: "",
        monthly_contribution: "",
        priority: "medium",
        icon: "🎯",
      });
    }
  }, [editingGoal, isOpen]);

  if (!isOpen) return null;

  const icons = [
    "🎯",
    "💻",
    "✈️",
    "🏠",
    "🚗",
    "📱",
    "🎮",
    "💍",
    "🎓",
    "💼",
    "🏋️",
    "📚",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.title && parseFloat(formData.total) > 0) {
      setSaving(true);
      const goalData = {
        title: formData.title,
        total: parseFloat(formData.total),
        monthly_contribution: parseFloat(formData.monthly_contribution) || 100,
        priority: formData.priority,
        icon: formData.icon,
      };

      await onSave(goalData, editingGoal?.id);
      setSaving(false);
      onClose();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-800 p-6 rounded-xl w-full max-w-md relative max-h-[90vh] overflow-y-auto mx-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white"
          disabled={saving}
        >
          <FiX size={20} />
        </button>
        <h2 className="text-xl font-bold text-white mb-6">
          {editingGoal ? "Edit Goal" : "Add New Goal"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Goal Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., New Car"
              required
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Target Amount ($)
            </label>
            <input
              type="number"
              value={formData.total}
              onChange={(e) =>
                setFormData({ ...formData, total: e.target.value })
              }
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-blue-500 focus:border-blue-500"
              placeholder="10000"
              required
              min="1"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Monthly Contribution ($)
            </label>
            <input
              type="number"
              value={formData.monthly_contribution}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  monthly_contribution: e.target.value,
                })
              }
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-blue-500 focus:border-blue-500"
              placeholder="200"
              min="1"
              disabled={saving}
            />
            <p className="text-xs text-gray-500 mt-1">
              How much you plan to save monthly for this goal
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Priority</label>
            <div className="flex gap-2">
              {["low", "medium", "high"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: p })}
                  disabled={saving}
                  className={`flex-1 py-2 rounded-lg text-sm capitalize transition ${
                    formData.priority === p
                      ? p === "high"
                        ? "bg-red-600 text-white"
                        : p === "medium"
                        ? "bg-yellow-600 text-white"
                        : "bg-green-600 text-white"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {icons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  disabled={saving}
                  className={`p-2 text-xl rounded-lg transition ${
                    formData.icon === icon
                      ? "bg-blue-600 ring-2 ring-blue-400"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg mt-4 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <motion.div
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                {editingGoal ? "Saving..." : "Creating... "}
              </>
            ) : editingGoal ? (
              "Save Changes"
            ) : (
              "Add Goal"
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

const AddSavingsModal = ({ isOpen, onClose, onAddSavings }) => {
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (parsedAmount > 0) {
      setSaving(true);
      await onAddSavings(parsedAmount);
      setSaving(false);
      setAmount("");
      onClose();
    }
  };

  const quickAmounts = [100, 250, 500, 1000];

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-800 p-6 rounded-xl w-full max-w-md relative mx-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white"
          disabled={saving}
        >
          <FiX size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-full bg-green-900/50">
            <FiDollarSign className="text-green-400" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Add Extra Money</h2>
            <p className="text-sm text-gray-400">Boost your savings pool</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Amount ($)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white text-lg focus:ring-green-500 focus:border-green-500"
              placeholder="0.00"
              required
              min="0.01"
              step="0.01"
              disabled={saving}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(amt.toString())}
                disabled={saving}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  amount === amt.toString()
                    ? "bg-green-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                ${amt}
              </button>
            ))}
          </div>

          <div className="bg-gray-700/50 p-4 rounded-lg">
            <p className="text-sm text-gray-400">
              💡 <span className="text-gray-300">Tip:</span> Extra money added
              here goes directly to your available savings and can be allocated
              to any of your goals.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!amount || parseFloat(amount) <= 0 || saving}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  Adding...
                </>
              ) : (
                `Add $${amount || "0"}`
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const Goals = () => {
  // State
  const [goals, setGoals] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddSavingsModalOpen, setIsAddSavingsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [filterPriority, setFilterPriority] = useState("all");

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Toast state
  const [toast, setToast] = useState(null);

  // Financial data from API
  const [financialData, setFinancialData] = useState({
    totalFunds: 0,
    savings: {
      allocated: 0,
      available: 0,
    },
    monthlyIncome: 0,
    monthlySavingsRate: 0,
    totalGoalsAmount: 0,
    totalFunded: 0,
    overallProgress: 0,
    completedGoals: 0,
    totalGoals: 0,
    monthlyContributions: 0,
  });

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // Generate smart suggestion based on goals data
  const getSmartSuggestion = useCallback(() => {
    if (goals.length === 0) {
      return "Start your savings journey by adding your first financial goal!";
    }

    const highPriorityGoals = goals.filter(
      (g) => g.priority === "high" && !g.is_completed
    );
    const lowProgressGoals = goals.filter((g) => {
      const progress = (g.current / g.total) * 100;
      return progress < 25 && !g.is_completed;
    });

    if (highPriorityGoals.length > 0) {
      return `Focus on your high-priority goal "${highPriorityGoals[0].title}" - consider increasing your monthly contribution to reach it faster. `;
    }

    if (lowProgressGoals.length > 0) {
      return `Your goal "${lowProgressGoals[0].title}" needs attention.  Try adding some extra savings this month! `;
    }

    if (financialData.savings.available > 500) {
      return `You have $${financialData.savings.available.toLocaleString()} available.  Consider funding your goals to make progress! `;
    }

    return "Great job managing your goals! Keep up the consistent savings habit.";
  }, [goals, financialData.savings.available]);

  // Fetch all data
  const fetchAllData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      // Fetch goals and savings info in parallel
      const [goalsRes, savingsRes] = await Promise.all([
        goalsApi.getAllGoals(),
        goalsApi.getSavingsInfo(),
      ]);

      // Update goals
      setGoals(goalsRes || []);

      // Update financial data from savings info
      if (savingsRes) {
        setFinancialData({
          totalFunds: Number(savingsRes.total_funds) || 0,
          savings: {
            allocated: Number(savingsRes.savings_allocated) || 0,
            available: Number(savingsRes.savings_available) || 0,
          },
          monthlyIncome: Number(savingsRes.monthly_income) || 0,
          monthlySavingsRate: Number(savingsRes.monthly_savings_rate) || 0,
          totalGoalsAmount: Number(savingsRes.total_goals_amount) || 0,
          totalFunded: Number(savingsRes.total_funded) || 0,
          overallProgress: Number(savingsRes.overall_progress) || 0,
          completedGoals: Number(savingsRes.completed_goals) || 0,
          totalGoals: Number(savingsRes.total_goals) || 0,
          monthlyContributions: Number(savingsRes.monthly_contributions) || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast("Failed to load data.  Please try again.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handle refresh
  const handleRefresh = () => {
    fetchAllData(true);
  };

  // Create or Update Goal
  const handleSaveGoal = async (goalData, goalId = null) => {
    try {
      if (goalId) {
        // Update existing goal (Note: backend doesn't support this yet)
        await goalsApi.updateGoal(goalId, goalData);
        showToast("Goal updated successfully!");
      } else {
        // Create new goal
        await goalsApi.createGoal(goalData);
        showToast("Goal created successfully!");
      }
      setEditingGoal(null);
      await fetchAllData(true);
    } catch (error) {
      console.error("Error saving goal:", error);
      showToast("Failed to save goal.Please try again. ", "error");
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this goal?  Any funded amount will be refunded to your savings. "
      )
    ) {
      return;
    }

    try {
      const result = await goalsApi.deleteGoal(id);
      showToast(
        `Goal deleted!  ${
          result.refunded_amount > 0
            ? `$${result.refunded_amount.toLocaleString()} refunded. `
            : ""
        }`
      );
      await fetchAllData(true);
    } catch (error) {
      console.error("Error deleting goal:", error);
      showToast("Failed to delete goal.Please try again.", "error");
    }
  };

  // Edit Goal
  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  // Fund Goal
  const handleFundGoal = async (goalId, amount) => {
    try {
      const result = await goalsApi.fundGoal(goalId, amount);
      showToast(`Successfully funded $${amount.toLocaleString()}!`);
      await fetchAllData(true);
      return result;
    } catch (error) {
      console.error("Error funding goal:", error);
      showToast(
        error.response?.data?.detail || "Failed to fund goal.Please try again.",
        "error"
      );
      throw error;
    }
  };

  // Add Savings - Updated to match backend (no note parameter)
  const handleAddSavings = async (amount) => {
    try {
      await goalsApi.addSavings(amount);
      showToast(`Successfully added $${amount.toLocaleString()} to savings!`);
      await fetchAllData(true);
    } catch (error) {
      console.error("Error adding savings:", error);
      showToast("Failed to add savings.Please try again.", "error");
    }
  };

  // Filter goals by priority
  const filteredGoals =
    filterPriority === "all"
      ? goals
      : goals.filter((g) => g.priority === filterPriority);

  // Calculate Savings Pool Percentage
  const totalSavingsPool =
    financialData.savings.available + financialData.totalFunded;
  const savingsPoolPercentage =
    totalSavingsPool > 0
      ? (financialData.savings.available / totalSavingsPool) * 100
      : 0;

  // Loading state
  if (loading) {
    return (
      <div className="bg-gray-950 text-gray-200 min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading your goals..." />
      </div>
    );
  }

  return (
    <div className="bg-gray-950 text-gray-200 min-h-screen">
      <motion.div
        className="p-6 lg:p-8 max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8"
          variants={itemVariants}
        >
          <div>
            <h1 className="text-3xl font-bold text-white">Savings & Goals</h1>
            <p className="text-gray-400 mt-1">
              Manage your savings and track progress towards your financial
              goals
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <motion.button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiRefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
            </motion.button>
            <motion.button
              onClick={() => setIsAddSavingsModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-5 rounded-lg flex items-center gap-2 transition"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiDollarSign size={18} />
              <span>Add Money</span>
            </motion.button>
            <motion.button
              onClick={() => {
                setEditingGoal(null);
                setIsModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg flex items-center gap-2 transition"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiPlus size={18} />
              <span>Add New Goal</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Financial Overview Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          variants={itemVariants}
        >
          <div className="bg-gray-800/50 border border-gray-700/50 p-5 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-900/50">
                <FaWallet className="text-blue-400" size={18} />
              </div>
              <span className="text-gray-400 text-sm">Total Funds</span>
            </div>
            <p className="text-2xl font-bold text-white">
              ${financialData.totalFunds.toLocaleString()}
            </p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700/50 p-5 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-green-900/50">
                <FaPiggyBank className="text-green-400" size={18} />
              </div>
              <span className="text-gray-400 text-sm">Available Savings</span>
            </div>
            <p className="text-2xl font-bold text-white">
              ${financialData.savings.available.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Ready to allocate to goals
            </p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700/50 p-5 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-900/50">
                <FiTarget className="text-purple-400" size={18} />
              </div>
              <span className="text-gray-400 text-sm">Goals Progress</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {financialData.overallProgress.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {financialData.completedGoals}/{financialData.totalGoals} goals
              completed
            </p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700/50 p-5 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-yellow-900/50">
                <FiTrendingUp className="text-yellow-400" size={18} />
              </div>
              <span className="text-gray-400 text-sm">
                Monthly Contributions
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              ${financialData.monthlyContributions.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Towards all goals</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Savings Pool & Smart Tip */}
          <div className="lg:col-span-1 space-y-6">
            {/* Savings Pool */}
            <motion.div
              className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-xl"
              variants={itemVariants}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FaPiggyBank className="text-green-400" />
                  Savings Pool
                </h2>
                <button
                  onClick={() => setIsAddSavingsModalOpen(true)}
                  className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-1"
                >
                  <FiPlus size={12} /> Add
                </button>
              </div>
              <div className="flex justify-center mb-4">
                <CircularProgress
                  percentage={savingsPoolPercentage}
                  color="text-green-500"
                />
              </div>
              <div className="text-center mb-4">
                <p className="text-xl font-bold text-white">
                  ${financialData.savings.available.toLocaleString()}
                </p>
                <p className="text-sm text-gray-400">
                  of ${totalSavingsPool.toLocaleString()} total savings
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Monthly Rate</span>
                  <span className="text-gray-200">
                    ${financialData.monthlySavingsRate.toLocaleString()}/mo
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Allocated to Goals</span>
                  <span className="text-gray-200">
                    ${financialData.totalFunded.toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Smart Tip - Generated from goals data */}
            <motion.div
              className="bg-blue-900/20 border border-blue-800/50 p-5 rounded-xl flex gap-4"
              variants={itemVariants}
            >
              <FaLightbulb
                size={24}
                className="text-blue-400 flex-shrink-0 mt-0.5"
              />
              <div>
                <h3 className="font-bold text-white mb-1">Smart Suggestion</h3>
                <p className="text-sm text-gray-300">{getSmartSuggestion()}</p>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Goals */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              className="flex items-center justify-between"
              variants={itemVariants}
            >
              <h2 className="text-xl font-bold text-white">
                My Goals ({goals.length})
              </h2>
              <div className="flex gap-2">
                <select
                  className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-gray-600"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </motion.div>

            {/* Goals Grid */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              variants={containerVariants}
            >
              <AnimatePresence>
                {filteredGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onDelete={handleDeleteGoal}
                    onEdit={handleEditGoal}
                    onFund={handleFundGoal}
                    availableSavings={financialData.savings.available}
                    isLoading={refreshing}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {filteredGoals.length === 0 && !loading && (
              <motion.div
                className="bg-gray-800/50 border border-gray-700/50 border-dashed p-12 rounded-xl text-center"
                variants={itemVariants}
              >
                <FiTarget size={48} className="text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-400 mb-2">
                  {filterPriority === "all"
                    ? "No goals yet"
                    : `No ${filterPriority} priority goals`}
                </h3>
                <p className="text-gray-500 mb-4">
                  {filterPriority === "all"
                    ? "Start by adding your first financial goal"
                    : "Try changing the filter or add a new goal"}
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Add Your First Goal
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Goal Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <GoalModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingGoal(null);
            }}
            onSave={handleSaveGoal}
            editingGoal={editingGoal}
            isLoading={refreshing}
          />
        )}
      </AnimatePresence>

      {/* Add Savings Modal */}
      <AnimatePresence>
        {isAddSavingsModalOpen && (
          <AddSavingsModal
            isOpen={isAddSavingsModalOpen}
            onClose={() => setIsAddSavingsModalOpen(false)}
            onAddSavings={handleAddSavings}
          />
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Goals;
