//server/routes.js
const express = require('express');
const router = express.Router();

// Middleware ดึง db จาก app
function getDB(req) {
  return req.app.get('db');
}

// GET - Read All Posts
router.get('/posts', async (req, res) => {
  try {
    const pool = getDB(req);
    const result = await pool.query('SELECT * FROM posts ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - Create or Update Post with Accumulated Amount
router.post('/posts', async (req, res) => {
  const { id, title, content, amount } = req.body;
  const validAmount = Number(amount);
  if (!id || !title || !content || isNaN(validAmount)) {
    return res.status(400).json({ error: 'Invalid or missing data' });
  }

  try {
    const pool = getDB(req);
    const existing = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);

    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        `UPDATE posts
         SET amount = amount + $1,
             title = $2,
             content = $3,
             update_time = NOW()
         WHERE id = $4
         RETURNING *`,
        [validAmount, title, content, id]
      );
    } else {
      result = await pool.query(
        `INSERT INTO posts (id, title, content, amount, update_time)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        [id, title, content, validAmount]
      );
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ DB error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT - Update Post Amount
router.put('/posts/:id/amount', async (req, res) => {
  const { id } = req.params;
  const { delta } = req.body;

  if (typeof delta !== 'number') {
    return res.status(400).json({ error: 'Missing or invalid delta (must be a number)' });
  }

  try {
    const pool = getDB(req);
    const result = await pool.query(
      `UPDATE posts SET amount = amount + $1, update_time = NOW() WHERE id = $2 RETURNING *;`,
      [delta, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ message: 'Amount updated successfully', post: result.rows[0] });
  } catch (err) {
    console.error('❌ Error updating amount:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE - Delete Post
router.delete('/posts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = getDB(req);
    const result = await pool.query('DELETE FROM posts WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting post:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


// GET: ดึงข้อมูล chemical รายตัว
router.get('/chemicals/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const pool = getDB(req);
    const result = await pool.query(
      `SELECT * FROM chemicals WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chemical not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error fetching chemical by ID:', err);
    res.status(500).json({ error: 'Database fetch error' });
  }
});

// GET: ดึงรายการ chemical ทั้งหมด
router.get('/chemicals', async (req, res) => {
  try {
    const pool = getDB(req);
    const result = await pool.query('SELECT * FROM chemicals ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/api/barcode', async (req, res) => {
  const { barcode_value } = req.body;

  if (!barcode_value) {
    return res.status(400).json({ error: 'barcode_value is required' });
  }

  try {
    // 1. ค้นหา chemical_id จาก barcode
    const result = await pool.query('SELECT id FROM chemicals WHERE barcode = $1', [barcode_value]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chemical not found for given barcode' });
    }

    const chemical_id = result.rows[0].id;

    // 2. บันทึกการสแกนลงตาราง barcode
    await pool.query(
      'INSERT INTO barcode (chemical_id, barcode_value, scan_time) VALUES ($1, $2, NOW())',
      [chemical_id, barcode_value]
    );

    // 3. เพิ่ม amount ในตาราง chemicals
    await pool.query('UPDATE chemicals SET amount = amount + 1 WHERE id = $1', [chemical_id]);

    res.status(200).json({ message: 'Barcode scanned and chemical amount updated' });
  } catch (err) {
    console.error('Error handling barcode scan:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// POST - Add scanned barcode
router.post('/barcodes', async (req, res) => {
  const { chemical_id, barcode_value } = req.body;

  if (!chemical_id || !barcode_value) {
    return res.status(400).json({ error: 'Missing chemical_id or barcode_value' });
  }

  try {
    const pool = getDB(req);
    const result = await pool.query(
      `INSERT INTO barcode (chemical_id, barcode_value, scan_time)
       VALUES ($1, $2, NOW())
       RETURNING *`,
      [chemical_id, barcode_value]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error inserting barcode:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
