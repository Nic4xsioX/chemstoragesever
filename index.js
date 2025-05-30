//index.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const postRoutes = require('./server/routes');
const chemicalRoutes = require('./server/chemicalRoutes'); // 👈 เพิ่มไฟล์ routes สำหรับ chemicals ต่างหาก

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

const path = require('path');
app.use('/public',express.static(path.join(__dirname, 'public')));

// Connect database
const pool = new Pool({
  connectionString: 'postgres://neondb_owner:npg_wqxnvha1F0iY@ep-dark-credit-a1le8nq8-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

// Attach pool to app so routers can use it
app.set('db', pool);
app.get('/api/chemical-updates', async (req, res) => {
  const result = await pool.query('SELECT * FROM chemical_updates ORDER BY updated_at DESC');
  res.json(result.rows);
});
// Routes
app.use('/api', postRoutes);      // 👉 API สำหรับ posts
app.use('/api/chemicals', chemicalRoutes); // 👉 API สำหรับ chemicals

app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});
