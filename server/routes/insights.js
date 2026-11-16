const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const user = req.user;
    const currency = user.currency || '₹';
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const now = new Date();
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = lastMonthDate.toISOString().slice(0, 7);

    // Current month totals
    const currentTotals = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses
      FROM transactions
      WHERE user_id = ? AND strftime('%Y-%m', date) = ?
    `).get(req.userId, currentMonth);

    // Last month totals
    const lastTotals = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses
      FROM transactions
      WHERE user_id = ? AND strftime('%Y-%m', date) = ?
    `).get(req.userId, lastMonth);

    // Current category spending
    const currentCategories = db.prepare(`
      SELECT category, SUM(amount) as amount, COUNT(*) as count
      FROM transactions
      WHERE user_id = ? AND type = 'expense' AND strftime('%Y-%m', date) = ?
      GROUP BY category
      ORDER BY amount DESC
    `).all(req.userId, currentMonth);

    // Last month category spending
    const lastCategories = db.prepare(`
      SELECT category, SUM(amount) as amount
      FROM transactions
      WHERE user_id = ? AND type = 'expense' AND strftime('%Y-%m', date) = ?
      GROUP BY category
    `).all(req.userId, lastMonth);

    const lastCatMap = {};
    lastCategories.forEach(c => { lastCatMap[c.category] = c.amount; });

    // Active budgets for current month
    const budgets = db.prepare(`
      SELECT b.category, b.amount,
        COALESCE(SUM(t.amount), 0) as spent
      FROM budgets b
      LEFT JOIN transactions t ON t.user_id = b.user_id 
        AND t.category = b.category 
        AND t.type = 'expense' 
        AND strftime('%Y-%m', t.date) = b.month
      WHERE b.user_id = ? AND b.month = ?
      GROUP BY b.id
    `).all(req.userId, currentMonth);

    // Goals
    const goals = db.prepare(`
      SELECT name, target_amount, current_amount, target_date
      FROM goals
      WHERE user_id = ?
    `).all(req.userId);

    const insights = [];

    // If no transactions at all
    if (currentTotals.income === 0 && currentTotals.expenses === 0 && lastTotals.expenses === 0) {
      return res.json({
        insights: [
          {
            id: 'getting-started',
            type: 'opportunity',
            title: 'Welcome to SmartSpend AI',
            description: 'Begin by recording your recent income and expenses, or use the sample demo data to see intelligent analytics in action.',
            severity: 'info',
            metric: '0 Records',
            actionText: 'Add First Transaction'
          }
        ]
      });
    }

    // 1. Savings Rate Insight
    if (currentTotals.income > 0) {
      const savings = Math.max(0, currentTotals.income - currentTotals.expenses);
      const savingsRate = Math.round((savings / currentTotals.income) * 100);
      const targetPct = user.monthly_savings_target_pct || 20;

      if (savingsRate >= targetPct) {
        insights.push({
          id: 'savings-target-achieved',
          type: 'savings_milestone',
          title: `Strong Savings Rate of ${savingsRate}%`,
          description: `You have saved ${currency}${savings.toLocaleString()} this month, surpassing your target of ${targetPct}%. Keep up this financial momentum!`,
          severity: 'success',
          metric: `${savingsRate}% saved`
        });
      } else {
        insights.push({
          id: 'savings-target-lagging',
          type: 'savings_milestone',
          title: `Current Savings Rate is ${savingsRate}%`,
          description: `You have saved ${currency}${savings.toLocaleString()} out of ${currency}${currentTotals.income.toLocaleString()}. Your target is ${targetPct}%. Look for discretionary spending to optimize.`,
          severity: 'warning',
          metric: `${savingsRate}% / ${targetPct}% target`
        });
      }
    }

    // 2. Category Month-over-Month Increases/Decreases
    currentCategories.forEach(curr => {
      const prevAmount = lastCatMap[curr.category];
      if (prevAmount && prevAmount > 0) {
        const diff = curr.amount - prevAmount;
        const pctChange = Math.round(((diff) / prevAmount) * 100);
        if (pctChange >= 15 && diff >= 500) {
          insights.push({
            id: `cat-increase-${curr.category}`,
            type: 'trend',
            title: `${curr.category} Spending Surge (+${pctChange}%)`,
            description: `Your ${curr.category} spending increased by ${pctChange}% compared to last month (${currency}${curr.amount.toLocaleString()} vs ${currency}${prevAmount.toLocaleString()}).`,
            severity: 'warning',
            metric: `+${currency}${diff.toLocaleString()}`
          });
        } else if (pctChange <= -15 && Math.abs(diff) >= 500) {
          insights.push({
            id: `cat-decrease-${curr.category}`,
            type: 'trend',
            title: `Great Job Optimizing ${curr.category} (${pctChange}%)`,
            description: `You spent ${Math.abs(pctChange)}% less on ${curr.category} compared to last month. You saved ${currency}${Math.abs(diff).toLocaleString()} here!`,
            severity: 'success',
            metric: `-${currency}${Math.abs(diff).toLocaleString()}`
          });
        }
      }
    });

    // 3. Category Hierarchy / Concentration
    if (currentCategories.length >= 2 && currentTotals.expenses > 0) {
      const top1 = currentCategories[0];
      const top1Pct = Math.round((top1.amount / currentTotals.expenses) * 100);
      insights.push({
        id: 'top-spending-cat',
        type: 'spending_pattern',
        title: `${top1.category} is Your #1 Expense Category`,
        description: `${top1.category} accounts for ${top1Pct}% of your total monthly outflow (${currency}${top1.amount.toLocaleString()}).`,
        severity: top1Pct > 45 ? 'warning' : 'info',
        metric: `${top1Pct}% of outflow`
      });

      const top2 = currentCategories[1];
      const top2Pct = Math.round((top2.amount / currentTotals.expenses) * 100);
      insights.push({
        id: 'second-spending-cat',
        type: 'spending_pattern',
        title: `${top2.category} is Your 2nd Highest Spending Category`,
        description: `You spent ${currency}${top2.amount.toLocaleString()} on ${top2.category} (${top2Pct}% of total expenditures).`,
        severity: 'info',
        metric: `${top2Pct}% of outflow`
      });
    }

    // 4. Budget Alerts
    budgets.forEach(b => {
      const pctUsed = b.amount > 0 ? (b.spent / b.amount) * 100 : 0;
      if (pctUsed > 100) {
        insights.push({
          id: `budget-exceeded-${b.category}`,
          type: 'budget_alert',
          title: `${b.category} Budget Exceeded!`,
          description: `You have spent ${currency}${b.spent.toLocaleString()} against a planned budget of ${currency}${b.amount.toLocaleString()} (${pctUsed.toFixed(0)}% used). Over by ${currency}${(b.spent - b.amount).toLocaleString()}.`,
          severity: 'urgent',
          metric: `${pctUsed.toFixed(0)}% used`
        });
      } else if (pctUsed >= 85) {
        insights.push({
          id: `budget-warning-${b.category}`,
          type: 'budget_alert',
          title: `${b.category} Budget Almost Exhausted`,
          description: `You have consumed ${pctUsed.toFixed(0)}% of your ${b.category} budget. Only ${currency}${(b.amount - b.spent).toLocaleString()} remaining for the rest of the month.`,
          severity: 'warning',
          metric: `${currency}${(b.amount - b.spent).toLocaleString()} left`
        });
      }
    });

    // 5. Goals Milestones
    goals.forEach(g => {
      const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
      if (pct >= 100) {
        insights.push({
          id: `goal-completed-${g.name}`,
          type: 'savings_milestone',
          title: `Goal Reached: "${g.name}"!`,
          description: `You achieved 100% of your ${currency}${g.target_amount.toLocaleString()} target for ${g.name}. Outstanding commitment!`,
          severity: 'success',
          metric: '100% Complete'
        });
      } else if (pct >= 50 && pct < 60) {
        insights.push({
          id: `goal-halfway-${g.name}`,
          type: 'savings_milestone',
          title: `Halfway Milestone: "${g.name}"`,
          description: `You have funded ${pct.toFixed(0)}% (${currency}${g.current_amount.toLocaleString()}) of your target for ${g.name}.`,
          severity: 'info',
          metric: `${pct.toFixed(0)}% achieved`
        });
      }
    });

    // 6. Largest Individual Expense
    const largestTx = db.prepare(`
      SELECT description, amount, category, date
      FROM transactions
      WHERE user_id = ? AND type = 'expense' AND strftime('%Y-%m', date) = ?
      ORDER BY amount DESC
      LIMIT 1
    `).get(req.userId, currentMonth);

    if (largestTx && largestTx.amount > 0) {
      insights.push({
        id: 'largest-expense-record',
        type: 'spending_pattern',
        title: `Single Largest Outflow: "${largestTx.description}"`,
        description: `Your highest individual transaction this month was ${currency}${largestTx.amount.toLocaleString()} under ${largestTx.category} on ${largestTx.date}.`,
        severity: 'info',
        metric: `${currency}${largestTx.amount.toLocaleString()}`
      });
    }

    return res.json({ insights });
  } catch (err) {
    console.error('Error generating insights:', err);
    return res.status(500).json({ error: 'Failed to generate financial insights.' });
  }
});

module.exports = router;
