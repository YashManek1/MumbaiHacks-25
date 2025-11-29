# 💰 FinBuddy - Frontend

![React](https://img.shields.io/badge/React-19.0+-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6.0+-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0+-06B6D4?logo=tailwindcss&logoColor=white)

**FinBuddy Frontend** is the responsive, interactive web interface for the FinBuddy AI financial assistant. Built with **React 19** and **Vite**, it features a sleek, dark-mode UI powered by Tailwind CSS, real-time data visualization with Recharts, and smooth animations using Framer Motion.

---

## 🚀 Features

### 🖥️ AI Command Center (Dashboard)
- **Agent Action Stream:** View real-time proposals from your "CFO Agent" (e.g., "Pay Bill", "Fund Goal") and approve/dismiss them instantly.
- **Live Stats:** Track Total Balance, Monthly Spending, and Emergency Fund targets at a glance.

### 💬 AI Financial Coach
- **FinBuddy Chat:** A dedicated interface to chat with your financial agent. Ask questions like *"What if I lose my job?"* or *"Can I afford a new phone?"*.
- **Context-Aware:** The chat is aware of your current financial snapshot.

### 📈 Smart Insights & Visualization
- **Budget Breakdown:** Interactive charts showing allocated vs. actual spending.
- **Trend Analysis:** 6-month historical data visualization to track financial health.

### 🎯 Goal Management
- **Savings Goals:** Create custom goals (e.g., "Buy MacBook"), set priorities, and fund them directly from the app.
- **Liquid Cash Tracking:** Monitor your "Available Liquid Cash" separate from your total net worth.

### 💳 Transaction Management
- **Expense Tracking:** View and categorize your transaction history.
- **CSV Upload:** (Integration ready) Upload bank statements for auto-categorization.

---

## 🛠️ Tech Stack

- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/) & [GSAP](https://greensock.com/)
- **Charts:** [Recharts](https://recharts.org/)
- **HTTP Client:** [Axios](https://axios-http.com/)
- **Routing:** [React Router v7](https://reactrouter.com/)
- **Icons:** React Icons (Feather Icons)

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### 2. Clone the Repository
git clone [https://github.com/your-username/finbuddy-frontend.git](https://github.com/your-username/finbuddy-frontend.git)
cd finbuddy-frontend

### 3. Install Dependencies
npm install

### 4. Environment Configuration
Create a .env file in the root directory to connect to your backend:
# URL of your running FinBuddy Backend (FastAPI)
VITE_BACKEND_URL="[http://127.0.0.1:8000](http://127.0.0.1:8000)"

### 5. Run Development Server
npm run dev

The application will start at http://localhost:5173.

📂 Project Structure
`
src/
├── assets/             # Images and static assets
├── components/         # Reusable UI components
│   ├── budget/         # Budget-specific widgets
│   ├── Sidebar.jsx     # Main navigation
│   └── TargetCursor.jsx # Custom UI cursor effect
├── pages/              # Main Route Pages
│   ├── app/            # Protected App Routes (Dashboard, Goals, etc.)
│   ├── LandingPage.jsx # Public Landing Page
│   └── LoginPage.jsx   # Auth Pages
├── services/           # API integration (Axios instances)
├── App.jsx             # Main Router Setup
└── main.jsx            # Entry point
`
🎨 UI Customization
This project uses Tailwind CSS v4. Global styles and theme configurations can be found in src/index.css.

Dark Mode: The app is designed with a "Dark First" philosophy using specific gray-scale palettes (bg-gray-950, bg-gray-800).

Cursor: A custom TargetCursor component adds a polished feel to user interactions.

🧪 Deployment
To build the app for production (e.g., Vercel, Netlify):
npm run build

This generates a dist folder optimized for deployment.

To preview the production build locally:
npm run preview
Built for Mumbai Hacks '25

```bash
