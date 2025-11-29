# 💰 FinBuddy - AI-Powered Personal Finance Assistant

**FinBuddy** is a smart, agentic financial tracking application designed to help users manage their money effortlessly. Powered by **FastAPI** and **Google Gemini**, it goes beyond simple tracking by acting as a personal "CFO Agent" that analyzes spending, detects anomalies, suggests budget improvements, and helps you reach financial goals.

---

## 🚀 Features

### 🤖 Intelligent AI Agent (The CFO)

- **Multi-Role System:** detailed "Detective" (data gathering), "Strategist" (math/logic), and "CFO" (decision making) architecture.
- **Actionable Advice:** The AI doesn't just chat; it can propose and execute actions like funding goals, creating budget alerts, or flagging bills.
- **Market Context:** Integrates basic market trends to give smarter savings advice.

### 📊 Comprehensive Dashboard

- **Real-Time Analytics:** View Income vs. Expenses, Net Savings, and Savings Rate instantly.
- **Cash Flow Analysis:** Visual breakdown of where your money is going.

### 💳 Transaction Management

- **Bulk Upload:** Upload bank statements (CSV) for automatic processing.
- **Smart Categorization:** auto-tags transactions (e.g., "Uber" -> Transportation, "Zomato" -> Dining).

### 🎯 Goals & Budgeting

- **Dynamic Budgeting:** Set category limits and get alerts when you overspend.
- **Goal Tracking:** Create specific savings goals (e.g., "Buy Macbook") and track progress.
- **Recurring Bills:** Manage subscriptions and utility bills with due date tracking.

### 🔐 Security

- **Secure Auth:** Full OAuth2 implementation with JWT access tokens.
- **Data Safety:** Password hashing using Argon2/Bcrypt.

---

## 🛠️ Tech Stack

- **Backend:** Python 3.11+, FastAPI, Uvicorn
- **Database:** PostgreSQL (via Supabase), SQLModel (SQLAlchemy Async)
- **AI Engine:** Google Gemini Pro (`google-generativeai`)
- **Data Processing:** Pandas, Pytesseract (OCR)
- **Infrastructure:** Docker, Render/Cloud Run ready

---

## ⚙️ Local Installation

### 1. Prerequisites

- Python 3.10+
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) (required for parsing functionality)
- PostgreSQL Database (Local or Supabase)

### 2. Clone the Repository

```bash
git clone [https://github.com/your-username/finbuddy-backend.git](https://github.com/your-username/finbuddy-backend.git)
cd finbuddy-backend

3. Environment Configuration
Create a .env file in the root directory:

# Database (PostgreSQL/Supabase)
DATABASE_URL=postgresql+asyncpg://postgres:password@db.supabase.co:5432/postgres

# Security
SECRET_KEY=your_generated_secret_key
ACCESS_TOKEN_EXPIRE_MINUTES=60

# AI Configuration
GEMINI_API_KEY=your_google_gemini_api_key

4. Install Dependencies
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install packages
pip install -r requirements.txt

5. Run the Application
uvicorn app.main:app --reload

The server will start at http://127.0.0.1:8000

📚 API Documentation
Once the app is running, explore the interactive API docs:

Swagger UI: http://127.0.0.1:8000/docs
ReDoc: http://127.0.0.1:8000/redoc

📂 Project Structure
app/
├── api/            # API Endpoints (Auth, Transactions, Agent, Goals)
├── core/           # Config, Database, Security, & AI Logic
├── models/         # Database Schemas (User, Transaction, Budget, etc.)
├── utils/          # Parsers & Helper Scripts
└── main.py         # Application Entry Point

🧪 Testing
To run the full system test (registration, CSV upload, dashboard check):
python test.py

Built for Mumbai Hacks '25
```
