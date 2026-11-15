const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database');
const { validateRider } = require('../utils/validation');

router.get('/', async (req, res) => {
  try {
    const database = await getDatabase();
    const riders = await database.all(
      'SELECT id, name, email, created_at FROM riders ORDER BY id'
    );
    return res.status(200).json({ riders });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve riders' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const database = await getDatabase();
    const rider = await database.get(
      'SELECT id, name, email, created_at FROM riders WHERE id = ?',
      [req.params.id]
    );
    if (!rider) {
      return res.status(404).json({ error: 'Rider not found' });
    }
    return res.status(200).json({ rider });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve rider' });
  }
});

router.post('/', async (req, res) => {
  const errors = validateRider(req.body);
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  try {
    const database = await getDatabase();
    const result = await database.run(
      'INSERT INTO riders (name, email) VALUES (?, ?)',
      [req.body.name.trim(), req.body.email.trim().toLowerCase()]
    );
    const rider = await database.get(
      'SELECT id, name, email, created_at FROM riders WHERE id = ?',
      [result.lastID]
    );
    return res.status(201).json({ message: 'Rider added successfully', rider });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT' || error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'A rider with this email already exists' });
    }
    return res.status(500).json({ error: 'Failed to add rider' });
  }
});

module.exports = router;