const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// 1. Get budgets for a month with real-time spend comparison
router.get('/', (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // e.g. '2026-10'
    const month = req.query.month || currentMonth;

    const budgets = db.prepare(`
      SELECT id, category, month, amount, created_at
      FROM budgets
      WHERE user_id = ? AND month = ?
      ORDER BY amount DESC
    `).all(req.userId, month);

    // Calculate actual spending for each category in this month
    const expensesByCategory = db.prepare(`
      SELECT category, SUM(amount) as totalSpent
      FROM transactions
      WHERE user_id = ? AND type = 'expense' AND strftime('%Y-%m', date) = ?
      GROUP BY category
    `).all(req.userId, month);

    const spendMap = {};
    expensesByCategory.forEach(item => {
      spendMap[item.category] = item.totalSpent;
    });

    let totalBudgeted = 0;
    let totalSpentInBudgets = 0;

    const enrichedBudgets = budgets.map(b => {
      const spent = spendMap[b.category] || 0;
      const remaining = Math.max(0, b.amount - spent);
      const usedPct = b.amount > 0 ? (spent / b.amount) * 100 : 0;

      let status = 'safe'; // < 75%
      if (usedPct > 100) status = 'exceeded';
      else if (usedPct >= 90) status = 'danger';
      else if (usedPct >= 75) status = 'warning';

      totalBudgeted += b.amount;
      totalSpentInBudgets += spent;

      return {
        ...b,
        spent,
        remaining: b.amount - spent,
        usedPercentage: Math.min(usedPct, 999).toFixed(1),
        status
      };
    });

    // Also get total expenses for the entire month
    const totalMonthExpenseRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as totalExpense
      FROM transactions
      WHERE user_id = ? AND type = 'expense' AND strftime('%Y-%m', date) = ?
    `).get(req.userId, month);

    return res.json({
      month,
      budgets: enrichedBudgets,
      summary: {
        totalBudgeted,
        totalSpentInBudgets,
        totalMonthExpense: totalMonthExpenseRow.totalExpense,
        remainingOverall: totalBudgeted - totalSpentInBudgets,
        overallUsedPercentage: totalBudgeted > 0 
          ? ((totalSpentInBudgets / totalBudgeted) * 100).toFixed(1) 
          : 0
      }
    });
  } catch (err) {
    console.error('Error fetching budgets:', err);
    return res.status(500).json({ error: 'Failed to fetch budget information.' });
  }
});

// 2. Create or update budget for a category
router.post('/', (req, res) => {
  try {
    const { category, month, amount } = req.body;

    if (!category || !category.trim()) {
      return res.status(400).json({ error: 'Category is required.' });
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const targetMonth = month || currentMonth;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Budget amount must be a positive number.' });
    }

    const cleanCategory = category.trim();

    // Check if budget exists for this month & category
    const existing = db.prepare(`
      SELECT id FROM budgets WHERE user_id = ? AND category = ? AND month = ?
    `).get(req.userId, cleanCategory, targetMonth);

    if (existing) {
      db.prepare(`
        UPDATE budgets SET amount = ? WHERE id = ?
      `).run(numAmount, existing.id);

      const updated = db.prepare('SELECT * FROM budgets WHERE id = ?').get(existing.id);
      return res.json({ message: 'Budget updated successfully!', budget: updated });
    } else {
      const result = db.prepare(`
        INSERT INTO budgets (user_id, category, month, amount)
        VALUES (?, ?, ?, ?)
      `).run(req.userId, cleanCategory, targetMonth, numAmount);

      const created = db.prepare('SELECT * FROM budgets WHERE id = ?').get(result.lastInsertRowid);
      return res.status(201).json({ message: 'Budget created successfully!', budget: created });
    }
  } catch (err) {
    console.error('Error creating/updating budget:', err);
    return res.status(500).json({ error: 'Failed to save budget.' });
  }
});

// 3. Delete budget
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?').run(id, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Budget not found or unauthorized.' });
    }

    return res.json({ message: 'Budget deleted successfully.' });
  } catch (err) {
    console.error('Error deleting budget:', err);
    return res.status(500).json({ error: 'Failed to delete budget.' });
  }
});

module.exports = router;
