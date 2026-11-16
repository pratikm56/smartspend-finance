const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// 1. Get transactions with search, filter, sort, and pagination
router.get('/', (req, res) => {
  try {
    const {
      type, // 'income' | 'expense' | 'all'
      category,
      paymentMethod,
      search,
      startDate,
      endDate,
      month, // e.g. '2026-10'
      sortBy = 'date', // 'date' | 'amount' | 'category'
      sortOrder = 'DESC', // 'ASC' | 'DESC'
      limit = 100,
      offset = 0
    } = req.query;

    const conditions = ['user_id = ?'];
    const params = [req.userId];

    if (type && (type === 'income' || type === 'expense')) {
      conditions.push('type = ?');
      params.push(type);
    }

    if (category && category !== 'all') {
      conditions.push('category = ?');
      params.push(category);
    }

    if (paymentMethod && paymentMethod !== 'all') {
      conditions.push('payment_method = ?');
      params.push(paymentMethod);
    }

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

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      conditions.push('(description LIKE ? OR category LIKE ? OR notes LIKE ? OR payment_method LIKE ?)');
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = conditions.join(' AND ');

    // Validate sort
    const validSortCols = {
      date: 'date',
      amount: 'amount',
      category: 'category',
      created_at: 'created_at'
    };
    const sortCol = validSortCols[sortBy] || 'date';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get total count matching filter
    const countRow = db.prepare(`SELECT COUNT(*) as total FROM transactions WHERE ${whereClause}`).get(...params);

    // Get totals for the query
    const sumRow = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense
      FROM transactions WHERE ${whereClause}
    `).get(...params);

    // Query records with pagination
    const queryParams = [...params, parseInt(limit) || 100, parseInt(offset) || 0];
    const transactions = db.prepare(`
      SELECT id, type, amount, category, description, payment_method, date, notes, created_at
      FROM transactions
      WHERE ${whereClause}
      ORDER BY ${sortCol} ${order}, id DESC
      LIMIT ? OFFSET ?
    `).all(...queryParams);

    return res.json({
      transactions,
      total: countRow.total,
      summary: {
        totalIncome: sumRow.totalIncome,
        totalExpense: sumRow.totalExpense,
        netSavings: sumRow.totalIncome - sumRow.totalExpense,
        savingsRate: sumRow.totalIncome > 0 
          ? (((sumRow.totalIncome - sumRow.totalExpense) / sumRow.totalIncome) * 100).toFixed(1) 
          : 0
      }
    });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    return res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
});

// 2. Add transaction
router.post('/', (req, res) => {
  try {
    const { type, amount, category, description, payment_method = 'UPI', date, notes } = req.body;

    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: "Type must be either 'income' or 'expense'." });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number.' });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({ error: 'Category is required.' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Description is required.' });
    }

    const txDate = date || new Date().toISOString().slice(0, 10);

    const result = db.prepare(`
      INSERT INTO transactions (user_id, type, amount, category, description, payment_method, date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.userId,
      type,
      numAmount,
      category.trim(),
      description.trim(),
      payment_method.trim() || 'UPI',
      txDate,
      notes ? notes.trim() : null
    );

    const newTx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid);

    return res.status(201).json({
      message: `${type === 'income' ? 'Income' : 'Expense'} recorded successfully!`,
      transaction: newTx
    });
  } catch (err) {
    console.error('Error creating transaction:', err);
    return res.status(500).json({ error: 'Failed to create transaction.' });
  }
});

// 3. Update transaction
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, category, description, payment_method, date, notes } = req.body;

    const existing = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(id, req.userId);
    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    const updates = [];
    const params = [];

    if (type !== undefined) {
      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({ error: "Type must be 'income' or 'expense'." });
      }
      updates.push('type = ?');
      params.push(type);
    }

    if (amount !== undefined) {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number.' });
      }
      updates.push('amount = ?');
      params.push(numAmount);
    }

    if (category !== undefined) {
      if (!category.trim()) return res.status(400).json({ error: 'Category cannot be empty.' });
      updates.push('category = ?');
      params.push(category.trim());
    }

    if (description !== undefined) {
      if (!description.trim()) return res.status(400).json({ error: 'Description cannot be empty.' });
      updates.push('description = ?');
      params.push(description.trim());
    }

    if (payment_method !== undefined) {
      updates.push('payment_method = ?');
      params.push(payment_method.trim() || 'UPI');
    }

    if (date !== undefined) {
      updates.push('date = ?');
      params.push(date);
    }

    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes ? notes.trim() : null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields provided for update.' });
    }

    params.push(id, req.userId);
    db.prepare(`UPDATE transactions SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...params);

    const updatedTx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);

    return res.json({
      message: 'Transaction updated successfully!',
      transaction: updatedTx
    });
  } catch (err) {
    console.error('Error updating transaction:', err);
    return res.status(500).json({ error: 'Failed to update transaction.' });
  }
});

// 4. Delete transaction
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(id, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized.' });
    }

    return res.json({ message: 'Transaction deleted successfully.' });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    return res.status(500).json({ error: 'Failed to delete transaction.' });
  }
});

module.exports = router;
