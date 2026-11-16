# SmartSpend – AI-Powered Personal Finance & Spending Analytics

![SmartSpend Banner](https://img.shields.io/badge/Fintech-SmartSpend%20AI-6366F1?style=for-the-badge)
![Version](https://img.shields.io/badge/version-2.0.0-emerald?style=for-the-badge)
![Security](https://img.shields.io/badge/Isolation-Strict%20Multi--User-blue?style=for-the-badge)
![AI](https://img.shields.io/badge/AI%20Engine-Gemini%203.8%20Flash%20%2B%20NLP-purple?style=for-the-badge)

SmartSpend is a modern personal finance management and spending analytics platform engineered as a fintech SaaS product. It helps individuals understand, manage, predict, and optimize their financial life through real-time telemetry, statistical forecasting, and conversational AI.

---

## 🌟 Philosophy: Track → Understand → Predict → Improve

1. **Track**: Log income and expenses across custom categories, payment methods, and dates.
2. **Understand**: Visual dashboards, interactive cash flow charts, category distributions, and multi-pillar financial health scores.
3. **Predict**: Time-series linear regression and weighted moving averages forecast upcoming month expenditures with confidence intervals.
4. **Improve**: Real data-driven AI insights and your personal **SmartSpend AI ✨** conversational assistant.

---

## 🚀 Key Features

### 1. Authentication & Security
- **Email Registration with OTP Verification**: 6-digit numeric verification codes with 10-minute expiry and resend countdown timers.
- **Strict Multi-User Isolation**: Every transaction, budget, goal, and message is strictly partitioned by authenticated user identity. Zero cross-account data leakage.
- **Forgot Password & Password Reset**: Secure OTP-based credential recovery.
- **Profile Customization**: Customizable display currencies (₹ INR, $ USD, € EUR, £ GBP, ¥ JPY), adjustable savings target %, and optional custom Gemini API key (BYOK).

### 2. Modern Fintech Dashboard
- **Instant Financial Cockpit**: Total Income, Total Expenses, Net Savings, and Savings Rate.
- **Financial Health Score (0-100)**: Evaluates Savings Discipline (30 pts), Budget Adherence (30 pts), Spending Concentration (20 pts), and Goal Progress (20 pts).
- **Cash Flow Visualizations**: Responsive interactive Bar and Doughnut charts.
- **Future Outflow Teaser**: Instant alert on projected next month spending.

### 3. Unified Transaction Ledger
- Record both Income and Expenses with amount, category, payment method (UPI, Cards, Cash, Net Banking), and notes.
- Instant search, category filters, payment filters, date ranges, and sorting (amount, date).
- Responsive view: Wide table on desktop, tactile cards on mobile.

### 4. Dynamic Budget Management
- Monthly category spending caps (Food, Rent, Shopping, Entertainment, etc.).
- Real-time spend tracking and remaining balances.
- Color-coded warning thresholds:
  - 🟢 **Safe** (< 75%)
  - 🟡 **Warning** (75% – 90%)
  - 🟠 **Danger** (90% – 100%)
  - 🔴 **Exceeded** (> 100% with alert pulse)

### 5. Milestone-Driven Savings Goals
- Set targets for gadgets, emergency reserves, vacation funds, or vehicles.
- Pacing engine calculates required monthly contribution to reach goal on time.
- Quick **+ Contribute** modal with confetti celebration upon goal completion.

### 6. Spending Analytics
- Multi-month cash flow trends (Inflow vs Outflow).
- Dual-axis savings velocity chart (Net Savings + Savings Rate %).
- Top 5 spending categories ranked with volume percentages.
- Payment method share and highest individual transactions.

### 7. AI Financial Insights
- Analyzes actual user transaction and budget records:
  - *Month-over-month category variance* (e.g. "Food spending increased by 18% compared to last month").
  - *Budget exhaustion alerts* (e.g. "You have used 91% of your Shopping budget").
  - *Savings rate evaluation* (e.g. "Your savings rate this month is 54%").
  - *Category ranking* (e.g. "Rent is your #1 spending category at 51% of outflow").
  - *Largest transaction alert*.

### 8. Future Expense Prediction (ML Regression)
- Historical time-series regression blending trend slopes with recent moving averages.
- Itemized category forecasts with 90% confidence lower and upper bounds.
- Upward (↗), Stable (→), or Downward (↘) trajectory indicators.
- Clear transparency disclosure explaining mathematical basis.

### 9. SmartSpend AI ✨ Assistant
- Conversational financial agent querying your authenticated live ledger.
- Answers questions like:
  - *"How much did I spend this month?"*
  - *"How much did I spend on food?"*
  - *"Where am I spending the most?"*
  - *"What was my biggest expense?"*
  - *"How much have I saved?"*
  - *"Compare my spending with last month."*
  - *"Am I staying within my budget?"*
  - *"What can I improve about my spending?"*
- Powered by Google Gemini 3.8 Flash (`@google/genai`) when an API key is present, with an intelligent built-in financial NLP engine fallback when offline.

### 10. Financial Statements & Reports
- Monthly financial statements with income, expense, and net savings KPIs.
- Budget vs Actual variance tables.
- **Export to CSV**: Instant spreadsheet file download.
- **Print / Save as PDF**: Clean, printer-friendly layout with headers.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS v4, Lucide React, Chart.js, React-Chartjs-2, Canvas-Confetti, Axios.
- **Backend**: Node.js, Express.js (v5), SQLite via `better-sqlite3` (WAL mode enabled, zero external database setup required).
- **Security**: JWT (JSON Web Tokens), bcryptjs password hashing, parameter-bound SQL queries preventing SQL injection.
- **AI**: Google GenAI SDK (`@google/genai`) for `gemini-3.8-flash` + native mathematical financial analytics engine.

---

## 🏃 Quick Start Guide

### Prerequisites
- Node.js (v18+)

### 1. Start the Application
Run the unified server (which serves both the API and the compiled React production client):

```bash
# From project root
node server/server.js
```
or
```bash
npm start
```

### 2. Access the Application
Open your web browser and navigate to:
```
http://localhost:5000
```

### 3. Evaluator / Quick Testing Features
- **OTP Instant Auto-Fill**: In development/evaluation mode, the 6-digit OTP code is printed to the terminal console AND displayed as an "Auto-fill" helper in the verification modal for zero-friction testing.
- **1-Click Realistic Demo Data**: Click the **"Load Sample Data"** button in the top navigation bar or Settings tab to immediately populate 4 months of realistic fintech records, multi-category budgets, and goals to explore all charts and predictive features!
- **Run Automated Test Suite**:
  ```bash
  npm run test:e2e
  ```
  Executes an end-to-end integration test of all 10 core product subsystems including multi-user isolation verification.

---

## 📁 Project Architecture

```
smartspendanti/
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── components/         # Navbar, Sidebar, MobileNav, Modals
│   │   ├── context/            # AuthContext (JWT & state management)
│   │   ├── pages/              # Landing, Dashboard, Ledger, Budgets, Goals,
│   │   │                       # Analytics, Insights, Predictions, AI Chat, Reports
│   │   ├── api.js              # Axios client with JWT interceptors
│   │   ├── App.jsx             # Main App Shell & router
│   │   └── index.css           # Tailwind CSS v4 theme
│   ├── dist/                   # Production build assets served by Express
│   └── vite.config.js          # Vite config with proxy & tailwind
├── server/                     # Node.js Express Backend
│   ├── routes/
│   │   ├── auth.js             # Register, OTP verify, login, password reset
│   │   ├── transactions.js     # Income & Expense CRUD, search, filters
│   │   ├── budgets.js          # Category budget limits & usage tracking
│   │   ├── goals.js            # Savings goals, deposits & pacing
│   │   ├── analytics.js        # Health score, KPIs, cash flow trends
│   │   ├── insights.js         # Real data-driven AI insight engine
│   │   ├── predictions.js      # Linear regression & time-series forecasts
│   │   ├── ai.js               # SmartSpend AI ✨ assistant
│   │   ├── reports.js          # Statement generator & CSV exporter
│   │   └── seed.js             # 1-click realistic demo data generator
│   ├── middleware/auth.js      # JWT authentication middleware
│   ├── utils/otp.js            # OTP generation, storage & validation
│   ├── db.js                   # SQLite database schema & connection
│   ├── server.js               # Express application entry point
│   └── test-e2e.js             # Automated E2E test suite
├── .env.example                # Configuration template
├── package.json                # Project scripts
└── README.md                   # Documentation
```

---

## 🔒 Security & Privacy

SmartSpend treats financial data with the highest privacy standards:
- **No Client User ID Trust**: User identity is derived exclusively from the verified JWT server-side token.
- **Complete SQL Isolation**: All queries enforce `WHERE user_id = ?` parameter binding.
- **Multi-Tenant Protection**: Demonstrated and tested in `server/test-e2e.js`.

---

© 2026 SmartSpend AI. Built with precision and care.
