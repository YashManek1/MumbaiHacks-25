import random
from typing import Dict, Any


# --- 1. Context Provider ---
def get_market_context():
    """Returns simulated live market data."""
    gold_trend = random.choice(["Bullish (+2.4%)", "Bearish (-1.1%)", "Stable"])
    nifty_trend = random.choice(
        ["All Time High", "Correction Phase (-4%)", "Consolidating"]
    )
    return {
        "Gold_SGB": {"price": 6500, "trend": gold_trend, "safety_rating": 10},
        "Nifty50_Index": {"price": 22500, "trend": nifty_trend, "safety_rating": 7},
        "FD_Rates": {"rate": "7.2%", "trend": "Stable", "safety_rating": 10},
    }


# --- 2. Execution Tools ---


def fund_goal(goal_id: int, amount: float, reasoning: str):
    """
    Proposes funding a specific financial goal from available savings.
    """
    return {
        "status": "success",
        "action": "fund_goal",
        "details": f"Allocate ₹{amount} to Goal ID {goal_id}. Logic: {reasoning}",
        "parameters": {"goal_id": goal_id, "amount": amount},
    }


def add_savings(amount: float, reasoning: str):
    """
    Proposes adding 'unallocated' money to the general Savings pool.
    """
    return {
        "status": "success",
        "action": "add_savings",
        "details": f"Move ₹{amount} to Savings Pool. Logic: {reasoning}",
        "parameters": {"amount": amount},
    }


def create_goal(title: str, target_amount: float, priority: str, reasoning: str):
    """
    Proposes creating a new financial goal.
    Priority should be 'high', 'medium', or 'low'.
    """
    return {
        "status": "success",
        "action": "create_goal",
        "details": f"Create Goal '{title}' (Target: ₹{target_amount}). Logic: {reasoning}",
        "parameters": {"title": title, "total": target_amount, "priority": priority},
    }


def pay_bill(bill_name: str, amount: float, due_date: str, reasoning: str):
    """
    Proposes paying a bill immediately from Savings.
    """
    return {
        "status": "success",
        "action": "payment",
        "details": f"Pay {bill_name} (₹{amount}) due on {due_date}. Logic: {reasoning}",
        "parameters": {"bill_name": bill_name, "amount": amount},
    }


def invest_surplus(amount: float, asset_class: str, reasoning: str):
    """Stages an investment."""
    return {
        "status": "success",
        "action": "invest",
        "details": f"Allocated ₹{amount} to {asset_class}. Logic: {reasoning}",
        "parameters": {"amount": amount, "asset_class": asset_class},
    }


def secure_savings(amount: float, goal_name: str, reasoning: str):
    """Moves money to a safety net/goal."""
    return {
        "status": "success",
        "action": "transfer",
        "details": f"Moved ₹{amount} to {goal_name}. Logic: {reasoning}",
        "parameters": {"amount": amount, "goal_name": goal_name},
    }


def cancel_subscription(merchant_name: str, reasoning: str):
    """Flags a recurring payment for cancellation."""
    return {
        "status": "success",
        "action": "cancel",
        "details": f"Flagged {merchant_name} for cancellation. Logic: {reasoning}",
        "parameters": {"merchant_name": merchant_name},
    }


def activate_famine_mode(category: str, reasoning: str):
    """Locks the UI for a specific spending category."""
    return {
        "status": "success",
        "action": "lock_ui",
        "details": f"Locked budget for {category}. Logic: {reasoning}",
        "parameters": {"category": category},
    }


def propose_budget_investigation(
    category: str,
    percentage_difference: float,
    average_cost: float,
    new_cost: float,
    reasoning: str,
):
    """Stages a budget investigation question."""
    return {
        "status": "success",
        "action": "investigate_budget",
        "details": f"Question staged for user: {reasoning}",
        "data": {"average": average_cost, "new": new_cost},
        "parameters": {"category": category, "new_cost": new_cost},
    }


def update_dynamic_budget(category: str, new_target_amount: float, reasoning: str):
    """Updates the monthly spending target for a category."""
    return {
        "status": "success",
        "action": "update_budget",
        "details": f"Updated monthly target for {category} to ₹{new_target_amount:.2f}. Logic: {reasoning}",
        "parameters": {"category": category, "new_target_amount": new_target_amount},
    }


def log_financial_insight(title: str, message: str, priority: str):
    """
    Logs a text-based insight or tip for the user without moving money.
    Use this for praise ("Great saving!") or non-critical warnings ("Spending is creeping up").
    """
    return {
        "status": "success",
        "action": "log_insight",
        "details": message,
        "parameters": {"title": title, "message": message, "priority": priority},
    }
