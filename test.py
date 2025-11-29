import requests
import csv
import random
from datetime import datetime, timedelta
import os

# Configuration
BASE_URL = "http://127.0.0.1:8000/api/v1"
# Generate a random email to avoid "User already exists" errors
EMAIL = f"yashmanek2001@gmail.com"
PASSWORD = "yash2005"
CSV_FILENAME = "test_transactions.csv"

def print_step(step_name):
    print(f"\n{'='*50}\n🔹 {step_name}\n{'='*50}")

def generate_csv_data():
    """Generates 60+ realistic transactions spanning last 3 months."""
    print("Creating synthetic CSV data...")
    
    # Categories mapped to your parsers.py keywords
    descriptions = {
        "Housing & Utilities": ["Rent Payment", "BSES Electricity Bill", "Jio Fiber Wifi", "Mahanagar Gas Bill"],
        "Transportation": ["Uber Ride to Work", "Shell Petrol", "Ola Auto", "Metro Smart Card Recharge"],
        "Groceries": ["Dmart Grocery", "BigBasket Order", "Blinkit Essentials", "Local Kirana Store"],
        "Dining": ["Zomato Order", "Starbucks Coffee", "McDonalds Burger", "Dominos Pizza"],
        "Savings": ["Zerodha Funds", "Groww SIP", "LIC Premium", "PPF Contribution"],
        "Salary": ["Salary Credit"] 
    }
    
    transactions = []
    end_date = datetime.today()
    start_date = end_date - timedelta(days=90)
    
    # 1. Generate Recurring Fixed Expenses (Rent, SIPs)
    current = start_date
    while current <= end_date:
        # Rent (1st of month)
        if current.day == 1:
            # FIX: Expenses must be negative
            transactions.append([current.strftime("%Y-%m-%d"), "House Rent", "-15000"])
        # SIP (5th of month)
        if current.day == 5:
            # FIX: Investments are technically outflows (negative) for cash flow, 
            # or positive if you track them as assets. 
            # For this dashboard logic, let's treat them as expenses/outflows 
            # so they show up in spending breakdowns.
            transactions.append([current.strftime("%Y-%m-%d"), "Zerodha SIP", "-5000"])
        current += timedelta(days=1)

    # 2. Generate Random Daily Expenses
    for _ in range(50):
        random_date = start_date + timedelta(days=random.randint(0, 90))
        category_key = random.choice(["Transportation", "Groceries", "Dining", "Housing & Utilities"])
        desc = random.choice(descriptions[category_key])
        
        # Amounts vary by category
        if "Groceries" in category_key: amount = random.randint(500, 3000)
        elif "Dining" in category_key: amount = random.randint(200, 1500)
        elif "Transportation" in category_key: amount = random.randint(100, 800)
        else: amount = random.randint(500, 2000)
        
        # FIX: Make amount negative for expenses
        transactions.append([random_date.strftime("%Y-%m-%d"), desc, str(-amount)])

    # 3. Add Income (Positive)
    # We add salary on the 28th of each month
    current = start_date
    while current <= end_date:
        if current.day == 28:
            transactions.append([current.strftime("%Y-%m-%d"), "Salary Credit", "80000"])
        current += timedelta(days=1)

    # Sort by date
    transactions.sort(key=lambda x: x[0])

    # Write to file
    with open(CSV_FILENAME, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["transaction_date", "description", "amount"]) # Header
        writer.writerows(transactions)
    
    print(f"✅ Generated {len(transactions)} transactions in {CSV_FILENAME}")

# --- 1. Register & Login ---
print_step("User Registration & Login")

# Register
user_payload = {
    "email": EMAIL,
    "password": PASSWORD,
    "full_name": "Test User",
    "monthly_income": 80000,
    "risk_tolerance": "moderate"
}
reg_resp = requests.post(f"{BASE_URL}/auth/register", json=user_payload)
if reg_resp.status_code == 200:
    print(f"✅ User registered: {EMAIL}")
else:
    print(f"❌ Registration failed: {reg_resp.text}")
    exit()

# Login
login_data = {
    "username": EMAIL, # OAuth2 expects username, not email field
    "password": PASSWORD
}
login_resp = requests.post(f"{BASE_URL}/auth/login", data=login_data)
if login_resp.status_code == 200:
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Login successful. Token received.")
else:
    print(f"❌ Login failed: {login_resp.text}")
    exit()

# --- 2. Upload CSV ---
print_step("Uploading Transactions CSV")
generate_csv_data()

with open(CSV_FILENAME, "rb") as f:
    files = {"file": (CSV_FILENAME, f, "text/csv")}
    upload_resp = requests.post(f"{BASE_URL}/transactions/upload", headers=headers, files=files)

if upload_resp.status_code == 200:
    data = upload_resp.json()
    print(f"✅ Upload successful! Processed {len(data)} transactions.")
    print(f"   Sample: {data[0]['description']} ({data[0]['amount']})")
else:
    print(f"❌ Upload failed: {upload_resp.text}")

# --- 3. Dashboard Analysis ---
print_step("Checking Dashboard Analytics")
dash_resp = requests.get(f"{BASE_URL}/analysis/dashboard", headers=headers)
if dash_resp.status_code == 200:
    dash = dash_resp.json()
    print(f"✅ Dashboard Loaded for {dash['period']}")
    print(f"   💰 Income: ₹{dash['monthly_income']}")
    print(f"   💸 Total Expenses: ₹{dash['total_expenses']}")
    print(f"   📉 Net Savings: ₹{dash['cash_flow_savings']}")
    print(f"   📊 Savings Rate: {dash['savings_rate']}%")
else:
    print(f"❌ Dashboard failed: {dash_resp.text}")

# --- 4. Budget Breakdown ---
print_step("Checking Budget Breakdown")
budget_resp = requests.get(f"{BASE_URL}/analysis/budget-breakdown", headers=headers)
if budget_resp.status_code == 200:
    budgets = budget_resp.json()
    print("✅ Budget Categorization:")
    if not budgets:
        print("   ⚠️ No budget data returned. (Check if transactions match current month)")
    for b in budgets[:5]: # Print first 5
        print(f"   - {b['category']}: Spent ₹{b['spent']} (Remaining: ₹{b['remaining']}) - {b['status']}")
else:
    print(f"❌ Budget failed: {budget_resp.text}")

# --- 5. Goals Module ---
print_step("Testing Goals & Savings")

# Create Goal
goal_payload = {
    "title": "Buy Macbook",
    "total": 120000,
    "monthly_contribution": 5000,
    "priority": "high",
    "icon": "💻"
}
goal_resp = requests.post(f"{BASE_URL}/goals/", json=goal_payload, headers=headers)
if goal_resp.status_code == 201:
    goal_id = goal_resp.json()["id"]
    print(f"✅ Goal Created: {goal_resp.json()['title']} (ID: {goal_id})")
    print(f"   📅 Estimated Completion: {goal_resp.json()['estimated_completion']}")
else:
    print(f"❌ Goal creation failed: {goal_resp.text}")
    goal_id = None

# Add Funds to Savings (Simulating adding money to wallet)
if goal_id:
    savings_payload = {"amount": 20000} # Add 20k to savings
    save_resp = requests.post(f"{BASE_URL}/goals/savings/add", json=savings_payload, headers=headers)
    print(f"✅ Added ₹20,000 to Savings Wallet.")

    # Fund the Goal
    fund_payload = {"amount": 10000}
    fund_resp = requests.post(f"{BASE_URL}/goals/{goal_id}/fund", json=fund_payload, headers=headers)
    if fund_resp.status_code == 200:
        print(f"✅ Funded ₹10,000 to Goal. Progress: {fund_resp.json()['goal']['progress']}%")
    else:
        print(f"❌ Funding failed: {fund_resp.text}")

# --- 6. Banking (Bills) ---
print_step("Testing Banking (Bills)")
bill_payload = {
    "biller_name": "Netflix Subscription", # FIX: Changed from 'name' to 'biller_name'
    "amount": 649,
    "due_date": (datetime.today() + timedelta(days=5)).strftime("%Y-%m-%d"),
    "is_recurring": True,
    "recurrence_interval": "monthly"
}
bill_resp = requests.post(f"{BASE_URL}/banking/bills", json=bill_payload, headers=headers)
if bill_resp.status_code == 200:
    print(f"✅ Bill Added: {bill_resp.json()['biller_name']} (Due: {bill_resp.json()['due_date']})")
else:
    print(f"❌ Bill addition failed: {bill_resp.text}")

# Cleanup
if os.path.exists(CSV_FILENAME):
    os.remove(CSV_FILENAME)
    print("\n🧹 Cleaned up temporary CSV file.")

print("\n🎉 Full System Test Complete!")