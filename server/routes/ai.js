const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { GoogleGenAI } = require('@google/genai');

router.use(authenticateToken);

// Helper to gather comprehensive financial context for the user
function getUserFinancialContext(userId, currency) {
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
  `).get(userId, currentMonth);

  // Last month totals
  const lastTotals = db.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses
    FROM transactions
    WHERE user_id = ? AND strftime('%Y-%m', date) = ?
  `).get(userId, lastMonth);

  // Category breakdown
  const categorySpending = db.prepare(`
    SELECT category, SUM(amount) as amount, COUNT(*) as count
    FROM transactions
    WHERE user_id = ? AND type = 'expense' AND strftime('%Y-%m', date) = ?
    GROUP BY category
    ORDER BY amount DESC
  `).all(userId, currentMonth);

  // Budgets
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
  `).all(userId, currentMonth);

  // Goals
  const goals = db.prepare(`
    SELECT name, target_amount, current_amount, target_date
    FROM goals
    WHERE user_id = ?
  `).all(userId);

  // Largest expense this month
  const largestExpense = db.prepare(`
    SELECT description, amount, category, date
    FROM transactions
    WHERE user_id = ? AND type = 'expense' AND strftime('%Y-%m', date) = ?
    ORDER BY amount DESC
    LIMIT 1
  `).get(userId, currentMonth);

  // Recent 5 transactions
  const recentTransactions = db.prepare(`
    SELECT type, amount, category, description, date
    FROM transactions
    WHERE user_id = ?
    ORDER BY date DESC, id DESC
    LIMIT 5
  `).all(userId);

  const savings = Math.max(0, currentTotals.income - currentTotals.expenses);
  const savingsRate = currentTotals.income > 0 
    ? ((savings / currentTotals.income) * 100).toFixed(1) 
    : '0';

  return {
    currency,
    currentMonth,
    lastMonth,
    income: currentTotals.income,
    expenses: currentTotals.expenses,
    savings,
    savingsRate,
    lastMonthIncome: lastTotals.income,
    lastMonthExpenses: lastTotals.expenses,
    categories: categorySpending,
    budgets: budgets.map(b => ({
      category: b.category,
      budget: b.amount,
      spent: b.spent,
      remaining: b.amount - b.spent,
      usedPct: b.amount > 0 ? ((b.spent / b.amount) * 100).toFixed(1) : '0'
    })),
    goals: goals.map(g => ({
      name: g.name,
      target: g.target_amount,
      current: g.current_amount,
      remaining: Math.max(0, g.target_amount - g.current_amount),
      progressPct: g.target_amount > 0 ? ((g.current_amount / g.target_amount) * 100).toFixed(1) : '0'
    })),
    largestExpense,
    recentTransactions
  };
}

// Built-in Intelligent Financial Assistant NLP Engine
function generateLocalAIResponse(question, context) {
  const q = question.toLowerCase();
  const c = context;
  const sym = c.currency;

  // 1. Total spending this month
  if (q.includes('how much') && (q.includes('spend') || q.includes('spent') || q.includes('expense')) && (q.includes('month') || q.includes('total') || !q.includes('on '))) {
    return `### 📊 Monthly Spending Summary (${c.currentMonth})

You have spent **${sym}${c.expenses.toLocaleString()}** so far this month across ${c.categories.reduce((a, b) => a + b.count, 0)} transactions.

* **Total Income:** ${sym}${c.income.toLocaleString()}
* **Total Expenses:** ${sym}${c.expenses.toLocaleString()}
* **Net Savings:** ${sym}${c.savings.toLocaleString()}
* **Savings Rate:** **${c.savingsRate}%**

${c.categories.length > 0 ? `Your highest expense category is **${c.categories[0].category}** at ${sym}${c.categories[0].amount.toLocaleString()}.` : 'You have not recorded any category expenses yet.'}

*Disclaimer: Informational assistant only, not a licensed financial advisor.*`;
  }

  // 2. Spending on a specific category (e.g. food, shopping, rent, etc.)
  for (const cat of c.categories) {
    if (q.includes(cat.category.toLowerCase())) {
      const pct = c.expenses > 0 ? ((cat.amount / c.expenses) * 100).toFixed(1) : 0;
      const budgetMatch = c.budgets.find(b => b.category.toLowerCase() === cat.category.toLowerCase());
      let budgetInfo = '';
      if (budgetMatch) {
        budgetInfo = `\n* **Assigned Budget:** ${sym}${budgetMatch.budget.toLocaleString()}\n* **Budget Used:** **${budgetMatch.usedPct}%** (${sym}${budgetMatch.remaining > 0 ? `${budgetMatch.remaining.toLocaleString()} left` : `Exceeded by ${Math.abs(budgetMatch.remaining).toLocaleString()}`})`;
      }

      return `### 🍽️ Spending on ${cat.category}

You have spent **${sym}${cat.amount.toLocaleString()}** on **${cat.category}** this month across ${cat.count} transaction(s).

* **Share of Total Expenses:** ${pct}%${budgetInfo}

💡 *Smart Tip:* ${pct > 30 ? `Consider looking for substitutions or weekly spending limits since ${cat.category} represents almost a third of your total expenditures.` : `Your spending in ${cat.category} appears reasonable within your current habits.`}

*Disclaimer: Informational assistant only, not a licensed financial advisor.*`;
    }
  }

  // 3. Where spending the most / highest spending category
  if (q.includes('where') && (q.includes('spending the most') || q.includes('most') || q.includes('highest') || q.includes('top category'))) {
    if (c.categories.length === 0) {
      return `You don't have any recorded expenses for ${c.currentMonth} yet. Add transactions to see your top spending categories!`;
    }
    const top = c.categories.slice(0, 3);
    return `### 🔍 Top Spending Categories (${c.currentMonth})

Your largest outflow areas are:

${top.map((item, idx) => `${idx + 1}. **${item.category}**: ${sym}${item.amount.toLocaleString()} (${c.expenses > 0 ? ((item.amount / c.expenses) * 100).toFixed(1) : 0}%)`).join('\n')}

**${top[0].category}** is your #1 spending area. Tracking daily purchases in this category can help unlock greater monthly savings!

*Disclaimer: Informational assistant only, not a licensed financial advisor.*`;
  }

  // 4. Biggest individual expense
  if (q.includes('biggest expense') || q.includes('largest expense') || q.includes('highest expense') || q.includes('single biggest')) {
    if (!c.largestExpense) {
      return `You haven't recorded any expenses for ${c.currentMonth} yet.`;
    }
    return `### ⚡ Single Largest Expense

Your biggest individual transaction this month was:

* **Item:** **${c.largestExpense.description}**
* **Amount:** **${sym}${c.largestExpense.amount.toLocaleString()}**
* **Category:** ${c.largestExpense.category}
* **Date:** ${c.largestExpense.date}

This transaction represented **${c.expenses > 0 ? ((c.largestExpense.amount / c.expenses) * 100).toFixed(1) : 0}%** of your total monthly spending.

*Disclaimer: Informational assistant only, not a licensed financial advisor.*`;
  }

  // 5. How much have I saved / savings
  if (q.includes('saved') || q.includes('savings') || q.includes('net savings')) {
    const goalsSummary = c.goals.map(g => `* **${g.name}:** ${sym}${g.current.toLocaleString()} / ${sym}${g.target.toLocaleString()} (${g.progressPct}%)`).join('\n');
    return `### 💰 Savings Overview

Here is your current savings breakdown for **${c.currentMonth}**:

* **Monthly Inflow:** ${sym}${c.income.toLocaleString()}
* **Monthly Outflow:** ${sym}${c.expenses.toLocaleString()}
* **Net Monthly Savings:** **${sym}${c.savings.toLocaleString()}**
* **Savings Rate:** **${c.savingsRate}%** (Target: 20%)

${c.goals.length > 0 ? `#### 🎯 Active Savings Goals:\n${goalsSummary}` : 'You have not configured any savings goals yet. Setting one in the Goals tab can help build focused saving habits!'}

*Disclaimer: Informational assistant only, not a licensed financial advisor.*`;
  }

  // 6. Compare with last month
  if (q.includes('compare') || q.includes('last month') || q.includes('previous month') || q.includes('versus last')) {
    const expDiff = c.expenses - c.lastMonthExpenses;
    const expPct = c.lastMonthExpenses > 0 ? ((expDiff / c.lastMonthExpenses) * 100).toFixed(1) : null;
    const incDiff = c.income - c.lastMonthIncome;

    return `### ⚖️ Month-over-Month Financial Comparison

Comparing **${c.currentMonth}** with **${c.lastMonth}**:

* **Expenses:**
  * Current: ${sym}${c.expenses.toLocaleString()}
  * Last Month: ${sym}${c.lastMonthExpenses.toLocaleString()}
  * Variance: ${expDiff > 0 ? `🔺 Increased by ${sym}${expDiff.toLocaleString()} (${expPct}%)` : `🔻 Decreased by ${sym}${Math.abs(expDiff).toLocaleString()} (${Math.abs(expPct || 0)}%)`}

* **Income:**
  * Current: ${sym}${c.income.toLocaleString()}
  * Last Month: ${sym}${c.lastMonthIncome.toLocaleString()}
  * Variance: ${incDiff >= 0 ? `+${sym}${incDiff.toLocaleString()}` : `-${sym}${Math.abs(incDiff).toLocaleString()}`}

${expDiff > 0 ? '⚠️ Your expenses increased compared to last month. Review your top discretionary categories to balance out.' : '🎉 Great job! Your spending is lower than last month, increasing your net savings!'}

*Disclaimer: Informational assistant only, not a licensed financial advisor.*`;
  }

  // 7. Am I staying within budget / budget status
  if (q.includes('budget') || q.includes('within') || q.includes('staying in')) {
    if (c.budgets.length === 0) {
      return `You haven't set up any budgets for **${c.currentMonth}** yet. Navigate to the **Budgets** section to set spending targets for your key categories!`;
    }
    const exceeded = c.budgets.filter(b => b.spent > b.budget);
    const warnings = c.budgets.filter(b => b.spent <= b.budget && parseFloat(b.usedPct) >= 80);
    const safe = c.budgets.filter(b => parseFloat(b.usedPct) < 80);

    let summaryText = `### 📋 Budget Health Check (${c.currentMonth})\n\n`;
    if (exceeded.length > 0) {
      summaryText += `🚨 **Budgets Exceeded:**\n${exceeded.map(b => `* **${b.category}:** Spent ${sym}${b.spent.toLocaleString()} / ${sym}${b.budget.toLocaleString()} (${b.usedPct}%) - Over by ${sym}${Math.abs(b.remaining).toLocaleString()}`).join('\n')}\n\n`;
    }
    if (warnings.length > 0) {
      summaryText += `⚠️ **High Usage Warning (>80%):**\n${warnings.map(b => `* **${b.category}:** Spent ${sym}${b.spent.toLocaleString()} / ${sym}${b.budget.toLocaleString()} (${b.usedPct}%) - ${sym}${b.remaining.toLocaleString()} remaining`).join('\n')}\n\n`;
    }
    if (safe.length > 0) {
      summaryText += `✅ **On Track:**\n${safe.map(b => `* **${b.category}:** ${b.usedPct}% utilized (${sym}${b.remaining.toLocaleString()} left)`).join('\n')}\n\n`;
    }

    summaryText += `*Disclaimer: Informational assistant only, not a licensed financial advisor.*`;
    return summaryText;
  }

  // 8. What can I improve / advice / habits
  if (q.includes('improve') || q.includes('advice') || q.includes('recommend') || q.includes('better') || q.includes('tips')) {
    return `### 💡 SmartSpend Financial Optimization Recommendations

Based on your current transaction history:

1. **50/30/20 Alignment:** Your current savings rate is **${c.savingsRate}%**. If your savings rate is below 20%, target reducing discretionary categories (like Dining Out or Entertainment) by 10-15%.
2. **Review Top Category:** **${c.categories[0]?.category || 'Your largest expense'}** represents the bulk of your outflow. Negotiating recurring rates or setting a weekly budget cap can free up capital.
3. **Automate Goal Contributions:** Direct a portion of your monthly income into your savings goals right on payday before allocating discretionary spend.
4. **Budget Alerts:** Check the Budgets tab weekly to catch category exhaustion early before the month closes.

*Disclaimer: Informational assistant only, not a licensed financial advisor.*`;
  }

  // Generic fallback with live stats
  return `### 🤖 SmartSpend AI Assistant

Here is a quick snapshot of your live finances for **${c.currentMonth}**:

* **Total Income:** ${sym}${c.income.toLocaleString()}
* **Total Expenses:** ${sym}${c.expenses.toLocaleString()}
* **Savings:** ${sym}${c.savings.toLocaleString()} (${c.savingsRate}%)
* **Top Spending Category:** ${c.categories[0] ? `${c.categories[0].category} (${sym}${c.categories[0].amount.toLocaleString()})` : 'None yet'}

You can ask me specific questions like:
* *"How much did I spend on food?"*
* *"Where am I spending the most?"*
* *"What was my biggest expense?"*
* *"Compare my spending with last month."*
* *"Am I staying within my budget?"*
* *"What can I improve about my spending?"*

*Disclaimer: Informational assistant only, not a licensed financial advisor.*`;
}

// 1. Get recent chat messages
router.get('/messages', (req, res) => {
  try {
    const messages = db.prepare(`
      SELECT id, role, content, created_at
      FROM chat_messages
      WHERE user_id = ?
      ORDER BY id ASC
      LIMIT 50
    `).all(req.userId);

    return res.json({ messages });
  } catch (err) {
    console.error('Error fetching chat messages:', err);
    return res.status(500).json({ error: 'Failed to retrieve chat history.' });
  }
});

// 2. Clear chat messages
router.post('/clear', (req, res) => {
  try {
    db.prepare('DELETE FROM chat_messages WHERE user_id = ?').run(req.userId);
    return res.json({ message: 'Conversation history cleared.' });
  } catch (err) {
    console.error('Error clearing chat:', err);
    return res.status(500).json({ error: 'Failed to clear conversation.' });
  }
});

// 3. Send message & receive AI reply
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const trimmedMsg = message.trim();
    const user = req.user;
    const currency = user.currency || '₹';

    // Save user message to database
    db.prepare(`
      INSERT INTO chat_messages (user_id, role, content)
      VALUES (?, 'user', ?)
    `).run(req.userId, trimmedMsg);

    const context = getUserFinancialContext(req.userId, currency);

    let replyText = '';
    const apiKey = user.gemini_api_key || process.env.GEMINI_API_KEY;

    // If Gemini API Key is available, invoke gemini-3.8-flash
    if (apiKey) {
      try {
        const client = new GoogleGenAI({ apiKey });
        const systemInstruction = `You are SmartSpend AI ✨, a premium, intelligent personal financial assistant.
You have access to the authenticated user's actual financial records provided in the context below.
Provide accurate, empathetic, and actionable answers using their real numbers.
Strictly maintain user privacy.
Always format numbers with their currency symbol (${context.currency}) and commas.
At the end of your response, always include the note: "*Disclaimer: Informational assistant only, not a licensed financial advisor.*"

USER FINANCIAL CONTEXT:
${JSON.stringify(context, null, 2)}`;

        const response = await client.interactions.create({
          model: 'gemini-3.8-flash',
          input: `${systemInstruction}\n\nUSER QUESTION: ${trimmedMsg}`
        });

        if (response && response.output_text) {
          replyText = response.output_text;
        } else {
          replyText = generateLocalAIResponse(trimmedMsg, context);
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed or timed out, falling back to local financial intelligence engine:', geminiErr.message);
        replyText = generateLocalAIResponse(trimmedMsg, context);
      }
    } else {
      // Use our high-precision local financial intelligence engine
      replyText = generateLocalAIResponse(trimmedMsg, context);
    }

    // Save assistant reply
    db.prepare(`
      INSERT INTO chat_messages (user_id, role, content)
      VALUES (?, 'assistant', ?)
    `).run(req.userId, replyText);

    return res.json({
      reply: replyText
    });
  } catch (err) {
    console.error('Error handling AI chat:', err);
    return res.status(500).json({ error: 'Failed to generate assistant response.' });
  }
});

module.exports = router;
