import React, { useState, useEffect, useCallback } from 'react';
import { FiEyeOff, FiEye, FiArrowUp, FiArrowDown, FiDollarSign, FiTrendingUp, FiTarget, FiLoader, FiAlertTriangle, FiCheckCircle, FiXCircle, FiSearch, FiPlayCircle, FiRefreshCw } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// --- Helper Functions & Mappings ---
const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(value);

const actionIcons = {
  secure_savings: <FiTarget className="text-blue-400" />,
  activate_famine_mode: <FiAlertTriangle className="text-orange-400" />,
  propose_budget_investigation: <FiSearch className="text-purple-400" />,
  default: <FiTrendingUp className="text-gray-400" />,
};

const getActionIcon = (functionName) => actionIcons[functionName] || actionIcons.default;

// --- API Call Helpers ---
const apiRequest = async (url, options) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    ...options,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'An unknown API error occurred.' }));
    throw new Error(errorData.detail);
  }
  return response.json();
};

// --- Components ---

const StatCard = ({ title, value, icon, isLoading }) => (
  <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700/50">
    <div className="flex items-center gap-4">
      <div className="bg-gray-900/50 p-3 rounded-lg">{icon}</div>
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        {isLoading ? <div className="h-8 flex items-center"><FiLoader className="animate-spin text-blue-400" /></div> : <p className="text-2xl font-bold text-white">{value}</p>}
      </div>
    </div>
  </div>
);

const ActionItem = ({ item, onAction, isHistory }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleActionClick = async (actionType) => {
    setIsSubmitting(true);
    await onAction(item.id, actionType);
    // No need to set isSubmitting to false, as the component will be removed from the list
  };

  const statusBadge = {
    EXECUTED: <span className="flex items-center gap-1 text-xs text-green-400"><FiCheckCircle /> Executed</span>,
    DISMISSED: <span className="flex items-center gap-1 text-xs text-red-400"><FiXCircle /> Dismissed</span>,
    PENDING: <span className="flex items-center gap-1 text-xs text-yellow-400"><FiLoader className="animate-spin" /> Pending</span>,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
      className="bg-gray-800/70 p-5 rounded-lg border border-gray-700/60 relative overflow-hidden"
    >
      {isSubmitting && <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center z-10"><FiLoader className="animate-spin text-white text-2xl" /></div>}
      <div className="flex items-start gap-4">
        <div className="mt-1">{getActionIcon(item.function_name)}</div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-white pr-4">{item.title}</h3>
            {isHistory && statusBadge[item.status]}
          </div>
          <p className="text-sm text-gray-300 mt-1">{item.reasoning}</p>
          {!isHistory && (
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => handleActionClick('execute')} className="bg-green-500/20 hover:bg-green-500/30 text-green-300 font-semibold py-1.5 px-4 rounded-lg text-sm transition-colors">Approve</button>
              <button onClick={() => handleActionClick('dismiss')} className="bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold py-1.5 px-4 rounded-lg text-sm transition-colors">Dismiss</button>
              {item.function_name === 'propose_budget_investigation' && (
                <button onClick={() => handleActionClick('investigate')} className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-semibold py-1.5 px-4 rounded-lg text-sm transition-colors">Investigate</button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const DashBoard = () => {
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [stats, setStats] = useState({ totalBalance: 0, monthlySpending: 0, emergencyFundTarget: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [actions, setActions] = useState({ pending: [], history: [] });
  const [loadingActions, setLoadingActions] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    // Reset states
    setLoadingStats(true);
    setLoadingActions(true);
    setError('');

    // --- Fetch Stats Data ---
    try {
      const [overviewRes, transactionsRes] = await Promise.all([
        apiRequest('api/v1/analysis/overview', {}),
        apiRequest('api/v1/transactions/', {}),
      ]);
      const totalBalance = transactionsRes.reduce((acc, tx) => acc + tx.amount, 0);
      const monthlySpending = Object.values(overviewRes.actual_spending).reduce((sum, val) => sum + val, 0);
      setStats({ totalBalance, monthlySpending, emergencyFundTarget: overviewRes.emergency_fund.target_amount });
    } catch (err) {
      setError(prev => prev ? `${prev}\nFailed to load stats: ${err.message}` : `Failed to load stats: ${err.message}`);
    } finally {
      setLoadingStats(false);
    }

    // --- Fetch Actions Data ---
    try {
      const [pendingRes, historyRes] = await Promise.all([
        apiRequest('api/v1/agent/actions/pending', {}),
        apiRequest('api/v1/agent/actions/history', {}),
      ]);
      setActions({ pending: pendingRes, history: historyRes });
    } catch (err) {
      setError(prev => prev ? `${prev}\nFailed to load actions: ${err.message}` : `Failed to load actions: ${err.message}`);
    } finally {
      setLoadingActions(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleAgentAction = async (actionId, actionType) => {
    try {
      await apiRequest(`api/v1/agent/actions/${actionId}/${actionType}`, { method: 'POST' });
      // Refresh data after action
      const [pendingRes, historyRes] = await Promise.all([
        apiRequest('api/v1/agent/actions/pending', {}),
        apiRequest('api/v1/agent/actions/history', {}),
      ]);
      setActions({ pending: pendingRes, history: historyRes });
    } catch (err) {
      setError(`Failed to ${actionType} action: ${err.message}`);
    }
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setError('');
    try {
      await apiRequest('api/v1/agent/analyze', { method: 'POST' });
      // Poll for new actions after a short delay
      setTimeout(async () => {
        const pendingRes = await apiRequest('api/v1/agent/actions/pending', {});
        setActions(prev => ({ ...prev, pending: pendingRes }));
        setIsAnalyzing(false);
      }, 3000); // Wait 3 seconds for analysis to complete
    } catch (err) {
      setError(`Analysis trigger failed: ${err.message}`);
      setIsAnalyzing(false);
    }
  };

  const displayedActions = activeTab === 'pending' ? actions.pending : actions.history;

  return (
    <div className="bg-[#1a202c] text-gray-200 p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Your AI-powered financial command center.</p>
        </div>
        <button onClick={handleRunAnalysis} disabled={isAnalyzing} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:bg-gray-600 disabled:cursor-not-allowed">
          {isAnalyzing ? <FiLoader className="animate-spin" /> : <FiPlayCircle />}
          <span>{isAnalyzing ? 'Analyzing...' : 'Run Analysis'}</span>
        </button>
      </div>

      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md mb-6 whitespace-pre-wrap">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Custom Total Balance Card */}
        <div className="md:col-span-1 bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-xl border border-blue-500/50 flex flex-col justify-between">
          <div>
            <p className="text-sm text-blue-200">Total Balance</p>
            {loadingStats ? (
              <div className="h-10 flex items-center mt-2"><FiLoader className="animate-spin text-white" /></div>
            ) : (
              <p className="text-3xl font-bold text-white mt-1">{formatCurrency(stats.totalBalance)}</p>
            )}
          </div>
          <p className="text-xs text-blue-300/70 mt-4">This is the net sum of all your transactions.</p>
        </div>

        {/* Other Stat Cards */}
        <StatCard title="Monthly Spending" value={formatCurrency(stats.monthlySpending)} icon={<FiDollarSign />} isLoading={loadingStats} />
        <StatCard title="Emergency Fund Target" value={formatCurrency(stats.emergencyFundTarget)} icon={<FiTarget />} isLoading={loadingStats} />
      </div>

      <div className="grid grid-cols-1">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Agent Action Stream</h2>
            <div className="flex items-center gap-2 bg-gray-800/50 p-1 rounded-lg">
              <button onClick={() => setActiveTab('pending')} className={`px-3 py-1 text-sm font-semibold rounded-md ${activeTab === 'pending' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>Pending ({actions.pending.length})</button>
              <button onClick={() => setActiveTab('history')} className={`px-3 py-1 text-sm font-semibold rounded-md ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>History</button>
            </div>
          </div>
          <div className="space-y-4">
            {loadingActions ? (
              <div className="text-center py-10 bg-gray-800/50 rounded-lg"><FiLoader className="animate-spin text-blue-400 mx-auto text-2xl" /></div>
            ) : (
              <AnimatePresence>
                {displayedActions.length > 0 ? (
                  displayedActions.map(item => <ActionItem key={item.id} item={item} onAction={handleAgentAction} isHistory={activeTab === 'history'} />)
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 bg-gray-800/50 rounded-lg">
                    <p className="text-gray-400">No {activeTab} actions. All caught up!</p>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashBoard;
