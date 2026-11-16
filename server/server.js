const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const authRoutes = require('./routes/auth');
const transactionsRoutes = require('./routes/transactions');
const budgetsRoutes = require('./routes/budgets');
const goalsRoutes = require('./routes/goals');
const analyticsRoutes = require('./routes/analytics');
const insightsRoutes = require('./routes/insights');
const predictionsRoutes = require('./routes/predictions');
const aiRoutes = require('./routes/ai');
const reportsRoutes = require('./routes/reports');
const seedRoutes = require('./routes/seed');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/seed', seedRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    product: 'SmartSpend Personal Finance & Spending Analytics',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend in production if client/dist exists
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'An unexpected internal server error occurred.' });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 SmartSpend Backend API running on http://localhost:${PORT}`);
  console.log(`📡 Ready for personal finance management & AI queries`);
  console.log(`======================================================\n`);
});
