//server/routes.js
const express = require('express');
const router = express.Router();

// Middleware ดึง db จาก app
function getDB(req) {
  return req.app.get('db');
}

// ------------------- Storage Routes -------------------

// GET - ดึงข้อมูล Storage ทั้งหมด
router.get('/storage', async (req, res) => {
  try {
    const pool = getDB(req);
    const result = await pool.query('SELECT * FROM Storage ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching Storage:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST - เพิ่มข้อมูล Storage
router.post('/storage', async (req, res) => {
  const { Name, formula, Type, Picture, Warning, Elucidation, LocateName } = req.body;

  if (!Name || !formula || !Type || !Warning || !Elucidation || !LocateName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const pool = getDB(req);
    const result = await pool.query(
      `INSERT INTO Storage (Name, formula, Type, Picture, Warning, Elucidation, LocateName)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [Name, formula, Type, Picture, Warning, Elucidation, LocateName]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error inserting Storage:', err);
    res.status(500).json({ error: 'Database insert error' });
  }
});

// ------------------- Barcode Routes -------------------

// GET - ดึงข้อมูล Barcode ทั้งหมด
router.get('/barcode', async (req, res) => {
  try {
    const pool = getDB(req);
    const result = await pool.query('SELECT * FROM Barcode ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// POST - เพิ่มข้อมูล Barcode
router.post('/barcode', async (req, res) => {
  const { Name, Barcode, Location, ImportDate, ExpiredDate } = req.body;

  if (!Name || !Barcode || !Location || !ImportDate || !ExpiredDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const pool = getDB(req);
    const result = await pool.query(
      `INSERT INTO Barcode (Name, Barcode, Location, ImportDate, ExpiredDate)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [Name, Barcode, Location, ImportDate, ExpiredDate]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error inserting Barcode:', err);
    res.status(500).json({ error: 'Database insert error' });
  }
});

// ------------------- Log Routes -------------------

// GET - ดึงข้อมูล Log ทั้งหมด
router.get('/log', async (req, res) => {
  try {
    const pool = getDB(req);
    const result = await pool.query('SELECT * FROM Log ORDER BY Time DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// POST - เพิ่มข้อมูล Log
router.post('/log', async (req, res) => {
  const { Name, Barcode, Action } = req.body;

  if (!Name || !Barcode || !Action) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const pool = getDB(req);
    const Time = new Date();
    const result = await pool.query(
      `INSERT INTO Log (Name, Barcode, Action, Time)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [Name, Barcode, Action, Time]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error inserting Log:', err);
    res.status(500).json({ error: 'Database insert error' });
  }
});

module.exports = router;
