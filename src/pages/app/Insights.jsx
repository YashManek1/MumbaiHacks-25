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
    <h2 className="text-xl font-bold text-white mb-4">Spending by Category</h2>
    <ResponsiveContainer width="100%" height={400}>
      {isLoading ? (
        <div className="flex items-center justify-center h-full"><FiLoader className="animate-spin text-blue-400 text-3xl" /></div>
      ) : data && data.length > 0 ? (
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={120} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name, props) => [`${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)} (${(props.payload.percent * 100).toFixed(1)}%)`, name]} />
          <Legend />
        </PieChart>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">No spending data available.</div>
      )}
    </ResponsiveContainer>
  </div>
);

const SpendingBarChart = ({ data, isLoading }) => (
  <div className="bg-gray-800 p-6 rounded-lg h-full">
    <h2 className="text-xl font-bold text-white mb-4">Spending Breakdown</h2>
    <ResponsiveContainer width="100%" height={400}>
      {isLoading ? (
        <div className="flex items-center justify-center h-full"><FiLoader className="animate-spin text-blue-400 text-3xl" /></div>
      ) : data && data.length > 0 ? (
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
          <XAxis type="number" stroke="#9CA3AF" tickFormatter={(value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact' }).format(value)} />
          <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={80} interval={0} />
          <Tooltip
            cursor={{ fill: 'rgba(147, 197, 253, 0.1)' }}
            contentStyle={{ backgroundColor: '#2D3748', border: '1px solid #4A5568' }}
            formatter={(value) => [new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value), 'Amount']}
          />
          <Bar dataKey="value" barSize={20}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">No spending data available.</div>
      )}
    </ResponsiveContainer>
  </div>
);


const Insights = () => {
  const [spendingData, setSpendingData] = useState([]);
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
        setSpendingData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(value);

  const { totalSpending, pieChartData } = useMemo(() => {
    if (!spendingData || spendingData.length === 0) return { totalSpending: 0, pieChartData: [] };

    const totalSpending = spendingData.reduce((sum, item) => sum + item.amount, 0);

    const pieChartData = spendingData.map(item => ({
      name: item.category,
      value: item.amount,
      percent: item.percentage / 100, // Convert percentage to a decimal for the chart
    }));

    return { totalSpending, pieChartData };
  }, [spendingData]);

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
        <StatCard title="Total Monthly Spending" value={formatCurrency(totalSpending)} icon={<FiArrowDown size={22} className="text-red-400" />} isLoading={loading} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="col-span-1">
          <BudgetPieChart data={pieChartData} isLoading={loading} />
        </div>
        <div className="col-span-1">
          <SpendingBarChart data={pieChartData} isLoading={loading} />
        </div>
      </div>
    </div>
  );
};

export default Insights;