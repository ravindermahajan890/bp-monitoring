const { Router } = require('express');
const pool = require('./db');

const router = Router();

// Create a new reading
router.post('/', async (req, res) => {
  try {
    const { recorded_at, systolic, diastolic, pulse, notes } = req.body;

    if (!recorded_at || !systolic || !diastolic) {
      return res.status(400).json({ error: 'recorded_at, systolic, and diastolic are required' });
    }

    const result = await pool.query(
      `INSERT INTO bp_readings (recorded_at, systolic, diastolic, pulse, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [recorded_at, systolic, diastolic, pulse || null, notes || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save reading' });
  }
});

// Get all readings (newest first)
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM bp_readings ORDER BY recorded_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch readings' });
  }
});

// Delete a reading
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM bp_readings WHERE id = $1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete reading' });
  }
});

module.exports = router;

