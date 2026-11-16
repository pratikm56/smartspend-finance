const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// 1. Get all financial goals with progress calculations
router.get('/', (req, res) => {
  try {
    const goals = db.prepare(`
      SELECT id, name, target_amount, current_amount, target_date, category, color, notes, created_at
      FROM goals
      WHERE user_id = ?
      ORDER BY target_date ASC
    `).all(req.userId);

    const now = new Date();

    const enrichedGoals = goals.map(g => {
      const remaining = Math.max(0, g.target_amount - g.current_amount);
      const progressPct = g.target_amount > 0 ? ((g.current_amount / g.target_amount) * 100) : 0;
      
      const targetDate = new Date(g.target_date);
      const diffTime = targetDate - now;
      const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30));
      const monthlyPaceNeeded = remaining > 0 ? (remaining / monthsRemaining) : 0;

      return {
        ...g,
        remaining,
        progressPercentage: Math.min(progressPct, 100).toFixed(1),
        isCompleted: g.current_amount >= g.target_amount,
        daysRemaining,
        monthsRemaining,
        monthlyPaceNeeded: Math.round(monthlyPaceNeeded)
      };
    });

    const totalTarget = goals.reduce((acc, g) => acc + g.target_amount, 0);
    const totalSaved = goals.reduce((acc, g) => acc + g.current_amount, 0);
    const overallProgress = totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : 0;

    return res.json({
      goals: enrichedGoals,
      summary: {
        totalGoals: goals.length,
        totalTarget,
        totalSaved,
        totalRemaining: Math.max(0, totalTarget - totalSaved),
        overallProgress
      }
    });
  } catch (err) {
    console.error('Error fetching goals:', err);
    return res.status(500).json({ error: 'Failed to fetch financial goals.' });
  }
});

// 2. Create financial goal
router.post('/', (req, res) => {
  try {
    const { name, target_amount, current_amount = 0, target_date, category = 'Savings', color = '#3B82F6', notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Goal title is required.' });
    }

    const numTarget = parseFloat(target_amount);
    if (isNaN(numTarget) || numTarget <= 0) {
      return res.status(400).json({ error: 'Target amount must be a positive number.' });
    }

    const numCurrent = parseFloat(current_amount) || 0;
    if (numCurrent < 0) {
      return res.status(400).json({ error: 'Current amount cannot be negative.' });
    }

    if (!target_date) {
      return res.status(400).json({ error: 'Target completion date is required.' });
    }

    const result = db.prepare(`
      INSERT INTO goals (user_id, name, target_amount, current_amount, target_date, category, color, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.userId,
      name.trim(),
      numTarget,
      numCurrent,
      target_date,
      category.trim() || 'Savings',
      color || '#3B82F6',
      notes ? notes.trim() : null
    );

    const created = db.prepare('SELECT * FROM goals WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ message: 'Goal created successfully!', goal: created });
  } catch (err) {
    console.error('Error creating goal:', err);
    return res.status(500).json({ error: 'Failed to create goal.' });
  }
});

// 3. Update goal
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, target_amount, current_amount, target_date, category, color, notes } = req.body;

    const existing = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(id, req.userId);
    if (!existing) {
      return res.status(404).json({ error: 'Goal not found.' });
    }

    const updates = [];
    const params = [];

    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ error: 'Goal name cannot be empty.' });
      updates.push('name = ?');
      params.push(name.trim());
    }

    if (target_amount !== undefined) {
      const numTarget = parseFloat(target_amount);
      if (isNaN(numTarget) || numTarget <= 0) return res.status(400).json({ error: 'Target amount must be positive.' });
      updates.push('target_amount = ?');
      params.push(numTarget);
    }

    if (current_amount !== undefined) {
      const numCurrent = parseFloat(current_amount);
      if (isNaN(numCurrent) || numCurrent < 0) return res.status(400).json({ error: 'Current amount cannot be negative.' });
      updates.push('current_amount = ?');
      params.push(numCurrent);
    }

    if (target_date !== undefined) {
      updates.push('target_date = ?');
      params.push(target_date);
    }

    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category.trim() || 'Savings');
    }

    if (color !== undefined) {
      updates.push('color = ?');
      params.push(color);
    }

    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes ? notes.trim() : null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields provided to update.' });
    }

    params.push(id, req.userId);
    db.prepare(`UPDATE goals SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...params);

    const updated = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
    return res.json({ message: 'Goal updated successfully!', goal: updated });
  } catch (err) {
    console.error('Error updating goal:', err);
    return res.status(500).json({ error: 'Failed to update goal.' });
  }
});

// 4. Quick deposit / add contribution to goal
router.post('/:id/deposit', (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const deposit = parseFloat(amount);
    if (isNaN(deposit) || deposit <= 0) {
      return res.status(400).json({ error: 'Contribution amount must be a positive number.' });
    }

    const goal = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(id, req.userId);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found.' });
    }

    const newAmount = goal.current_amount + deposit;
    db.prepare('UPDATE goals SET current_amount = ? WHERE id = ?').run(newAmount, id);

    const updated = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
    const reachedTarget = newAmount >= goal.target_amount;

    return res.json({
      message: reachedTarget ? '🎉 Congratulations! You reached your savings goal!' : `Added contribution successfully!`,
      goal: updated,
      reachedTarget
    });
  } catch (err) {
    console.error('Error adding contribution:', err);
    return res.status(500).json({ error: 'Failed to add contribution.' });
  }
});

// 5. Delete goal
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(id, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Goal not found or unauthorized.' });
    }

    return res.json({ message: 'Goal deleted successfully.' });
  } catch (err) {
    console.error('Error deleting goal:', err);
    return res.status(500).json({ error: 'Failed to delete goal.' });
  }
});

module.exports = router;
