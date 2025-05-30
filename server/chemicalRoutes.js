//server/chemicalRoutes.js
const express = require('express');
const router = express.Router();

// Middleware ดึง db จาก app
function getDB(req) {
  return req.app.get('db');
}

// POST: เพิ่มสารเคมีใหม่
router.post('/', async (req, res) => {
  const { name, formula, type, amount, image } = req.body;
  try {
    const pool = getDB(req);
    const result = await pool.query(
      `INSERT INTO chemicals(name, formula, type, amount, image)
       VALUES($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, formula, type, amount, image]
    );

    // 🔸 บันทึกประวัติ
    await pool.query(
      `INSERT INTO chemical_updates (chemical_id, chemical_name, action, amount)
       VALUES ($1, $2, $3, $4)`,
      [result.rows[0].id, name, 'เพิ่มใหม่', amount]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error inserting chemical:', err);
    res.status(500).json({ error: 'Database insert error' });
  }
});

// PATCH: อัปเดต amount ของ chemical
router.patch('/:id', async (req, res) => {
  const pool = req.app.get('db');
  const { id } = req.params;
  const { delta } = req.body;

  if (typeof delta !== 'number') {
    return res.status(400).json({ error: 'Delta must be a valid number' });
  }

  try {
    // 🔸 ดึงข้อมูลชื่อสารเคมีก่อน
    const chemResult = await pool.query('SELECT * FROM chemicals WHERE id = $1', [id]);
    if (chemResult.rowCount === 0) {
      return res.status(404).json({ error: 'Chemical not found' });
    }
    const chemical = chemResult.rows[0];

    const result = await pool.query(
      'UPDATE chemicals SET amount = amount + $1 WHERE id = $2 RETURNING *',
      [delta, id]
    );

    // 🔸 บันทึกประวัติ
    await pool.query(
      `INSERT INTO chemical_updates (chemical_id, chemical_name, action, amount)
       VALUES ($1, $2, $3, $4)`,
      [id, chemical.name, delta > 0 ? 'เพิ่มจำนวน' : 'ลดจำนวน', Math.abs(delta)]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating chemical:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE: ลบ chemical
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const pool = getDB(req);

    // 🔸 ดึงข้อมูลก่อนลบ เพื่อใช้ชื่อและจำนวน
    const chem = await pool.query('SELECT * FROM chemicals WHERE id = $1', [id]);
    if (chem.rowCount === 0) {
      return res.status(404).json({ error: 'Chemical not found' });
    }

    const chemical = chem.rows[0];

    const result = await pool.query(
      `DELETE FROM chemicals WHERE id = $1 RETURNING *`,
      [id]
    );

    // 🔸 บันทึกประวัติ
    await pool.query(
      `INSERT INTO chemical_updates (chemical_id, chemical_name, action, amount)
       VALUES ($1, $2, $3, $4)`,
      [id, chemical.name, 'ลบ', chemical.amount]
    );

    res.json({ message: 'Chemical deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting chemical:', err);
    res.status(500).json({ error: 'Database delete error' });
  }
});

module.exports = router;
