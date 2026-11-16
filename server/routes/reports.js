const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// 1. Get comprehensive report data
router.get('/summary', (req, res) => {
  try {
    const { month, startDate, endDate, category } = req.query;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const targetMonth = month || (!startDate && !endDate ? currentMonth : null);

    const conditions = ['user_id = ?'];
    const params = [req.userId];

    if (targetMonth) {
      conditions.push("strftime('%Y-%m', date) = ?");
      params.push(targetMonth);
    } else {
      if (startDate) {
        conditions.push('date >= ?');
        params.push(startDate);
      }
      if (endDate) {
        conditions.push('date <= ?');
        params.push(endDate);
      }
    }

    if (category && category !== 'all') {
      conditions.push('category = ?');
      params.push(category);
    }

    const whereClause = conditions.join(' AND ');

    // Aggregates
    const totals = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense,
        COUNT(*) as totalTransactions
      FROM transactions
      WHERE ${whereClause}
    `).get(...params);

    // Category breakdown
    const categoryBreakdown = db.prepare(`
      SELECT 
        category,
        type,
        SUM(amount) as totalAmount,
        COUNT(*) as count
      FROM transactions
      WHERE ${whereClause}
      GROUP BY category, type
      ORDER BY totalAmount DESC
    `).all(...params);

    // Payment method breakdown
    const paymentMethods = db.prepare(`
      SELECT 
        payment_method,
        SUM(amount) as totalAmount,
        COUNT(*) as count
      FROM transactions
      WHERE ${whereClause}
      GROUP BY payment_method
      ORDER BY totalAmount DESC
    `).all(...params);

    // Individual transactions list
    const transactions = db.prepare(`
      SELECT id, type, amount, category, description, payment_method, date, notes
      FROM transactions
      WHERE ${whereClause}
      ORDER BY date DESC, id DESC
    `).all(...params);

    // Budgets for the target month if applicable
    let budgets = [];
    if (targetMonth) {
      budgets = db.prepare(`
        SELECT b.category, b.amount as budgeted,
          COALESCE(SUM(t.amount), 0) as actualSpent
        FROM budgets b
        LEFT JOIN transactions t ON t.user_id = b.user_id 
          AND t.category = b.category 
          AND t.type = 'expense' 
          AND strftime('%Y-%m', t.date) = b.month
        WHERE b.user_id = ? AND b.month = ?
        GROUP BY b.id
      `).all(req.userId, targetMonth);
    }

    const netSavings = totals.totalIncome - totals.totalExpense;
    const savingsRate = totals.totalIncome > 0 
      ? ((netSavings / totals.totalIncome) * 100).toFixed(1) 
      : 0;

    return res.json({
      filter: {
        month: targetMonth,
        startDate: startDate || null,
        endDate: endDate || null,
        category: category || 'all'
      },
      summary: {
        totalIncome: totals.totalIncome,
        totalExpense: totals.totalExpense,
        netSavings,
        savingsRate: parseFloat(savingsRate),
        transactionCount: totals.totalTransactions
      },
      categoryBreakdown,
      paymentMethods,
      budgets,
      transactions
    });
  } catch (err) {
    console.error('Error generating report summary:', err);
    return res.status(500).json({ error: 'Failed to generate financial report.' });
  }
});

// 2. Export transactions to CSV
router.get('/export/csv', (req, res) => {
  try {
    const { month, startDate, endDate, type, category } = req.query;

    const conditions = ['user_id = ?'];
    const params = [req.userId];

    if (month) {
      conditions.push("strftime('%Y-%m', date) = ?");
      params.push(month);
    } else {
      if (startDate) {
        conditions.push('date >= ?');
        params.push(startDate);
      }
      if (endDate) {
        conditions.push('date <= ?');
        params.push(endDate);
      }
    }

    if (type && ['income', 'expense'].includes(type)) {
      conditions.push('type = ?');
      params.push(type);
    }

    if (category && category !== 'all') {
      conditions.push('category = ?');
      params.push(category);
    }

    const whereClause = conditions.join(' AND ');

    const rows = db.prepare(`
      SELECT date, type, category, description, amount, payment_method, notes
      FROM transactions
      WHERE ${whereClause}
      ORDER BY date DESC, id DESC
    `).all(...params);

    // Build CSV string
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Payment Method', 'Notes'];
    const csvLines = [headers.join(',')];

    rows.forEach(r => {
      const line = [
        `"${r.date}"`,
        `"${r.type}"`,
        `"${(r.category || '').replace(/"/g, '""')}"`,
        `"${(r.description || '').replace(/"/g, '""')}"`,
        r.amount,
        `"${(r.payment_method || '').replace(/"/g, '""')}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ];
      csvLines.push(line.join(','));
    });

    const csvContent = csvLines.join('\r\n');
    const filename = `smartspend-report-${month || new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvContent);
  } catch (err) {
    console.error('Error generating CSV export:', err);
    return res.status(500).json({ error: 'Failed to export CSV.' });
  }
});

module.exports = router;
