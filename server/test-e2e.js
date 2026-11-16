const http = require('http');

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting SmartSpend E2E Integration Test Suite');
  console.log('====================================================\n');

  // Test 1: Health check
  console.log('1. Testing Health Check...');
  const health = await request('GET', '/api/health');
  if (health.status !== 200) throw new Error('Health check failed');
  console.log('   ✅ Health check passed:', health.data.status);

  // Test 2: Register User A
  console.log('\n2. Testing Registration with Email & OTP generation...');
  const userAEmail = `tester_${Date.now()}@smartspend.io`;
  const regRes = await request('POST', '/api/auth/register', {
    name: 'Pratik Sharma',
    email: userAEmail,
    password: 'Password123!'
  });
  if (regRes.status !== 201) throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
  const db = require('./db');
  const otpRow = db.prepare('SELECT otp FROM otps WHERE email = ? ORDER BY id DESC LIMIT 1').get(userAEmail);
  const otpCode = otpRow ? otpRow.otp : null;
  console.log(`   ✅ Registration successful! Realtime OTP generated in DB: ${otpCode}`);

  // Test 3: Verify Email with OTP
  console.log('\n3. Testing OTP Verification...');
  const verifyRes = await request('POST', '/api/auth/verify-email', {
    email: userAEmail,
    otp: otpCode
  });
  if (verifyRes.status !== 200 || !verifyRes.data.token) {
    throw new Error(`Email verification failed: ${JSON.stringify(verifyRes.data)}`);
  }
  const tokenA = verifyRes.data.token;
  console.log('   ✅ Email verified! JWT token issued.');

  // Test 4: Seed Demo Data
  console.log('\n4. Testing 1-Click Realistic Fintech Demo Seeder...');
  const seedRes = await request('POST', '/api/seed/demo-data', {}, tokenA);
  if (seedRes.status !== 200) throw new Error('Seeder failed');
  console.log(`   ✅ Demo data loaded! Inserted ${seedRes.data.recordsInserted.transactions} transactions, ${seedRes.data.recordsInserted.budgets} budgets, ${seedRes.data.recordsInserted.goals} goals.`);

  // Test 5: Dashboard Analytics & Health Score
  console.log('\n5. Testing Dashboard Financial Health Score & KPIs...');
  const dashRes = await request('GET', '/api/analytics/dashboard', null, tokenA);
  if (dashRes.status !== 200) throw new Error('Dashboard analytics failed');
  const d = dashRes.data;
  console.log(`   ✅ Dashboard KPIs: Inflow: ₹${d.summary.income.toLocaleString()} | Outflow: ₹${d.summary.expenses.toLocaleString()} | Savings: ₹${d.summary.savings.toLocaleString()} (${d.summary.savingsRate}%)`);
  console.log(`   ✅ Financial Health: ${d.health.score}/100 [${d.health.grade}] (Savings: ${d.health.components.savingsScore}/30, Budget: ${d.health.components.budgetScore}/30, Concentration: ${d.health.components.concentrationScore}/20)`);

  // Test 6: AI Insights Generation
  console.log('\n6. Testing AI Financial Insights Engine...');
  const insRes = await request('GET', '/api/insights', null, tokenA);
  if (insRes.status !== 200) throw new Error('Insights failed');
  console.log(`   ✅ Generated ${insRes.data.insights.length} data-driven insights:`);
  insRes.data.insights.slice(0, 3).forEach(i => {
    console.log(`      * [${i.severity.toUpperCase()}] ${i.title}: ${i.metric || ''}`);
  });

  // Test 7: Future Expense Predictions
  console.log('\n7. Testing Future Expense ML Predictions...');
  const predRes = await request('GET', '/api/predictions', null, tokenA);
  if (predRes.status !== 200) throw new Error('Predictions failed');
  const p = predRes.data;
  console.log(`   ✅ Prediction for ${p.nextMonth}: ₹${p.overallPrediction.estimated.toLocaleString()} (${p.overallPrediction.trend.toUpperCase()} trajectory: ${p.overallPrediction.trendPct}%)`);
  console.log(`   ✅ Confidence interval: ₹${p.overallPrediction.lowerBound.toLocaleString()} - ₹${p.overallPrediction.upperBound.toLocaleString()}`);

  // Test 8: SmartSpend AI Chatbot Queries
  console.log('\n8. Testing SmartSpend AI ✨ Assistant Conversational Engine...');
  const testPrompts = [
    "How much did I spend this month?",
    "How much did I spend on food?",
    "Where am I spending the most?",
    "What was my biggest expense?",
    "How much have I saved?",
    "Compare my spending with last month",
    "Am I staying within my budget?",
    "What can I improve about my spending?"
  ];

  for (const prompt of testPrompts) {
    const aiRes = await request('POST', '/api/ai/chat', { message: prompt }, tokenA);
    if (aiRes.status !== 200 || !aiRes.data.reply) {
      throw new Error(`AI Chat failed on prompt: "${prompt}"`);
    }
    const firstLine = aiRes.data.reply.split('\n')[0];
    console.log(`   ✅ Prompt: "${prompt}" -> ${firstLine.substring(0, 60)}...`);
  }

  // Test 9: Reports & CSV Export
  console.log('\n9. Testing Financial Statements & CSV Export...');
  const repRes = await request('GET', '/api/reports/summary', null, tokenA);
  if (repRes.status !== 200) throw new Error('Report summary failed');
  console.log(`   ✅ Report generated for ${repRes.data.filter.month}: ${repRes.data.transactions.length} itemized records, Gross Income: ₹${repRes.data.summary.totalIncome.toLocaleString()}`);

  const csvRes = await request('GET', '/api/reports/export/csv', null, tokenA);
  if (csvRes.status !== 200 || !csvRes.raw.includes('Description,Amount')) {
    throw new Error('CSV export failed');
  }
  console.log('   ✅ CSV export returned valid comma-separated spreadsheet data.');

  // Test 10: Strict User Isolation Verification
  console.log('\n10. Testing Strict Multi-User Privacy & Isolation...');
  const userBEmail = `user_b_${Date.now()}@smartspend.io`;
  const regB = await request('POST', '/api/auth/register', { name: 'User B', email: userBEmail, password: 'Password456!' });
  const otpBRow = db.prepare('SELECT otp FROM otps WHERE email = ? ORDER BY id DESC LIMIT 1').get(userBEmail);
  const verifyB = await request('POST', '/api/auth/verify-email', { email: userBEmail, otp: otpBRow.otp });
  const tokenB = verifyB.data.token;

  // Query User B's transactions - must be empty 0 records!
  const txB = await request('GET', '/api/transactions', null, tokenB);
  if (txB.data.total !== 0 || txB.data.transactions.length !== 0) {
    throw new Error('SECURITY VIOLATION: User B can see existing records!');
  }

  // Query User B's dashboard - must be 0
  const dashB = await request('GET', '/api/analytics/dashboard', null, tokenB);
  if (dashB.data.summary.income !== 0 || dashB.data.summary.expenses !== 0) {
    throw new Error('SECURITY VIOLATION: User B can see User A financial data!');
  }
  console.log('   ✅ STRICT SECURITY VERIFIED: User B has 0 records and cannot access User A data.');

  console.log('\n====================================================');
  console.log('🎉 ALL 10 TEST SUITES PASSED FLAWLESSLY!');
  console.log('====================================================\n');
}

module.exports = runTests;

if (require.main === module) {
  runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
}
