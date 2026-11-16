const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Helper for linear regression slope & intercept
function calculateLinearRegression(values) {
  const n = values.length;
  if (n < 2) {
    return { slope: 0, intercept: values[0] || 0, r2: 0 };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

// Predict future spending
router.get('/', (req, res) => {
  try {
    const user = req.user;
    const currency = user.currency || '₹';

    // Get all distinct months in chronological order
    const monthlyTotals = db.prepare(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(amount) as totalExpense
      FROM transactions
      WHERE user_id = ? AND type = 'expense'
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month ASC
    `).all(req.userId);

    // Get historical data per category per month
    const categoryHistory = db.prepare(`
      SELECT 
        category,
        strftime('%Y-%m', date) as month,
        SUM(amount) as amount
      FROM transactions
      WHERE user_id = ? AND type = 'expense'
      GROUP BY category, strftime('%Y-%m', date)
      ORDER BY month ASC
    `).all(req.userId);

    const distinctMonths = [...new Set(monthlyTotals.map(m => m.month))];

    // If less than 1 month of data, provide fallback/guidance
    if (distinctMonths.length === 0) {
      return res.json({
        hasEnoughData: false,
        message: 'No expense history recorded yet. Add transactions or load demo data to view predictive analytics.',
        nextMonth: 'Next Month',
        predictions: [],
        overallPrediction: { estimated: 0, low: 0, high: 0, trend: 'stable' }
      });
    }

    // Determine next month string
    const latestMonth = distinctMonths[distinctMonths.length - 1];
    const [yearStr, monthStr] = latestMonth.split('-');
    let nextYear = parseInt(yearStr);
    let nextMonthNum = parseInt(monthStr) + 1;
    if (nextMonthNum > 12) {
      nextMonthNum = 1;
      nextYear += 1;
    }
    const nextMonthFormatted = `${nextYear}-${String(nextMonthNum).padStart(2, '0')}`;

    // Category map
    const catMap = {};
    categoryHistory.forEach(item => {
      if (!catMap[item.category]) {
        catMap[item.category] = {};
      }
      catMap[item.category][item.month] = item.amount;
    });

    const categoryPredictions = [];
    let totalPredictedExpense = 0;
    let totalLow = 0;
    let totalHigh = 0;

    Object.keys(catMap).forEach(category => {
      const monthAmounts = distinctMonths.map(m => catMap[category][m] || 0);
      const nonZeroAmounts = monthAmounts.filter(a => a > 0);
      
      if (nonZeroAmounts.length === 0) return;

      const lastAmount = monthAmounts[monthAmounts.length - 1] || 0;
      const avgAmount = nonZeroAmounts.reduce((a, b) => a + b, 0) / nonZeroAmounts.length;

      let estimated = avgAmount;
      let trendDirection = 'stable';
      let trendPct = 0;

      if (monthAmounts.length >= 2) {
        const { slope, intercept } = calculateLinearRegression(monthAmounts);
        const nextIndex = monthAmounts.length;
        const regressed = intercept + slope * nextIndex;
        // Blend weighted average (70% regression, 30% recent average)
        estimated = Math.max(0, Math.round(regressed * 0.7 + avgAmount * 0.3));
        
        if (lastAmount > 0) {
          trendPct = Math.round(((estimated - lastAmount) / lastAmount) * 100);
          if (trendPct > 5) trendDirection = 'upward';
          else if (trendPct < -5) trendDirection = 'downward';
        }
      } else {
        estimated = Math.round(avgAmount);
      }

      // Variance margin (10% to 15%)
      const margin = Math.round(estimated * 0.12);
      const low = Math.max(0, estimated - margin);
      const high = estimated + margin;

      totalPredictedExpense += estimated;
      totalLow += low;
      totalHigh += high;

      categoryPredictions.push({
        category,
        historicalMonthly: distinctMonths.map(m => ({
          month: m,
          amount: catMap[category][m] || 0
        })),
        lastMonthAmount: lastAmount,
        predictedAmount: estimated,
        lowerBound: low,
        upperBound: high,
        trend: trendDirection,
        trendPct,
        confidence: distinctMonths.length >= 3 ? 'High' : (distinctMonths.length === 2 ? 'Medium' : 'Initial Estimate'),
        note: `Based on ${distinctMonths.length} month(s) of spending history`
      });
    });

    // Sort by predicted amount descending
    categoryPredictions.sort((a, b) => b.predictedAmount - a.predictedAmount);

    // Overall trend comparison
    const lastMonthTotal = monthlyTotals[monthlyTotals.length - 1]?.totalExpense || 0;
    const overallTrendPct = lastMonthTotal > 0 
      ? Math.round(((totalPredictedExpense - lastMonthTotal) / lastMonthTotal) * 100) 
      : 0;

    let overallTrend = 'stable';
    if (overallTrendPct > 5) overallTrend = 'upward';
    else if (overallTrendPct < -5) overallTrend = 'downward';

    return res.json({
      hasEnoughData: true,
      monthsAnalyzed: distinctMonths.length,
      nextMonth: nextMonthFormatted,
      currentMonth: latestMonth,
      currency,
      overallPrediction: {
        estimated: totalPredictedExpense,
        lowerBound: totalLow,
        upperBound: totalHigh,
        lastMonthActual: lastMonthTotal,
        trend: overallTrend,
        trendPct: overallTrendPct
      },
      categoryPredictions,
      disclaimer: 'Predictions are mathematical estimates calculated using time-series regression and weighted moving averages of your historical spending. Unforeseen one-time expenses or lifestyle changes may affect actual outcomes.'
    });
  } catch (err) {
    console.error('Error generating predictions:', err);
    return res.status(500).json({ error: 'Failed to calculate predictions.' });
  }
});

module.exports = router;
