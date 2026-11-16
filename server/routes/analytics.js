const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// 1. Dashboard summary & Financial Health Score
router.get('/dashboard', (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    
    // Get last month string for comparison
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

    const income = currentTotals.income;
    const expenses = currentTotals.expenses;
    const savings = Math.max(0, income - expenses);
    const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;

    // Month over month percentage changes
    const incomeMoM = lastTotals.income > 0 
      ? (((income - lastTotals.income) / lastTotals.income) * 100).toFixed(1)
      : null;
    const expenseMoM = lastTotals.expenses > 0 
      ? (((expenses - lastTotals.expenses) / lastTotals.expenses) * 100).toFixed(1)
      : null;

    // Recent 5 transactions
    const recentTransactions = db.prepare(`
      SELECT id, type, amount, category, description, payment_method, date, created_at
      FROM transactions
      WHERE user_id = ?
      ORDER BY date DESC, id DESC
      LIMIT 6
    `).all(req.userId);

    // Current month category distribution
    const categorySpending = db.prepare(`
      SELECT category, SUM(amount) as amount, COUNT(*) as count
      FROM transactions
      WHERE user_id = ? AND type = 'expense' AND strftime('%Y-%m', date) = ?
      GROUP BY category
      ORDER BY amount DESC
    `).all(req.userId, currentMonth);

    // Budgets status
    const budgets = db.prepare(`
      SELECT b.id, b.category, b.amount,
        COALESCE(SUM(t.amount), 0) as spent
      FROM budgets b
      LEFT JOIN transactions t ON t.user_id = b.user_id 
        AND t.category = b.category 
        AND t.type = 'expense' 
        AND strftime('%Y-%m', t.date) = b.month
      WHERE b.user_id = ? AND b.month = ?
      GROUP BY b.id
    `).all(req.userId, currentMonth);

    let budgetSafeCount = 0;
    let budgetWarningCount = 0;
    let budgetExceededCount = 0;

    budgets.forEach(b => {
      const pct = b.amount > 0 ? (b.spent / b.amount) * 100 : 0;
      if (pct > 100) budgetExceededCount++;
      else if (pct >= 85) budgetWarningCount++;
      else budgetSafeCount++;
    });

    // Goals summary
    const goals = db.prepare(`
      SELECT id, name, target_amount, current_amount, target_date, color
      FROM goals
      WHERE user_id = ?
      ORDER BY (current_amount * 1.0 / target_amount) DESC
      LIMIT 4
    `).all(req.userId);

    // Financial Health Score Calculation (0-100)
    let savingsScore = 0; // 0-30
    if (parseFloat(savingsRate) >= 30) savingsScore = 30;
    else if (parseFloat(savingsRate) >= 20) savingsScore = 25;
    else if (parseFloat(savingsRate) >= 10) savingsScore = 15;
    else if (parseFloat(savingsRate) > 0) savingsScore = 8;

    let budgetScore = 20; // 0-30
    if (budgets.length > 0) {
      if (budgetExceededCount === 0 && budgetWarningCount === 0) budgetScore = 30;
      else if (budgetExceededCount === 0) budgetScore = 22;
      else if (budgetExceededCount === 1) budgetScore = 14;
      else budgetScore = 6;
    }

    let concentrationScore = 20; // 0-20
    if (categorySpending.length >= 3 && expenses > 0) {
      const topCategoryPct = (categorySpending[0].amount / expenses) * 100;
      if (topCategoryPct < 40) concentrationScore = 20;
      else if (topCategoryPct < 60) concentrationScore = 14;
      else concentrationScore = 8;
    }

    let goalScore = 10; // 0-20
    if (goals.length > 0) {
      const avgGoalProgress = goals.reduce((acc, g) => acc + (g.target_amount > 0 ? (g.current_amount / g.target_amount) : 0), 0) / goals.length;
      goalScore = Math.min(20, Math.round(avgGoalProgress * 20));
    }

    const healthScore = Math.min(100, Math.max(10, savingsScore + budgetScore + concentrationScore + goalScore));
    let healthGrade = 'Good';
    let healthColor = '#10B981';
    if (healthScore >= 80) { healthGrade = 'Excellent'; healthColor = '#10B981'; }
    else if (healthScore >= 65) { healthGrade = 'Good'; healthColor = '#3B82F6'; }
    else if (healthScore >= 50) { healthGrade = 'Moderate'; healthColor = '#F59E0B'; }
    else { healthGrade = 'Needs Attention'; healthColor = '#EF4444'; }

    return res.json({
      currentMonth,
      summary: {
        income,
        expenses,
        savings,
        savingsRate: parseFloat(savingsRate),
        incomeMoM: incomeMoM ? parseFloat(incomeMoM) : null,
        expenseMoM: expenseMoM ? parseFloat(expenseMoM) : null
      },
      health: {
        score: healthScore,
        grade: healthGrade,
        color: healthColor,
        components: {
          savingsScore,
          budgetScore,
          concentrationScore,
          goalScore
        }
      },
      recentTransactions,
      categorySpending,
      budgetsSummary: {
        totalBudgets: budgets.length,
        safe: budgetSafeCount,
        warning: budgetWarningCount,
        exceeded: budgetExceededCount
      },
      goalsPreview: goals.map(g => ({
        ...g,
        progress: g.target_amount > 0 ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)) : 0
      }))
    });
  } catch (err) {
    console.error('Error in dashboard analytics:', err);
    return res.status(500).json({ error: 'Failed to generate dashboard analytics.' });
  }
});

// 2. Multi-month trends (past 6 or 12 months)
router.get('/trends', (req, res) => {
  try {
    const monthsCount = parseInt(req.query.months) || 6;

    // Get last N months in chronologic order
    const monthlyData = db.prepare(`
      SELECT 
        strftime('%Y-%m', date) as month,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses
      FROM transactions
      WHERE user_id = ?
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month DESC
      LIMIT ?
    `).all(req.userId, monthsCount);

    const reversed = monthlyData.reverse();

    const formatted = reversed.map(m => {
      const savings = Math.max(0, m.income - m.expenses);
      const savingsRate = m.income > 0 ? ((savings / m.income) * 100).toFixed(1) : 0;
      return {
        month: m.month,
        income: m.income,
        expenses: m.expenses,
        savings,
        savingsRate: parseFloat(savingsRate)
      };
    });

    return res.json({ trends: formatted });
  } catch (err) {
    console.error('Error fetching trends:', err);
    return res.status(500).json({ error: 'Failed to fetch financial trends.' });
  }
});

// 3. Category deep-dive analytics
router.get('/categories', (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const month = req.query.month || currentMonth;

    const categoryBreakdown = db.prepare(`
      SELECT 
        category,
        SUM(amount) as totalAmount,
        COUNT(*) as transactionCount,
        AVG(amount) as avgAmount,
        MAX(amount) as maxAmount
      FROM transactions
      WHERE user_id = ? AND type = 'expense' AND strftime('%Y-%m', date) = ?
      GROUP BY category
      ORDER BY totalAmount DESC
    `).all(req.userId, month);

    const totalExpense = categoryBreakdown.reduce((acc, c) => acc + c.totalAmount, 0);

    const enriched = categoryBreakdown.map(c => ({
      ...c,
      percentage: totalExpense > 0 ? ((c.totalAmount / totalExpense) * 100).toFixed(1) : 0
    }));

    // Payment methods breakdown
    const paymentMethods = db.prepare(`
      SELECT 
        payment_method as method,
        SUM(amount) as totalAmount,
        COUNT(*) as count
      FROM transactions
      WHERE user_id = ? AND type = 'expense' AND strftime('%Y-%m', date) = ?
      GROUP BY payment_method
      ORDER BY totalAmount DESC
    `).all(req.userId, month);

    // Largest expenses this month
    const largestExpenses = db.prepare(`
      SELECT id, description, amount, category, payment_method, date
      FROM transactions
      WHERE user_id = ? AND type = 'expense' AND strftime('%Y-%m', date) = ?
      ORDER BY amount DESC
      LIMIT 5
    `).all(req.userId, month);

    return res.json({
      month,
      totalExpense,
      categories: enriched,
      paymentMethods,
      largestExpenses
    });
  } catch (err) {
    console.error('Error fetching category analytics:', err);
    return res.status(500).json({ error: 'Failed to fetch category analytics.' });
  }
});

module.exports = router;
