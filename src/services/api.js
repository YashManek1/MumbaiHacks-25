import axios from 'axios';

// 1. Setup Base URL
const RAW_BASE_URL = import.meta.env. VITE_BACKEND_URL || 'http://localhost:8000';
const API_BASE_URL = `${RAW_BASE_URL. replace(/\/$/, '')}/api/v1`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================
// 2.  REQUEST INTERCEPTOR (Attach Token Safely)
// ============================================================
api.interceptors.request.use(
  (config) => {
    let token = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      token = localStorage.getItem('token');
    }

    if (token) {
      if (! config.headers) {
        config.headers = {};
      }
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// 3. RESPONSE INTERCEPTOR (Handle 401 / Expired Token)
// ============================================================
api. interceptors.response. use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Session expired or unauthorized.  Redirecting to login.. .');
    }
    return Promise.reject(error);
  }
);

// ============================================================
// 4.  GOALS API - Aligned with Backend Endpoints
// ============================================================
export const goalsApi = {
  // GET /api/v1/goals/ - Get all goals for current user
  getAllGoals: async () => {
    try {
      const response = await api.get('/goals/');
      return response.data;
    } catch (error) {
      console.error('Error fetching goals:', error?. response?.data || error. message);
      throw error;
    }
  },

  // POST /api/v1/goals/ - Create a new goal
  createGoal: async (goalData) => {
    try {
      const response = await api.post('/goals/', goalData);
      return response.data;
    } catch (error) {
      console.error('Error creating goal:', error?. response?.data || error.message);
      throw error;
    }
  },

  // Note: Backend does NOT have a PUT /goals/{id} endpoint
  updateGoal: async (id, goalData) => {
    console.warn('Update goal endpoint not implemented in backend');
    return { ... goalData, id };
  },

  // DELETE /api/v1/goals/{goal_id} - Delete a goal
  deleteGoal: async (id) => {
    try {
      const response = await api. delete(`/goals/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting goal:', error?.response?.data || error.message);
      throw error;
    }
  },

  // POST /api/v1/goals/{goal_id}/fund - Fund a goal from savings
  fundGoal: async (id, amount) => {
    try {
      const response = await api. post(`/goals/${id}/fund`, { amount });
      return response.data;
    } catch (error) {
      console.error('Error funding goal:', error?.response?.data || error. message);
      throw error;
    }
  },

  // GET /api/v1/goals/savings/info - Get savings information
  getSavingsInfo: async () => {
    try {
      const response = await api.get('/goals/savings/info');
      return response.data;
    } catch (error) {
      console.error('Error getting savings info:', error?. response?.data || error.message);
      throw error;
    }
  },

  // POST /api/v1/goals/savings/add - Add money to savings
  // Backend expects: { amount: float } only
  addSavings: async (amount) => {
    try {
      const response = await api. post('/goals/savings/add', { amount });
      return response.data;
    } catch (error) {
      console. error('Error adding savings:', error?.response?. data || error.message);
      throw error;
    }
  },
};

// ============================================================
// 5. BUDGET API - Aligned with Backend Endpoints
// ============================================================
export const budgetApi = {
  // GET /api/v1/analysis/dashboard
  // Returns: { period, monthly_income, total_expenses, cash_flow_savings, available_liquid_cash, savings_rate }
  getDashboardData: async () => {
    try {
      const response = await api.get('/analysis/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error?.response?.data || error.message);
      throw error;
    }
  },

  // GET /api/v1/analysis/budget-breakdown
  // Returns: Array of { category, allocated, spent, remaining, status }
  getBudgetBreakdown: async (month = null, year = null) => {
    try {
      const params = {};
      if (month) params.month = month;
      if (year) params. year = year;
      const response = await api. get('/analysis/budget-breakdown', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching budget breakdown:', error?.response?.data || error.message);
      throw error;
    }
  },

  // GET /api/v1/analysis/trends
  // Returns: Array of { month, year, expense, income }
  getTrends: async () => {
    try {
      const response = await api.get('/analysis/trends');
      return response. data;
    } catch (error) {
      console.error('Error fetching trends:', error?.response?. data || error.message);
      throw error;
    }
  },

  // GET /api/v1/analysis/alerts
  // Returns: Array of { id, title, message, date }
  getAlerts: async () => {
    try {
      const response = await api.get('/analysis/alerts');
      return response.data;
    } catch (error) {
      console.error('Error fetching alerts:', error?.response?.data || error.message);
      throw error;
    }
  },

  // POST /api/v1/agent/budget/generate
  // Returns: AI-generated budget plan JSON
  generateBudget: async () => {
    try {
      const response = await api.post('/agent/budget/generate');
      return response.data;
    } catch (error) {
      console.error('Error generating budget:', error?.response?.data || error. message);
      throw error;
    }
  },

  // GET /api/v1/analysis/overview
  // Returns: Array of { category, amount, percentage }
  getOverview: async () => {
    try {
      const response = await api.get('/analysis/overview');
      return response.data;
    } catch (error) {
      console.error('Error fetching overview:', error?.response?.data || error.message);
      throw error;
    }
  },

  // POST /api/v1/agent/analyze - Trigger agent analysis
  triggerAnalysis: async () => {
    try {
      const response = await api. post('/agent/analyze');
      return response.data;
    } catch (error) {
      console. error('Error triggering analysis:', error?.response?.data || error. message);
      throw error;
    }
  },

  // GET /api/v1/agent/actions/pending - Get pending actions
  getPendingActions: async () => {
    try {
      const response = await api.get('/agent/actions/pending');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending actions:', error?.response?. data || error.message);
      throw error;
    }
  },
};

// ============================================================
// 6.  TRANSACTIONS API
// ============================================================
export const transactionsApi = {
  // GET /api/v1/transactions/
  getTransactions: async (startDate = null, endDate = null, limit = 100) => {
    try {
      const params = { limit };
      if (startDate) params. start_date = startDate;
      if (endDate) params. end_date = endDate;
      const response = await api. get('/transactions/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error?. response?.data || error.message);
      throw error;
    }
  },

  // POST /api/v1/transactions/upload
  uploadTransactions: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/transactions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response. data;
    } catch (error) {
      console.error('Error uploading transactions:', error?.response?. data || error.message);
      throw error;
    }
  },
};

export default api;