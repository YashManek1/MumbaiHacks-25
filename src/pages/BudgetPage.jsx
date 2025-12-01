import React, { useState, useEffect, useCallback } from "react";
import { budgetApi, goalsApi } from "../services/api.js";

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
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Category icon mapping
const CATEGORY_ICONS = {
  Housing: "🏠",
  "Housing & Utilities": "🏠",
  "Housing & Rent": "🏠",
  Food: "🍕",
  "Food & Groceries": "🍕",
  Groceries: "🍕",
  "Groceries & Essentials": "🍕",
  Transportation: "🚗",
  Transport: "🚗",
  Utilities: "💡",
  Entertainment: "🎬",
  "Dining & Lifestyle": "🎬",
  Healthcare: "🏥",
  Health: "🏥",
  "Health & Medical": "🏥",
  Shopping: "🛍️",
  Savings: "💰",
  "Savings & Investments": "💰",
  Emergency: "🛡️",
  Education: "📚",
  Personal: "👤",
  Miscellaneous: "📦",
  Other: "📦",
};

const getCategoryIcon = (categoryName) => {
  if (!categoryName) return "📦";
  if (CATEGORY_ICONS[categoryName]) return CATEGORY_ICONS[categoryName];

  const lowerName = categoryName.toLowerCase();
  for (const [key, value] of Object.entries(CATEGORY_ICONS)) {
    if (
      key.toLowerCase() === lowerName ||
      lowerName.includes(key.toLowerCase())
    ) {
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
  const [newCategory, setNewCategory] = useState({
    name: "",
    allocated: "",
    icon: "📦",
  });

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocateType, setAllocateType] = useState("savings");

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
  const addAgentMessage = useCallback(
    (message, type = "agent", delay = 800) => {
      setAgentTyping(true);
      setTimeout(() => {
        setAgentMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-${prev.length}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            type,
            message,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        setAgentTyping(false);
      }, delay);
    },
    []
  );

  const analyzeBudget = useCallback((data) => {
    const overages = [];
    const underages = [];

    if (!data?.expenseCategories) return { overages, underages };

    data.expenseCategories.forEach((cat) => {
      if (cat.allocated === 0) return;
      const diff = cat.spent - cat.allocated;
      const percentage = (cat.spent / cat.allocated) * 100;
      if (diff > 0) {
        overages.push({
          ...cat,
          overage: diff,
          percentage: percentage.toFixed(1),
        });
      } else if (percentage < 70) {
        underages.push({
          ...cat,
          underage: Math.abs(diff),
          percentage: percentage.toFixed(1),
        });
      }
    });
    return { overages, underages };
  }, []);

  const generateAdjustmentSuggestions = useCallback((overages, underages) => {
    return overages.map((overage) => {
      const possibleSources = underages.filter(
        (u) => u.underage >= overage.overage * 0.3
      );
      return {
        id: `adj-${overage.id}`,
        categoryId: overage.id,
        categoryName: overage.name,
        categoryIcon: overage.icon,
        overage: overage.overage,
        currentAllocated: overage.allocated,
        suggestedAllocated: overage.allocated + overage.overage,
        compensationSources: possibleSources.map((s) => ({
          id: s.id,
          name: s.name,
          available: s.underage,
          suggested: Math.min(
            s.underage,
            overage.overage / possibleSources.length
          ),
        })),
        options: [
          {
            type: "keep_same",
            label: "Keep budget same",
            description: `Maintain ₹${overage.allocated.toLocaleString()} for ${
              overage.name
            }.`,
          },
          {
            type: "adjust_increase",
            label: "Increase budget",
            description: `Increase to ₹${(
              overage.allocated + overage.overage
            ).toLocaleString()} based on actual spending.`,
          },
          {
            type: "redistribute",
            label: "Redistribute from other categories",
            description: `Take from underutilized categories.`,
          },
        ],
        status: "pending",
      };
    });
  }, []);

  const calculateTotals = useCallback(() => {
    if (!budgetData?.expenseCategories) {
      return {
        expenseAllocated: 0,
        expenseSpent: 0,
        remaining: 0,
        availableToSave: 0,
      };
    }
    const expenseAllocated = budgetData.expenseCategories.reduce(
      (sum, cat) => sum + (cat.allocated || 0),
      0
    );
    const expenseSpent = budgetData.expenseCategories.reduce(
      (sum, cat) => sum + (cat.spent || 0),
      0
    );
    return {
      expenseAllocated,
      expenseSpent,
      remaining: expenseAllocated - expenseSpent,
      availableToSave: (budgetData.monthlyIncome || 0) - expenseSpent,
    };
  }, [budgetData]);

  const generateLocalAlerts = useCallback((data) => {
    const newAlerts = [];

    if (data?.expenseCategories) {
      data.expenseCategories.forEach((cat) => {
        if (cat.allocated === 0) return;
        const percentage = (cat.spent / cat.allocated) * 100;
        if (percentage > 100) {
          newAlerts.push({
            id: `over-${cat.id}`,
            type: "error",
            message: `${cat.name} exceeded by ₹${(
              cat.spent - cat.allocated
            ).toLocaleString()}`,
            category: cat.name,
          });
        }
      });
    }

    if (data?.savings && data.savings.allocated > 0) {
      const savingsPercentage =
        (data.savings.contributed / data.savings.allocated) * 100;
      if (savingsPercentage >= 100) {
        newAlerts.push({
          id: "savings-goal",
          type: "success",
          message: `Savings goal met! ₹${data.savings.contributed.toLocaleString()} saved this month.`,
          category: "Savings",
        });
      } else if (savingsPercentage < 50) {
        newAlerts.push({
          id: "savings-warning",
          type: "warning",
          message: `Only ${savingsPercentage.toFixed(
            0
          )}% of savings goal reached.`,
          category: "Savings",
        });
      }
    }

    if (data?.expenseCategories) {
      const totalExpenses = data.expenseCategories.reduce(
        (sum, c) => sum + (c.spent || 0),
        0
      );
      const availableToSave = (data.monthlyIncome || 0) - totalExpenses;
      if (availableToSave > 0) {
        newAlerts.push({
          id: "available",
          type: "info",
          message: `₹${availableToSave.toLocaleString()} available after expenses this month.`,
          category: "Summary",
        });
      }
    }

    return newAlerts;
  }, []);

  // ========== Transform API Data to Component Format ==========
  // Aligned with actual backend response structures
  const transformApiData = useCallback(
    (dashboardData, breakdownData, trendsData, alertsData, savingsData) => {
      console.log("API Response - Dashboard:", dashboardData);
      console.log("API Response - Breakdown:", breakdownData);
      console.log("API Response - Trends:", trendsData);
      console.log("API Response - Alerts:", alertsData);
      console.log("API Response - Savings:", savingsData);

      // Extract monthly income from dashboard
      const monthlyIncome = dashboardData?.monthly_income || 0;

      // Transform budget breakdown to expense categories
      // Backend returns: Array of { category, allocated, spent, remaining, status }
      const expenseCategories = [];
      let categoryId = 1;

      if (Array.isArray(breakdownData)) {
        breakdownData.forEach((item) => {
          // Skip savings-related categories from expense list
          const lowerCat = (item.category || "").toLowerCase();
          if (lowerCat.includes("savings") || lowerCat.includes("investment"))
            return;

          expenseCategories.push({
            id: categoryId++,
            name: item.category || "Unknown",
            allocated: Number(item.allocated) || 0,
            spent: Number(item.spent) || 0,
            remaining: Number(item.remaining) || 0,
            status: item.status || "On Track",
            icon: getCategoryIcon(item.category),
          });
        });
      }

      // Extract savings data
      // Use savings info from goalsApi.getSavingsInfo() response
      const savingsInfo = {
        allocated: Number(savingsData?.savings_allocated) || 0,
        contributed: Number(savingsData?.total_funded) || 0,
        available: Number(savingsData?.savings_available) || 0,
        totalFunds: Number(savingsData?.total_funds) || 0,
        monthlyRate: Number(savingsData?.monthly_savings_rate) || 0,
      };

      // Emergency fund data - derive from savings or set defaults
      const emergencyInfo = {
        allocated: 0,
        contributed: 0,
        current: 0,
        target: savingsInfo.totalFunds * 6 || 100000, // 6 months of savings as target
      };

      // Transform trends data for history chart
      // Backend returns: Array of { month, year, expense, income }
      let historyData = [];
      if (Array.isArray(trendsData)) {
        historyData = trendsData.map((trend) => ({
          month: trend.month || "",
          year: trend.year || new Date().getFullYear(),
          spent: Number(trend.expense) || 0,
          income: Number(trend.income) || 0,
          budget: monthlyIncome, // Use monthly income as budget reference
          saved: Math.max(
            0,
            (Number(trend.income) || 0) - (Number(trend.expense) || 0)
          ),
        }));
      }

      return {
        monthlyIncome,
        totalExpenses: dashboardData?.total_expenses || 0,
        netSavings: dashboardData?.cash_flow_savings || 0,
        liquidCash: dashboardData?.available_liquid_cash || 0,
        savingsRate: dashboardData?.savings_rate || 0,
        period: dashboardData?.period || "",
        expenseCategories,
        savings: savingsInfo,
        emergency: emergencyInfo,
        historyData,
      };
    },
    []
  );

  // ========== Data Fetching ==========
  const fetchBudgetData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch all budget-related data in parallel
      const results = await Promise.allSettled([
        budgetApi.getDashboardData(), // Dashboard summary
        budgetApi.getBudgetBreakdown(selectedMonth + 1, selectedYear), // Budget breakdown with month/year
        budgetApi.getTrends(), // 6 month trends
        budgetApi.getAlerts(), // Active alerts from agent
        goalsApi.getSavingsInfo(), // Savings info from goals API
      ]);

      const dashboardData =
        results[0].status === "fulfilled" ? results[0].value : null;
      const breakdownData =
        results[1].status === "fulfilled" ? results[1].value : [];
      const trendsData =
        results[2].status === "fulfilled" ? results[2].value : [];
      const alertsData =
        results[3].status === "fulfilled" ? results[3].value : [];
      const savingsData =
        results[4].status === "fulfilled" ? results[4].value : null;

      // Log any failed requests for debugging
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.warn(`API call ${index} failed:`, result.reason);
        }
      });

      // Transform API data to component format
      const transformedData = transformApiData(
        dashboardData,
        breakdownData,
        trendsData,
        alertsData,
        savingsData
      );

      setBudgetData(transformedData);

      // Generate local alerts based on data
      const localAlerts = generateLocalAlerts(transformedData);

      // Transform backend alerts
      // Backend returns: Array of { id, title, message, date }
      const backendAlerts = Array.isArray(alertsData)
        ? alertsData.map((alert) => ({
            id: `api-${alert.id}`,
            type: "warning",
            message: alert.message || alert.title,
            category: "Agent Alert",
            date: alert.date,
          }))
        : [];

      setAlerts([...backendAlerts, ...localAlerts]);

      if (transformedData.expenseCategories.length === 0 && !dashboardData) {
        setError(
          "No budget data found.Please upload transactions or set up your budget."
        );
      }
    } catch (err) {
      console.error("Error fetching budget data:", err);
      setError(err.message || "Failed to load budget data.  Please try again.");
      setBudgetData({
        monthlyIncome: 0,
        totalExpenses: 0,
        netSavings: 0,
        liquidCash: 0,
        savingsRate: 0,
        expenseCategories: [],
        savings: { allocated: 0, contributed: 0, available: 0 },
        emergency: { allocated: 0, contributed: 0, current: 0, target: 0 },
        historyData: [],
      });
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, generateLocalAlerts, transformApiData]);

  useEffect(() => {
    fetchBudgetData();
  }, [fetchBudgetData]);

  // ========== AI Budget Generation ==========
  const handleGenerateBudget = useCallback(async () => {
    setIsGeneratingBudget(true);
    setAgentActive(true);
    setShowAgentPanel(true);
    setAgentMessages([]);

    addAgentMessage("🚀 Starting AI budget generation...", "agent", 300);

    try {
      addAgentMessage(
        "📊 Analyzing your income and spending patterns...",
        "agent",
        600
      );

      // Backend doesn't accept month/year params for budget generation
      const result = await budgetApi.generateBudget();

      console.log("Generate Budget Response:", result);

      if (result) {
        // Display income/expense summary
        if (result.total_income || result.total_expenses) {
          setTimeout(() => {
            addAgentMessage(
              `💰 Income: ₹${(
                result.total_income || 0
              ).toLocaleString()} | Expenses: ₹${(
                result.total_expenses || 0
              ).toLocaleString()}`,
              "agent",
              100
            );
          }, 1000);
        }

        // Display categories breakdown
        if (result.categories && result.categories.length > 0) {
          setTimeout(() => {
            addAgentMessage(
              `📋 AI Budget Plan (${result.categories.length} categories):`,
              "agent",
              100
            );
          }, 1800);

          // Show each category
          result.categories.forEach((cat, index) => {
            setTimeout(() => {
              const icon = getCategoryIcon(cat.category);
              addAgentMessage(
                `${icon} ${
                  cat.category
                }: ₹${cat.allocated.toLocaleString()} allocated`,
                "agent",
                100
              );
            }, 2200 + index * 400);
          });

          // Show savings strategy after categories
          const strategyDelay = 2200 + result.categories.length * 400 + 500;
          if (result.savings_strategy) {
            setTimeout(() => {
              addAgentMessage(
                `💡 Savings Strategy: ${result.savings_strategy}`,
                "agent",
                100
              );
            }, strategyDelay);
          }

          // Show market adjustments
          if (result.market_adjustments) {
            setTimeout(() => {
              addAgentMessage(
                `📈 Market Insights: ${result.market_adjustments}`,
                "agent",
                100
              );
            }, strategyDelay + 1000);
          }

          // Refresh data and show completion
          setTimeout(async () => {
            await fetchBudgetData();
            addAgentMessage(
              "🎉 Your new AI-optimized budget is ready!",
              "agent",
              100
            );
            setAgentActive(false);
          }, strategyDelay + 2500);
        } else {
          addAgentMessage("✅ Budget generated successfully!", "agent", 100);
          setTimeout(async () => {
            await fetchBudgetData();
            addAgentMessage(
              "🎉 Your new AI-optimized budget is ready!",
              "agent",
              100
            );
            setAgentActive(false);
          }, 1500);
        }
      } else {
        addAgentMessage(
          "⚠️ Budget generation completed but no data returned.",
          "agent",
          100
        );
        setAgentActive(false);
      }
    } catch (err) {
      console.error("Error generating budget:", err);
      addAgentMessage(
        `❌ Error generating budget: ${
          err.response?.data?.detail || err.message
        }`,
        "agent",
        100
      );
      setAgentActive(false);
    } finally {
      setIsGeneratingBudget(false);
    }
  }, [addAgentMessage, fetchBudgetData]);

  // ========== AI Analysis ==========
  const startBudgetAnalysis = useCallback(async () => {
    if (
      !budgetData ||
      !budgetData.expenseCategories ||
      budgetData.expenseCategories.length === 0
    ) {
      setShowAgentPanel(true);
      addAgentMessage(
        "⚠️ No budget data available for analysis.Please ensure you have uploaded transactions."
      );
      return;
    }

    setAgentActive(true);
    setShowAgentPanel(true);
    setAgentMessages([]);
    addAgentMessage(
      "🔍 Starting budget analysis for " + MONTHS[selectedMonth] + ".. ."
    );

    // Trigger backend analysis
    try {
      await budgetApi.triggerAnalysis();
      addAgentMessage("📡 Agent analysis triggered on server.. .");
    } catch (err) {
      console.warn("Backend analysis trigger failed:", err);
    }

    setTimeout(() => {
      const { overages, underages } = analyzeBudget(budgetData);

      if (overages.length === 0) {
        addAgentMessage(
          "✅ Great news! All your expense categories are within budget this month."
        );

        if (budgetData.savings && budgetData.savings.allocated > 0) {
          const savingsPercentage =
            (budgetData.savings.contributed / budgetData.savings.allocated) *
            100;
          if (savingsPercentage < 100) {
            setTimeout(() => {
              addAgentMessage(
                `💡 You've saved ₹${budgetData.savings.contributed.toLocaleString()} of your ₹${budgetData.savings.allocated.toLocaleString()} savings goal (${savingsPercentage.toFixed(
                  0
                )}%). `
              );
            }, 1000);
          }
        }

        if (budgetData.emergency && budgetData.emergency.target > 0) {
          const emergencyPercentage =
            (budgetData.emergency.current / budgetData.emergency.target) * 100;
          if (emergencyPercentage < 100) {
            setTimeout(() => {
              addAgentMessage(
                `🛡️ Emergency fund is at ${emergencyPercentage.toFixed(
                  0
                )}% of your target.Keep building it!`
              );
            }, 2000);
          }
        }

        // Show savings rate info
        if (budgetData.savingsRate > 0) {
          setTimeout(() => {
            addAgentMessage(
              `📈 Your current savings rate is ${budgetData.savingsRate}%.`
            );
          }, 2500);
        }

        setAgentActive(false);
        return;
      }

      const totalOverage = overages.reduce((sum, o) => sum + o.overage, 0);
      addAgentMessage(
        `⚠️ Found ${
          overages.length
        } category(ies) over budget with total overage of ₹${totalOverage.toLocaleString()}.`
      );

      setTimeout(() => {
        overages.forEach((overage, idx) => {
          setTimeout(() => {
            addAgentMessage(
              `📊 ${overage.icon} ${
                overage.name
              }: Exceeded by ₹${overage.overage.toLocaleString()} (${
                overage.percentage
              }% of budget)`
            );
          }, idx * 600);
        });

        setTimeout(() => {
          const suggestions = generateAdjustmentSuggestions(
            overages,
            underages
          );
          setPendingAdjustments(suggestions);
          addAgentMessage(
            "🤖 I've prepared adjustment options.  Please review each category below."
          );
        }, overages.length * 600 + 500);
      }, 1000);
    }, 1500);
  }, [
    budgetData,
    selectedMonth,
    addAgentMessage,
    analyzeBudget,
    generateAdjustmentSuggestions,
  ]);

  // ========== Event Handlers ==========
  const handleAdjustmentChoice = useCallback(
    (adjustmentId, choice, customValue = null) => {
      const adjustment = pendingAdjustments.find((a) => a.id === adjustmentId);
      if (!adjustment) return;

      let userMessage = "";
      let resultMessage = "";
      let newBudgetValue = adjustment.currentAllocated;

      switch (choice) {
        case "keep_same":
          userMessage = `Keep ${adjustment.categoryName} budget the same`;
          resultMessage = `✓ ${
            adjustment.categoryName
          } budget will remain at ₹${adjustment.currentAllocated.toLocaleString()}.`;
          break;
        case "adjust_increase":
          userMessage = `Increase ${adjustment.categoryName} budget`;
          newBudgetValue = adjustment.suggestedAllocated;
          resultMessage = `✓ ${
            adjustment.categoryName
          } budget increased to ₹${newBudgetValue.toLocaleString()}.`;
          break;
        case "redistribute":
          userMessage = `Redistribute to ${adjustment.categoryName}`;
          newBudgetValue = adjustment.currentAllocated + adjustment.overage;
          resultMessage = `✓ Redistributing funds to ${adjustment.categoryName}. `;
          if (adjustment.compensationSources.length > 0) {
            const perSource =
              adjustment.overage / adjustment.compensationSources.length;
            setBudgetData((prev) => ({
              ...prev,
              expenseCategories: prev.expenseCategories.map((cat) => {
                const source = adjustment.compensationSources.find(
                  (s) => s.id === cat.id
                );
                return source
                  ? { ...cat, allocated: cat.allocated - perSource }
                  : cat;
              }),
            }));
          }
          break;
        case "custom":
          userMessage = `Set custom budget of ₹${customValue}`;
          newBudgetValue = parseFloat(customValue);
          resultMessage = `✓ ${
            adjustment.categoryName
          } budget set to ₹${newBudgetValue.toLocaleString()}.`;
          break;
        default:
          return;
      }

      setAgentMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "user",
          message: userMessage,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      setBudgetData((prev) => ({
        ...prev,
        expenseCategories: prev.expenseCategories.map((cat) =>
          cat.id === adjustment.categoryId
            ? { ...cat, allocated: newBudgetValue, adjusted: true }
            : cat
        ),
      }));

      setPendingAdjustments((prev) =>
        prev.map((a) =>
          a.id === adjustmentId ? { ...a, status: "resolved", choice } : a
        )
      );

      setTimeout(() => {
        addAgentMessage(resultMessage);
        const remaining = pendingAdjustments.filter(
          (a) => a.id !== adjustmentId && a.status === "pending"
        );
        if (remaining.length === 0) {
          setTimeout(() => {
            addAgentMessage("🎉 All budget adjustments have been processed!");
            setAgentActive(false);
          }, 1000);
        }
      }, 500);
    },
    [pendingAdjustments, addAgentMessage]
  );

  const applyAllAdjustments = useCallback(
    (type) => {
      pendingAdjustments.forEach((adj, idx) => {
        if (adj.status === "pending") {
          setTimeout(() => handleAdjustmentChoice(adj.id, type), idx * 300);
        }
      });
    },
    [pendingAdjustments, handleAdjustmentChoice]
  );

  const handleEditCategory = useCallback((category) => {
    setEditingCategory({ ...category });
  }, []);

  const handleSaveCategory = useCallback(() => {
    if (!editingCategory) return;
    setBudgetData((prev) => ({
      ...prev,
      expenseCategories: prev.expenseCategories.map((cat) =>
        cat.id === editingCategory.id ? editingCategory : cat
      ),
    }));
    setEditingCategory(null);
  }, [editingCategory]);

  const handleCancelEdit = useCallback(() => {
    setEditingCategory(null);
  }, []);

  const handleAddCategory = useCallback(() => {
    if (!newCategory.name || !newCategory.allocated) return;
    const newCat = {
      id: Date.now(),
      name: newCategory.name,
      allocated: parseFloat(newCategory.allocated),
      spent: 0,
      icon: newCategory.icon,
    };
    setBudgetData((prev) => ({
      ...prev,
      expenseCategories: [...(prev.expenseCategories || []), newCat],
    }));
    setNewCategory({ name: "", allocated: "", icon: "📦" });
    setShowAddModal(false);
  }, [newCategory]);

  const handleDeleteCategory = useCallback((categoryId) => {
    setBudgetData((prev) => ({
      ...prev,
      expenseCategories: prev.expenseCategories.filter(
        (cat) => cat.id !== categoryId
      ),
    }));
  }, []);

  const handleAllocate = useCallback(
    async (amount, type) => {
      if (type === "savings") {
        try {
          // Use the goals API to add savings
          await goalsApi.addSavings(amount);
          // Refresh data after adding
          await fetchBudgetData();
        } catch (err) {
          console.error("Error adding to savings:", err);
          // Update local state as fallback
          setBudgetData((prev) => ({
            ...prev,
            savings: {
              ...prev.savings,
              contributed: (prev.savings?.contributed || 0) + amount,
              available: (prev.savings?.available || 0) + amount,
            },
          }));
        }
      } else {
        // Emergency fund - update locally (no backend endpoint)
        setBudgetData((prev) => ({
          ...prev,
          emergency: {
            ...prev.emergency,
            contributed: (prev.emergency?.contributed || 0) + amount,
            current: (prev.emergency?.current || 0) + amount,
          },
        }));
      }
      setShowAllocateModal(false);
    },
    [fetchBudgetData]
  );

  const handleDismissAlert = useCallback((alertId) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  const handleExportData = useCallback(() => {
    if (!budgetData?.expenseCategories) return;
    const headers = ["Category", "Allocated", "Spent", "Remaining", "Status"];
    const rows = budgetData.expenseCategories.map((cat) => {
      const remaining = cat.allocated - cat.spent;
      return [
        cat.name,
        cat.allocated,
        cat.spent,
        remaining,
        remaining >= 0 ? "Under Budget" : "Over Budget",
      ];
    });
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget-${MONTHS[selectedMonth]}-${selectedYear}.csv`;
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
  const hasOverages =
    budgetData?.expenseCategories?.some((c) => c.spent > c.allocated) || false;
  const savingsPercentage =
    budgetData?.savings?.allocated > 0
      ? (budgetData.savings.contributed / budgetData.savings.allocated) * 100
      : 0;
  const emergencyPercentage =
    budgetData?.emergency?.target > 0
      ? (budgetData.emergency.current / budgetData.emergency.target) * 100
      : 0;

  // ========== Render ==========
  return (
    <div className="w-full min-h-screen bg-gray-950 pb-20">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/20 text-red-300 p-4 mx-6 mt-4 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="text-red-300 hover:text-red-100"
          >
            ✕
          </button>
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
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
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
              savings={budgetData?.savings}
              savingsPercentage={savingsPercentage}
              onAddClick={() => openAllocateModal("savings")}
            />
            <EmergencyCard
              emergency={budgetData?.emergency}
              emergencyPercentage={emergencyPercentage}
              onAddClick={() => openAllocateModal("emergency")}
            />
          </motion.div>

          {/* Expense Categories Table */}
          <ExpenseCategoriesTable
            categories={budgetData?.expenseCategories || []}
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
