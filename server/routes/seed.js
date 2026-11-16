const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/demo-data', (req, res) => {
  try {
    const userId = req.userId;

    // Delete existing records for this user first
    db.prepare('DELETE FROM transactions WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM budgets WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM goals WHERE user_id = ?').run(userId);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth() + 1; // 1-12

    // Timezone-safe month formatting using mid-month day 15 to prevent UTC edge drift
    const getMonthStr = (offset) => {
      const d = new Date(currentYear, currentMonthNum - 1 - offset, 15);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    };

    const getDateStr = (offset, day) => {
      const d = new Date(currentYear, currentMonthNum - 1 - offset, day);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };

    const m0 = getMonthStr(0); // Current month
    const m1 = getMonthStr(1); // 1 month ago
    const m2 = getMonthStr(2); // 2 months ago
    const m3 = getMonthStr(3); // 3 months ago

    const insertTx = db.prepare(`
      INSERT INTO transactions (user_id, type, amount, category, description, payment_method, date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertTxTxn = db.transaction(() => {
      // Month 3 (3 months ago)
      insertTx.run(userId, 'income', 65000, 'Salary', 'Monthly Tech Corp Salary', 'Bank Transfer', getDateStr(3, 2), 'Direct bank credit');
      insertTx.run(userId, 'income', 10000, 'Freelancing', 'UI/UX Mobile App Redesign', 'UPI', getDateStr(3, 15), 'Client payment');
      insertTx.run(userId, 'expense', 18000, 'Rent', 'Apartment Monthly Rent', 'Net Banking', getDateStr(3, 3), 'Paid to landlord');
      insertTx.run(userId, 'expense', 5200, 'Food', 'Monthly Grocery Supermarket', 'Credit Card', getDateStr(3, 5), 'Groceries & essentials');
      insertTx.run(userId, 'expense', 2400, 'Food', 'Weekend Dining & Takeaway', 'UPI', getDateStr(3, 12), 'Dining with friends');
      insertTx.run(userId, 'expense', 2200, 'Transportation', 'Metro Card & Fuel Refill', 'Debit Card', getDateStr(3, 8), 'Commute');
      insertTx.run(userId, 'expense', 1850, 'Utilities', 'Electricity & Water Bill', 'UPI', getDateStr(3, 10), 'Monthly utility');
      insertTx.run(userId, 'expense', 899, 'Subscriptions', 'Netflix & Spotify Premium', 'Credit Card', getDateStr(3, 14), 'Auto-debit');
      insertTx.run(userId, 'expense', 3500, 'Shopping', 'New Work Sneakers', 'Credit Card', getDateStr(3, 20), 'Amazon fashion');
      insertTx.run(userId, 'expense', 1500, 'Healthcare', 'Dental Checkup & Medicines', 'UPI', getDateStr(3, 24), 'Clinic visit');

      // Month 2 (2 months ago)
      insertTx.run(userId, 'income', 65000, 'Salary', 'Monthly Tech Corp Salary', 'Bank Transfer', getDateStr(2, 2), 'Direct bank credit');
      insertTx.run(userId, 'income', 14000, 'Freelancing', 'Fullstack API Integration project', 'UPI', getDateStr(2, 18), 'Contract payout');
      insertTx.run(userId, 'expense', 18000, 'Rent', 'Apartment Monthly Rent', 'Net Banking', getDateStr(2, 3), 'Paid to landlord');
      insertTx.run(userId, 'expense', 5600, 'Food', 'Groceries & Pantry Restock', 'Credit Card', getDateStr(2, 6), 'Whole foods');
      insertTx.run(userId, 'expense', 2800, 'Food', 'Cafe & Italian Bistro', 'UPI', getDateStr(2, 15), 'Social dining');
      insertTx.run(userId, 'expense', 2500, 'Transportation', 'Fuel & Cab Fares', 'Debit Card', getDateStr(2, 9), 'City travel');
      insertTx.run(userId, 'expense', 1900, 'Utilities', 'A/C Electricity & Wi-Fi', 'UPI', getDateStr(2, 11), 'Fiber internet');
      insertTx.run(userId, 'expense', 899, 'Subscriptions', 'Netflix & Spotify Premium', 'Credit Card', getDateStr(2, 14), 'Auto-debit');
      insertTx.run(userId, 'expense', 4200, 'Shopping', 'Noise Cancelling Headphones', 'Credit Card', getDateStr(2, 22), 'Sale discount');
      insertTx.run(userId, 'expense', 1200, 'Entertainment', 'IMAX Movie Tickets & Snacks', 'UPI', getDateStr(2, 25), 'Weekend movie');

      // Month 1 (1 month ago)
      insertTx.run(userId, 'income', 65000, 'Salary', 'Monthly Tech Corp Salary', 'Bank Transfer', getDateStr(1, 2), 'Direct bank credit');
      insertTx.run(userId, 'income', 8500, 'Freelancing', 'Consulting Advisory Call', 'UPI', getDateStr(1, 12), 'Retainer');
      insertTx.run(userId, 'expense', 18000, 'Rent', 'Apartment Monthly Rent', 'Net Banking', getDateStr(1, 3), 'Paid to landlord');
      insertTx.run(userId, 'expense', 6100, 'Food', 'Organic Mart & Provisions', 'Credit Card', getDateStr(1, 5), 'Grocery bill');
      insertTx.run(userId, 'expense', 3200, 'Food', 'Rooftop Dinner & Drinks', 'Credit Card', getDateStr(1, 14), 'Team dinner');
      insertTx.run(userId, 'expense', 2900, 'Transportation', 'Car Maintenance & Petrol', 'Debit Card', getDateStr(1, 10), 'Vehicle service');
      insertTx.run(userId, 'expense', 2100, 'Utilities', 'High-speed Fiber & Power', 'UPI', getDateStr(1, 8), 'Broadband + electricity');
      insertTx.run(userId, 'expense', 899, 'Subscriptions', 'Netflix & Spotify Premium', 'Credit Card', getDateStr(1, 14), 'Auto-debit');
      insertTx.run(userId, 'expense', 5400, 'Shopping', 'Ergonomic Desk Chair', 'Credit Card', getDateStr(1, 19), 'Home office setup');
      insertTx.run(userId, 'expense', 2000, 'Entertainment', 'Concert Pass', 'UPI', getDateStr(1, 23), 'Music festival');

      // Month 0 (Current month)
      insertTx.run(userId, 'income', 65000, 'Salary', 'Monthly Tech Corp Salary', 'Bank Transfer', getDateStr(0, 2), 'Direct bank credit');
      insertTx.run(userId, 'income', 12000, 'Freelancing', 'Antigravity UI System Template', 'UPI', getDateStr(0, 4), 'Freelance design client');
      insertTx.run(userId, 'expense', 18000, 'Rent', 'Apartment Monthly Rent', 'Net Banking', getDateStr(0, 2), 'Paid on 2nd of month');
      insertTx.run(userId, 'expense', 6400, 'Food', 'Supermarket Grocery Restock', 'Credit Card', getDateStr(0, 3), 'Fortnightly staples');
      insertTx.run(userId, 'expense', 2600, 'Food', 'Weekend Brunch & Specialty Coffee', 'UPI', getDateStr(0, 5), 'Artisan cafe');
      insertTx.run(userId, 'expense', 2300, 'Transportation', 'Metro SmartCard & Fuel', 'Debit Card', getDateStr(0, 3), 'Regular commute');
      insertTx.run(userId, 'expense', 1950, 'Utilities', 'Broadband & City Power', 'UPI', getDateStr(0, 4), 'Monthly broadband bill');
      insertTx.run(userId, 'expense', 899, 'Subscriptions', 'Netflix & Spotify Premium', 'Credit Card', getDateStr(0, 4), 'Auto-renewal');
      insertTx.run(userId, 'expense', 3100, 'Shopping', 'Mechanical Keyboard & Deskmat', 'Credit Card', getDateStr(0, 4), 'Work setup accessories');
    });

    insertTxTxn();

    // Budgets for current month
    const insertBudget = db.prepare(`
      INSERT INTO budgets (user_id, category, month, amount)
      VALUES (?, ?, ?, ?)
    `);

    insertBudget.run(userId, 'Food', m0, 10000);
    insertBudget.run(userId, 'Shopping', m0, 5000);
    insertBudget.run(userId, 'Transportation', m0, 3500);
    insertBudget.run(userId, 'Utilities', m0, 2500);
    insertBudget.run(userId, 'Entertainment', m0, 3000);
    insertBudget.run(userId, 'Subscriptions', m0, 1200);

    // Financial Goals
    const insertGoal = db.prepare(`
      INSERT INTO goals (user_id, name, target_amount, current_amount, target_date, category, color, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertGoal.run(
      userId,
      'New M3 MacBook Pro',
      140000,
      85000,
      `${currentYear}-12-31`,
      'Tech & Work',
      '#6366F1',
      'Saving for Apple Silicon development workstation'
    );

    insertGoal.run(
      userId,
      'Emergency Fund (6 Months)',
      200000,
      135000,
      `${currentYear + 1}-06-30`,
      'Safety Net',
      '#10B981',
      'High-yield liquid savings buffer'
    );

    insertGoal.run(
      userId,
      'Japan Vacation Tour',
      180000,
      62000,
      `${currentYear + 1}-04-15`,
      'Travel & Adventure',
      '#EC4899',
      'Flights, JR Rail Pass, and Kyoto hotels'
    );

    return res.json({
      message: 'Realistic fintech sample data loaded successfully! All dashboard charts, analytics, predictive models, and AI insights are now populated.',
      currentMonth: m0,
      recordsInserted: {
        transactions: 37,
        budgets: 6,
        goals: 3
      }
    });
  } catch (err) {
    console.error('Error seeding demo data:', err);
    return res.status(500).json({ error: 'Failed to seed sample data.' });
  }
});

// Clear all data for current user
router.post('/clear-data', (req, res) => {
  try {
    const userId = req.userId;
    db.prepare('DELETE FROM transactions WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM budgets WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM goals WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM chat_messages WHERE user_id = ?').run(userId);

    return res.json({ message: 'All personal financial records cleared successfully.' });
  } catch (err) {
    console.error('Error clearing user data:', err);
    return res.status(500).json({ error: 'Failed to clear records.' });
  }
});

module.exports = router;
