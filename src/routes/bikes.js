const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database');
const { validateBike } = require('../utils/validation');

// GET /bikes - list all bikes; optional smart search with ?q=word.
router.get('/', async (req, res) => {
  try {
    const database = await getDatabase();
    const searchTerm = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    if (searchTerm) {
      const pattern = `%${searchTerm}%`;
      const bikes = await database.all(
        `SELECT id, name, type, created_at
         FROM bikes
         WHERE LOWER(name) LIKE LOWER(?) OR LOWER(type) LIKE LOWER(?)
         ORDER BY id`,
        [pattern, pattern]
      );

      if (bikes.length === 0) {
        return res.status(200).json({
          message: 'Nothing found',
          bikes: []
        });
      }
      return res.status(200).json({ bikes });
    }

    const bikes = await database.all(
      'SELECT id, name, type, created_at FROM bikes ORDER BY id'
    );
    return res.status(200).json({ bikes });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve bikes' });
  }
});

// GET /bikes/:id - get one bike.
router.get('/:id', async (req, res) => {
  try {
    const database = await getDatabase();
    const bike = await database.get(
      'SELECT id, name, type, created_at FROM bikes WHERE id = ?',
      [req.params.id]
    );
    if (!bike) {
      return res.status(404).json({ error: 'Bike not found' });
    }
    return res.status(200).json({ bike });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve bike' });
  }
});

// POST /bikes - add a bike.
router.post('/', async (req, res) => {
  const errors = validateBike(req.body);
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  try {
    const database = await getDatabase();
    const result = await database.run(
      'INSERT INTO bikes (name, type) VALUES (?, ?)',
      [req.body.name.trim(), req.body.type.trim()]
    );
    const bike = await database.get(
      'SELECT id, name, type, created_at FROM bikes WHERE id = ?',
      [result.lastID]
    );
    return res.status(201).json({ message: 'Bike added successfully', bike });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add bike' });
  }
});

// PUT /bikes/:id - update a bike.
router.put('/:id', async (req, res) => {
  const errors = validateBike(req.body);
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  try {
    const database = await getDatabase();
    const existingBike = await database.get(
      'SELECT id FROM bikes WHERE id = ?',
      [req.params.id]
    );
    if (!existingBike) {
      return res.status(404).json({ error: 'Bike not found' });
    }

    await database.run(
      'UPDATE bikes SET name = ?, type = ? WHERE id = ?',
      [req.body.name.trim(), req.body.type.trim(), req.params.id]
    );
    const bike = await database.get(
      'SELECT id, name, type, created_at FROM bikes WHERE id = ?',
      [req.params.id]
    );
    return res.status(200).json({ message: 'Bike updated successfully', bike });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update bike' });
  }
});

// DELETE /bikes/:id - delete a bike if it has no rental records.
router.delete('/:id', async (req, res) => {
  try {
    const database = await getDatabase();
    const existingBike = await database.get(
      'SELECT id FROM bikes WHERE id = ?',
      [req.params.id]
    );
    if (!existingBike) {
      return res.status(404).json({ error: 'Bike not found' });
    }

    try {
      await database.run('DELETE FROM bikes WHERE id = ?', [req.params.id]);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({
          error: 'Bike cannot be deleted because rental records exist'
        });
      }
      throw error;
    }

    return res.status(200).json({ message: 'Bike deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete bike' });
  }
});

module.exports = router;