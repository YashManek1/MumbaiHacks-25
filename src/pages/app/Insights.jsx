import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FiArrowDown, FiDollarSign, FiTrendingUp, FiLoader, FiAlertCircle } from 'react-icons/fi';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff4d6d', '#a2d2ff', '#ffc8dd'];

// --- Components ---

const StatCard = ({ title, value, icon, isLoading }) => (
  <div className="bg-gray-800 p-5 rounded-lg">
    <div className="flex items-center gap-4">
      <div className="bg-gray-700 p-3 rounded-lg">{icon}</div>
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        {isLoading ? (
          <div className="h-8 flex items-center"><FiLoader className="animate-spin text-blue-400" /></div>
        ) : (
          <p className="text-2xl font-bold text-white">{value}</p>
        )}
      </div>
    </div>
  </div>
);

const BudgetPieChart = ({ data, isLoading }) => (
  <div className="bg-gray-800 p-6 rounded-lg h-full">
    <h2 className="text-xl font-bold text-white mb-4">Budget Allocation</h2>
    <ResponsiveContainer width="100%" height={500}>
      {isLoading ? (
        <div className="flex items-center justify-center h-full"><FiLoader className="animate-spin text-blue-400 text-3xl" /></div>
      ) : data && data.length > 0 ? (
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${(percent * 1).toFixed(0)}%`}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name, props) => [`${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)} (${props.payload.percent.toFixed(0)}%)`, name]} />
          <Legend />
        </PieChart>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">No budget data available.</div>
      )}
    </ResponsiveContainer>
  </div>
);

const BudgetVsActualChart = ({ data, isLoading }) => (
  <div className="bg-gray-800 p-6 rounded-lg">
    <h2 className="text-xl font-bold text-white mb-4">Budget vs. Actual Spending</h2>
    <ResponsiveContainer width="100%" height={500}>
      {isLoading ? (
        <div className="flex items-center justify-center h-full"><FiLoader className="animate-spin text-blue-400 text-3xl" /></div>
      ) : (
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis type="number" stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `₹${value / 1000}k`} />
          <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={10} width={100} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
            formatter={(value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)}
          />
          <Legend />
          <Bar dataKey="budget" fill="#00C49F" name="Budgeted" />
          <Bar dataKey="actual" fill="#FF8042" name="Actual" />
        </BarChart>
      )}
    </ResponsiveContainer>
  </div>
);

const Insights = () => {
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}api/v1/analysis/overview`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch insights data.');
        }
        const data = await response.json();
        setOverviewData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(value);

  const { totalIncome, totalSpending, budgetAllocationData, budgetVsActualData } = useMemo(() => {
    if (!overviewData) return { totalIncome: 0, totalSpending: 0, budgetAllocationData: [], budgetVsActualData: [] };

    const totalIncome = Object.values(overviewData.budget_plan.breakdown).reduce((sum, item) => sum + item.amount, 0);
    const totalSpending = Object.values(overviewData.actual_spending).reduce((sum, value) => sum + value, 0);

    const budgetAllocationData = Object.entries(overviewData.budget_plan.breakdown)
      .map(([name, { amount, percent }]) => ({ name, value: amount, percent }));

    const budgetVsActualData = Object.keys(overviewData.budget_plan.breakdown).map(category => ({
      name: category,
      budget: overviewData.budget_plan.breakdown[category].amount,
      actual: overviewData.actual_spending[category] || 0,
    }));

    return { totalIncome, totalSpending, budgetAllocationData, budgetVsActualData };
  }, [overviewData]);

  return (
    <div className="bg-[#1a202c] text-gray-200 p-8 h-full overflow-y-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Financial Insights</h1>

      {error && (
        <div className="bg-red-500/20 text-red-300 p-4 rounded-md mb-8 flex items-center gap-3">
          <FiAlertCircle /> {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard title="Monthly Income" value={formatCurrency(totalIncome)} icon={<FiDollarSign size={22} />} isLoading={loading} />
        <StatCard title="Monthly Spending" value={formatCurrency(totalSpending)} icon={<FiArrowDown size={22} className="text-red-400" />} isLoading={loading} />
        <StatCard title="Emergency Fund Target" value={formatCurrency(overviewData?.emergency_fund?.target_amount || 0)} icon={<FiTrendingUp size={22} />} isLoading={loading} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <BudgetVsActualChart data={budgetVsActualData} isLoading={loading} />
        </div>
        <div className="lg:col-span-2">
          <BudgetPieChart data={budgetAllocationData} isLoading={loading} />
        </div>
      </div>

      {/* Financial Tip */}
      <div className="bg-gray-800 p-6 rounded-lg mt-8">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><FiTrendingUp /> Analyst's Recommendation</h2>
        {loading ? (
          <FiLoader className="animate-spin text-blue-400" />
        ) : (
          <p className="text-gray-300">
            {overviewData?.risk_profile?.recommended_strategy || "No specific recommendations at this time."}
          </p>
        )}
      </div>
    </div>
  );
};

export default Insights;