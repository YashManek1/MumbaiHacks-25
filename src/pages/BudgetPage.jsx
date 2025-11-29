import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { budgetApi } from "../services/api.js";

// Import all components
import BudgetHeader from "../components/budget/BudgetHeader";
import BudgetAlerts from "../components/budget/BudgetAlerts";
import OverviewCards from "../components/budget/OverviewCards";
import SavingsCard from "../components/budget/SavingsCard";
import EmergencyCard from "../components/budget/EmergencyCard";
import ExpenseCategoriesTable from "../components/budget/ExpenseCategoriesTable";
import BudgetHistory from "../components/budget/BudgetHistory";
import QuickActions from "../components/budget/QuickActions";
import LoadingSpinner from "../components/budget/LoadingSpinner";

// Import modals
import AddCategoryModal from "../components/budget/modals/AddCategoryModal";
import AllocateModal from "../components/budget/modals/AllocateModal";
import AIAgentPanel from "../components/budget/modals/AIAgentPanel";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Category icon mapping for API data
const CATEGORY_ICONS = {
  "Housing": "🏠",
  "Housing & Rent": "🏠",
  "Food": "🍕",
  "Food & Groceries": "🍕",
  "Groceries": "🍕",
  "Transportation": "🚗",
  "Transport": "🚗",
  "Utilities": "💡",
  "Entertainment": "🎬",
  "Healthcare": "🏥",
  "Health": "🏥",
  "Shopping": "🛍️",
  "Savings": "💰",
  "Emergency": "🛡️",
  "Education": "📚",
  "Personal": "👤",
  "Miscellaneous": "📦",
  "Other": "📦",
};

const getCategoryIcon = (categoryName) => {
  // Try exact match first
  if (CATEGORY_ICONS[categoryName]) {
    return CATEGORY_ICONS[categoryName];
  }
  // Try case-insensitive match
  const lowerName = categoryName.toLowerCase();
  for (const [key, value] of Object. entries(CATEGORY_ICONS)) {
    if (key.toLowerCase() === lowerName || lowerName.includes(key. toLowerCase())) {
      return value;
    }
  }
  return "📦";
};

export default function BudgetPage() {
  // Core state
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Edit state
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: "", allocated: "", icon: "📦" });

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocateType, setAllocateType] = useState('savings');

  // Alert state
  const [alerts, setAlerts] = useState([]);

  // AI Agent state
  const [agentActive, setAgentActive] = useState(false);
  const [agentMessages, setAgentMessages] = useState([]);
  const [pendingAdjustments, setPendingAdjustments] = useState([]);
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [isGeneratingBudget, setIsGeneratingBudget] = useState(false);

  // ========== Helper Functions ==========
  const addAgentMessage = useCallback((message, type = "agent") => {
    setAgentTyping(true);
    setTimeout(() => {
      setAgentMessages(prev => [...prev, {
        id: Date.now(),
        type,
        message,
        timestamp: new Date().toLocaleTimeString()
      }]);
      setAgentTyping(false);
    }, 800);
  }, []);

  const analyzeBudget = useCallback((data) => {
    const overages = [];
    const underages = [];
    
    if (! data?. expenseCategories) return { overages, underages };
    
    data. expenseCategories. forEach(cat => {
      if (cat.allocated === 0) return;
      const diff = cat.spent - cat.allocated;
      const percentage = (cat.spent / cat.allocated) * 100;
      if (diff > 0) {
        overages.push({ ... cat, overage: diff, percentage: percentage.toFixed(1) });
      } else if (percentage < 70) {
        underages.push({ ... cat, underage: Math.abs(diff), percentage: percentage.toFixed(1) });
      }
    });
    return { overages, underages };
  }, []);

  const generateAdjustmentSuggestions = useCallback((overages, underages) => {
    return overages.map(overage => {
      const possibleSources = underages.filter(u => u. underage >= overage.overage * 0.3);
      return {
        id: `adj-${overage.id}`,
        categoryId: overage.id,
        categoryName: overage. name,
        categoryIcon: overage. icon,
        overage: overage. overage,
        currentAllocated: overage.allocated,
        suggestedAllocated: overage.allocated + overage.overage,
        compensationSources: possibleSources.map(s => ({
          id: s.id,
          name: s.name,
          available: s.underage,
          suggested: Math.min(s.underage, overage.overage / possibleSources.length)
        })),
        options: [
          { type: "keep_same", label: "Keep budget same", description: `Maintain ₹${overage.allocated. toLocaleString()} for ${overage.name}. ` },
          { type: "adjust_increase", label: "Increase budget", description: `Increase to ₹${(overage.allocated + overage.overage).toLocaleString()} based on actual spending.` },
          { type: "redistribute", label: "Redistribute from other categories", description: `Take from underutilized categories.` }
        ],
        status: "pending"
      };
    });
  }, []);

  const calculateTotals = useCallback(() => {
    if (!budgetData?. expenseCategories) return { expenseAllocated: 0, expenseSpent: 0, remaining: 0, availableToSave: 0 };
    const expenseAllocated = budgetData.expenseCategories.reduce((sum, cat) => sum + (cat.allocated || 0), 0);
    const expenseSpent = budgetData.expenseCategories.reduce((sum, cat) => sum + (cat.spent || 0), 0);
    return {
      expenseAllocated,
      expenseSpent,
      remaining: expenseAllocated - expenseSpent,
      availableToSave: (budgetData.monthlyIncome || 0) - expenseSpent
    };
  }, [budgetData]);

  const generateAlerts = useCallback((data) => {
    const newAlerts = [];

    if (data?. expenseCategories) {
      data. expenseCategories. forEach(cat => {
        if (cat.allocated === 0) return;
        const percentage = (cat.spent / cat.allocated) * 100;
        if (percentage > 100) {
          newAlerts.push({
            id: `over-${cat.id}`,
            type: "error",
            message: `${cat.name} exceeded by ₹${(cat.spent - cat.allocated).toLocaleString()}`,
            category: cat.name
          });
        }
      });
    }

    if (data?.savings && data.savings.allocated > 0) {
      const savingsPercentage = (data.savings.contributed / data.savings.allocated) * 100;
      if (savingsPercentage >= 100) {
        newAlerts. push({
          id: "savings-goal",
          type: "success",
          message: `Savings goal met! ₹${data.savings.contributed.toLocaleString()} saved this month.`,
          category: "Savings"
        });
      } else if (savingsPercentage < 50) {
        newAlerts.push({
          id: "savings-warning",
          type: "warning",
          message: `Only ${savingsPercentage.toFixed(0)}% of savings goal reached.`,
          category: "Savings"
        });
      }
    }

    if (data?. expenseCategories) {
      const totalExpenses = data.expenseCategories.reduce((sum, c) => sum + (c.spent || 0), 0);
      const availableToSave = (data.monthlyIncome || 0) - totalExpenses;
      if (availableToSave > 0) {
        newAlerts.push({
          id: "available",
          type: "info",
          message: `₹${availableToSave.toLocaleString()} available after expenses this month.`,
          category: "Summary"
        });
      }
    }

    setAlerts(newAlerts);
  }, []);

  // ========== Transform API Data to Component Format ==========
  // This follows the same data structure as Insights. jsx uses from /analysis/overview
  const transformApiData = useCallback((overviewData, breakdownData, trendsData, alertsData) => {
    console.log('API Response - Overview:', overviewData);
    console.log('API Response - Breakdown:', breakdownData);
    console. log('API Response - Trends:', trendsData);
    console.log('API Response - Alerts:', alertsData);

    const expenseCategories = [];
    let categoryId = 1;
    let monthlyIncome = 0;

    // Primary source: overview data (same as Insights. jsx uses)
    if (overviewData?.budget_plan?.breakdown) {
      // Calculate monthly income from budget breakdown
      monthlyIncome = Object.values(overviewData.budget_plan.breakdown).reduce(
        (sum, item) => sum + (item. amount || 0), 0
      );

      Object.entries(overviewData. budget_plan.breakdown).forEach(([name, data]) => {
        // Skip savings and emergency from expense categories
        const lowerName = name. toLowerCase();
        if (lowerName === 'savings' || lowerName === 'emergency') return;

        expenseCategories.push({
          id: categoryId++,
          name: name,
          allocated: data.amount || 0,
          spent: overviewData.actual_spending?.[name] || 0,
          icon: getCategoryIcon(name)
        });
      });
    }

    // Secondary source: budget-breakdown endpoint
    if (expenseCategories.length === 0 && breakdownData) {
      // Handle different possible response structures
      const breakdown = breakdownData. breakdown || breakdownData. categories || breakdownData;
      
      if (typeof breakdown === 'object' && breakdown !== null) {
        Object.entries(breakdown). forEach(([name, data]) => {
          const lowerName = name.toLowerCase();
          if (lowerName === 'savings' || lowerName === 'emergency') return;

          // Handle different data structures
          const allocated = data.allocated || data.amount || data. budget || 0;
          const spent = data.spent || data.actual || 0;

          expenseCategories.push({
            id: categoryId++,
            name: name,
            allocated: allocated,
            spent: spent,
            icon: getCategoryIcon(name)
          });
        });
      }

      monthlyIncome = breakdownData.monthly_income || breakdownData.income || 0;
    }

    // Extract savings info
    let savingsData = { allocated: 0, contributed: 0, available: 0 };
    if (overviewData?.budget_plan?.breakdown?. Savings) {
      const savingsBudget = overviewData.budget_plan.breakdown.Savings;
      savingsData = {
        allocated: savingsBudget.amount || 0,
        contributed: overviewData.actual_spending?.Savings || 0,
        available: (savingsBudget. amount || 0) - (overviewData.actual_spending?.Savings || 0)
      };
    } else if (overviewData?.budget_plan?.breakdown?.savings) {
      const savingsBudget = overviewData.budget_plan.breakdown.savings;
      savingsData = {
        allocated: savingsBudget.amount || 0,
        contributed: overviewData.actual_spending?. savings || 0,
        available: (savingsBudget.amount || 0) - (overviewData.actual_spending?.savings || 0)
      };
    }

    // Extract emergency fund info from overview
    let emergencyData = { allocated: 0, contributed: 0, current: 0, target: 0 };
    if (overviewData?.emergency_fund) {
      emergencyData = {
        allocated: overviewData.emergency_fund.monthly_contribution || 0,
        contributed: overviewData.emergency_fund.monthly_contribution || 0,
        current: overviewData.emergency_fund.current_amount || 0,
        target: overviewData.emergency_fund.target_amount || 0
      };
    }

    // Transform trends data for history chart
    let historyData = [];
    if (trendsData) {
      // Handle array format
      if (Array. isArray(trendsData)) {
        historyData = trendsData.map(trend => ({
          month: trend.month || trend.period || '',
          spent: trend.spent || trend.total_spent || trend.actual || 0,
          budget: trend.budget || trend.total_budget || trend.allocated || 0,
          saved: (trend.budget || trend.total_budget || 0) - (trend.spent || trend. total_spent || 0)
        }));
      }
      // Handle object with trends array
      else if (trendsData.trends && Array.isArray(trendsData.trends)) {
        historyData = trendsData.trends.map(trend => ({
          month: trend.month || trend.period || '',
          spent: trend.spent || trend.total_spent || trend.actual || 0,
          budget: trend.budget || trend.total_budget || trend.allocated || 0,
          saved: (trend. budget || trend.total_budget || 0) - (trend. spent || trend.total_spent || 0)
        }));
      }
      // Handle object with monthly data
      else if (typeof trendsData === 'object') {
        historyData = Object.entries(trendsData). map(([month, data]) => ({
          month: month,
          spent: data.spent || data. actual || 0,
          budget: data. budget || data.allocated || 0,
          saved: (data.budget || 0) - (data.spent || 0)
        }));
      }
    }

    return {
      monthlyIncome,
      expenseCategories,
      savings: savingsData,
      emergency: emergencyData,
      historyData,
    };
  }, []);

  // ========== Data Fetching ==========
  const fetchBudgetData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch all budget-related data in parallel
      const results = await Promise.allSettled([
        budgetApi.getOverview(),           // Same endpoint as Insights.jsx
        budgetApi.getBudgetBreakdown(),    // Budget breakdown
        budgetApi. getTrends(),             // 6 month trends
        budgetApi.getAlerts(),             // Active alerts
      ]);

      const overviewData = results[0].status === 'fulfilled' ? results[0]. value : null;
      const breakdownData = results[1].status === 'fulfilled' ? results[1].value : null;
      const trendsData = results[2].status === 'fulfilled' ?  results[2].value : null;
      const alertsData = results[3].status === 'fulfilled' ? results[3]. value : null;

      // Check if we got any data
      if (!overviewData && !breakdownData) {
        throw new Error('Failed to load budget data from API');
      }

      // Transform API data to component format
      const transformedData = transformApiData(overviewData, breakdownData, trendsData, alertsData);

      if (transformedData. expenseCategories.length === 0) {
        setError('No budget categories found. Please set up your budget first.');
      }

      setBudgetData(transformedData);
      generateAlerts(transformedData);

      // Handle API alerts
      if (alertsData && Array.isArray(alertsData) && alertsData. length > 0) {
        const formattedAlerts = alertsData.map((alert, idx) => ({
          id: alert.id || `api-alert-${idx}`,
          type: alert.severity || alert.type || "info",
          message: alert.message || alert.description,
          category: alert.category || "General"
        }));
        setAlerts(prev => [...formattedAlerts, ...prev]);
      }

    } catch (err) {
      console. error('Error fetching budget data:', err);
      setError(err.message || 'Failed to load budget data.  Please try again.');
      setBudgetData({
        monthlyIncome: 0,
        expenseCategories: [],
        savings: { allocated: 0, contributed: 0, available: 0 },
        emergency: { allocated: 0, contributed: 0, current: 0, target: 0 },
        historyData: [],
      });
    } finally {
      setLoading(false);
    }
  }, [generateAlerts, transformApiData]);

  useEffect(() => {
    fetchBudgetData();
  }, [fetchBudgetData]);

  // ========== AI Budget Generation ==========
  const handleGenerateBudget = useCallback(async () => {
    setIsGeneratingBudget(true);
    setAgentActive(true);
    setShowAgentPanel(true);
    setAgentMessages([]);

    addAgentMessage("🚀 Starting AI budget generation.. .");

    try {
      addAgentMessage("📊 Analyzing your income and spending patterns...");

      const result = await budgetApi.generateBudget({
        month: selectedMonth + 1,
        year: selectedYear
      });

      console.log('Generate Budget Response:', result);

      if (result) {
        addAgentMessage("✅ Budget generated successfully!");
        addAgentMessage("📊 Refreshing your budget data...");

        // Wait a moment then refresh data
        setTimeout(async () => {
          await fetchBudgetData();
          addAgentMessage("🎉 Your new AI-optimized budget is ready!");
          setAgentActive(false);
        }, 1500);
      } else {
        addAgentMessage("⚠️ Budget generation completed but no data returned.");
        setAgentActive(false);
      }
    } catch (err) {
      console.error('Error generating budget:', err);
      addAgentMessage(`❌ Error generating budget: ${err.response?.data?.detail || err.message}`);
      setAgentActive(false);
    } finally {
      setIsGeneratingBudget(false);
    }
  }, [selectedMonth, selectedYear, addAgentMessage, fetchBudgetData]);

  // ========== AI Analysis ==========
  const startBudgetAnalysis = useCallback(() => {
    if (!budgetData || !budgetData. expenseCategories || budgetData.expenseCategories.length === 0) {
      setShowAgentPanel(true);
      addAgentMessage("⚠️ No budget data available for analysis.  Please ensure your budget is set up.");
      return;
    }

    setAgentActive(true);
    setShowAgentPanel(true);
    setAgentMessages([]);
    addAgentMessage("🔍 Starting budget analysis for " + MONTHS[selectedMonth] + ".. .");

    setTimeout(() => {
      const { overages, underages } = analyzeBudget(budgetData);
      
      if (overages.length === 0) {
        addAgentMessage("✅ Great news! All your expense categories are within budget this month.");

        if (budgetData.savings && budgetData.savings.allocated > 0) {
          const savingsPercentage = (budgetData.savings.contributed / budgetData.savings.allocated) * 100;
          if (savingsPercentage < 100) {
            setTimeout(() => {
              addAgentMessage(`💡 You've saved ₹${budgetData.savings.contributed.toLocaleString()} of your ₹${budgetData.savings.allocated.toLocaleString()} savings goal (${savingsPercentage.toFixed(0)}%).  Consider allocating more! `);
            }, 1000);
          }
        }

        if (budgetData.emergency && budgetData.emergency.target > 0) {
          const emergencyPercentage = (budgetData.emergency.current / budgetData.emergency.target) * 100;
          if (emergencyPercentage < 100) {
            setTimeout(() => {
              addAgentMessage(`🛡️ Emergency fund is at ${emergencyPercentage. toFixed(0)}% of your target. Keep building it!`);
            }, 2000);
          }
        }

        setAgentActive(false);
        return;
      }

      const totalOverage = overages.reduce((sum, o) => sum + o. overage, 0);
      addAgentMessage(`⚠️ Found ${overages.length} category(ies) over budget with total overage of ₹${totalOverage.toLocaleString()}.`);

      setTimeout(() => {
        overages.forEach((overage, idx) => {
          setTimeout(() => {
            addAgentMessage(`📊 ${overage.icon} ${overage. name}: Exceeded by ₹${overage.overage. toLocaleString()} (${overage.percentage}% of budget)`);
          }, idx * 600);
        });
        
        setTimeout(() => {
          const suggestions = generateAdjustmentSuggestions(overages, underages);
          setPendingAdjustments(suggestions);
          addAgentMessage("🤖 I've prepared adjustment options.  Please review each category below.");
        }, overages.length * 600 + 500);
      }, 1000);
    }, 1500);
  }, [budgetData, selectedMonth, addAgentMessage, analyzeBudget, generateAdjustmentSuggestions]);

  // ========== Event Handlers ==========
  const handleAdjustmentChoice = useCallback((adjustmentId, choice, customValue = null) => {
    const adjustment = pendingAdjustments.find(a => a.id === adjustmentId);
    if (! adjustment) return;

    let userMessage = "";
    let resultMessage = "";
    let newBudgetValue = adjustment.currentAllocated;

    switch (choice) {
      case "keep_same":
        userMessage = `Keep ${adjustment.categoryName} budget the same`;
        resultMessage = `✓ ${adjustment.categoryName} budget will remain at ₹${adjustment.currentAllocated.toLocaleString()}.`;
        break;
      case "adjust_increase":
        userMessage = `Increase ${adjustment.categoryName} budget`;
        newBudgetValue = adjustment.suggestedAllocated;
        resultMessage = `✓ ${adjustment. categoryName} budget increased to ₹${newBudgetValue.toLocaleString()}.`;
        break;
      case "redistribute":
        userMessage = `Redistribute to ${adjustment.categoryName}`;
        newBudgetValue = adjustment.currentAllocated + adjustment.overage;
        resultMessage = `✓ Redistributing funds to ${adjustment.categoryName}. `;
        if (adjustment.compensationSources.length > 0) {
          const perSource = adjustment.overage / adjustment.compensationSources.length;
          setBudgetData(prev => ({
            ... prev,
            expenseCategories: prev.expenseCategories.map(cat => {
              const source = adjustment.compensationSources.find(s => s.id === cat.id);
              return source ? { ...cat, allocated: cat.allocated - perSource } : cat;
            })
          }));
        }
        break;
      case "custom":
        userMessage = `Set custom budget of ₹${customValue}`;
        newBudgetValue = parseFloat(customValue);
        resultMessage = `✓ ${adjustment.categoryName} budget set to ₹${newBudgetValue.toLocaleString()}.`;
        break;
      default:
        return;
    }

    setAgentMessages(prev => [... prev, {
      id: Date.now(),
      type: "user",
      message: userMessage,
      timestamp: new Date(). toLocaleTimeString()
    }]);

    setBudgetData(prev => ({
      ... prev,
      expenseCategories: prev.expenseCategories.map(cat =>
        cat.id === adjustment.categoryId ? { ...cat, allocated: newBudgetValue, adjusted: true } : cat
      )
    }));

    setPendingAdjustments(prev =>
      prev.map(a => a.id === adjustmentId ? { ...a, status: "resolved", choice } : a)
    );

    setTimeout(() => {
      addAgentMessage(resultMessage);
      const remaining = pendingAdjustments.filter(a => a.id !== adjustmentId && a.status === "pending");
      if (remaining.length === 0) {
        setTimeout(() => {
          addAgentMessage("🎉 All budget adjustments have been processed!");
          setAgentActive(false);
        }, 1000);
      }
    }, 500);
  }, [pendingAdjustments, addAgentMessage]);

  const applyAllAdjustments = useCallback((type) => {
    pendingAdjustments.forEach((adj, idx) => {
      if (adj.status === "pending") {
        setTimeout(() => handleAdjustmentChoice(adj.id, type), idx * 300);
      }
    });
  }, [pendingAdjustments, handleAdjustmentChoice]);

  const handleEditCategory = useCallback((category) => {
    setEditingCategory({ ...category });
  }, []);

  const handleSaveCategory = useCallback(() => {
    if (!editingCategory) return;
    setBudgetData(prev => ({
      ... prev,
      expenseCategories: prev.expenseCategories.map(cat =>
        cat.id === editingCategory. id ? editingCategory : cat
      )
    }));
    setEditingCategory(null);
  }, [editingCategory]);

  const handleCancelEdit = useCallback(() => {
    setEditingCategory(null);
  }, []);

  const handleAddCategory = useCallback(() => {
    if (! newCategory.name || ! newCategory.allocated) return;
    const newCat = {
      id: Date.now(),
      name: newCategory.name,
      allocated: parseFloat(newCategory. allocated),
      spent: 0,
      icon: newCategory.icon
    };
    setBudgetData(prev => ({
      ... prev,
      expenseCategories: [... (prev.expenseCategories || []), newCat]
    }));
    setNewCategory({ name: "", allocated: "", icon: "📦" });
    setShowAddModal(false);
  }, [newCategory]);

  const handleDeleteCategory = useCallback((categoryId) => {
    setBudgetData(prev => ({
      ...prev,
      expenseCategories: prev.expenseCategories.filter(cat => cat. id !== categoryId)
    }));
  }, []);

  const handleAllocate = useCallback((amount, type) => {
    if (type === 'savings') {
      setBudgetData(prev => ({
        ... prev,
        savings: {
          ... prev.savings,
          contributed: (prev.savings?. contributed || 0) + amount,
          available: (prev.savings?.available || 0) + amount
        }
      }));
    } else {
      setBudgetData(prev => ({
        ...prev,
        emergency: {
          ...prev.emergency,
          contributed: (prev.emergency?.contributed || 0) + amount,
          current: (prev.emergency?.current || 0) + amount
        }
      }));
    }
  }, []);

  const handleDismissAlert = useCallback((alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  const handleExportData = useCallback(() => {
    if (!budgetData?. expenseCategories) return;
    const headers = ["Category", "Allocated", "Spent", "Remaining", "Status"];
    const rows = budgetData. expenseCategories. map(cat => {
      const remaining = cat.allocated - cat. spent;
      return [cat.name, cat. allocated, cat.spent, remaining, remaining >= 0 ? "Under Budget" : "Over Budget"];
    });
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL. createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget-${MONTHS[selectedMonth]}-${selectedYear}. csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [budgetData, selectedMonth, selectedYear]);

  const openAllocateModal = useCallback((type) => {
    setAllocateType(type);
    setShowAllocateModal(true);
  }, []);

  // ========== Computed Values ==========
  if (loading) {
    return <LoadingSpinner />;
  }

  const totals = calculateTotals();
  const hasOverages = budgetData?.expenseCategories?.some(c => c.spent > c.allocated) || false;
  const savingsPercentage = budgetData?.savings?. allocated > 0 
    ? (budgetData.savings.contributed / budgetData. savings.allocated) * 100 
    : 0;
  const emergencyPercentage = budgetData?.emergency?.target > 0 
    ? (budgetData.emergency.current / budgetData. emergency.target) * 100 
    : 0;

  // ========== Render ==========
  return (
    <div className="w-full min-h-screen bg-gray-950 pb-20">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/20 text-red-300 p-4 mx-6 mt-4 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-300 hover:text-red-100">✕</button>
        </div>
      )}

      {/* Header */}
      <BudgetHeader
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        hasOverages={hasOverages}
        onStartAnalysis={startBudgetAnalysis}
        onGenerateBudget={handleGenerateBudget}
        isGeneratingBudget={isGeneratingBudget}
        months={MONTHS}
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          {/* Alerts */}
          <BudgetAlerts alerts={alerts} onDismiss={handleDismissAlert} />

          {/* Overview Cards */}
          {budgetData && (
            <OverviewCards
              budgetData={budgetData}
              totals={totals}
              savingsPercentage={savingsPercentage}
            />
          )}

          {/* Savings & Emergency Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <SavingsCard
              savings={budgetData?. savings}
              savingsPercentage={savingsPercentage}
              onAddClick={() => openAllocateModal('savings')}
            />
            <EmergencyCard
              emergency={budgetData?.emergency}
              emergencyPercentage={emergencyPercentage}
              onAddClick={() => openAllocateModal('emergency')}
            />
          </motion. div>

          {/* Expense Categories Table */}
          <ExpenseCategoriesTable
            categories={budgetData?. expenseCategories || []}
            totals={totals}
            editingCategory={editingCategory}
            setEditingCategory={setEditingCategory}
            onAddClick={() => setShowAddModal(true)}
            onEdit={handleEditCategory}
            onSave={handleSaveCategory}
            onCancelEdit={handleCancelEdit}
            onDelete={handleDeleteCategory}
          />

          {/* Budget History */}
          <BudgetHistory
            historyData={budgetData?.historyData || []}
            selectedYear={selectedYear}
          />

          {/* Quick Actions */}
          <QuickActions
            onAddCategory={() => setShowAddModal(true)}
            onExport={handleExportData}
            onRefresh={fetchBudgetData}
            onAnalysis={startBudgetAnalysis}
            onGenerateBudget={handleGenerateBudget}
            isGeneratingBudget={isGeneratingBudget}
          />
        </motion.div>
      </div>

      {/* Modals */}
      <AddCategoryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        onAdd={handleAddCategory}
      />

      <AllocateModal
        isOpen={showAllocateModal}
        onClose={() => setShowAllocateModal(false)}
        allocateType={allocateType}
        onAllocate={handleAllocate}
      />

      <AIAgentPanel
        isOpen={showAgentPanel}
        onClose={() => setShowAgentPanel(false)}
        agentActive={agentActive}
        agentTyping={agentTyping}
        agentMessages={agentMessages}
        pendingAdjustments={pendingAdjustments}
        onAdjustmentChoice={handleAdjustmentChoice}
        onApplyAll={applyAllAdjustments}
      />
    </div>
  );
}