const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database');
const { validateRental } = require('../utils/validation');

// Keep /details before /:id so it is not treated as an ID.
router.get('/details', async (req, res) => {
  try {
    const database = await getDatabase();
    const rentals = await database.all(`
      SELECT
        rentals.id,
        riders.name AS rider_name,
        bikes.name AS bike_name,
        bikes.type AS bike_type,
        rentals.rental_date,
        rentals.return_date
      FROM rentals
      INNER JOIN riders ON rentals.rider_id = riders.id
      INNER JOIN bikes ON rentals.bike_id = bikes.id
      ORDER BY rentals.id
    `);
    return res.status(200).json({ rentals });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve rental details' });
  }
});

router.get('/', async (req, res) => {
  try {
    const database = await getDatabase();
    const rentals = await database.all(
      'SELECT id, rider_id, bike_id, rental_date, return_date FROM rentals ORDER BY id'
    );
    return res.status(200).json({ rentals });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve rentals' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const database = await getDatabase();
    const rental = await database.get(
      'SELECT id, rider_id, bike_id, rental_date, return_date FROM rentals WHERE id = ?',
      [req.params.id]
    );
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }
    return res.status(200).json({ rental });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve rental' });
  }
});

router.post('/', async (req, res) => {
  const errors = validateRental(req.body);
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  try {
    const database = await getDatabase();
    const rider = await database.get(
      'SELECT id FROM riders WHERE id = ?',
      [req.body.rider_id]
    );
    if (!rider) {
      return res.status(404).json({ error: 'Rider not found' });
    }

    const bike = await database.get(
      'SELECT id FROM bikes WHERE id = ?',
      [req.body.bike_id]
    );
    if (!bike) {
      return res.status(404).json({ error: 'Bike not found' });
    }

    const result = await database.run(
      'INSERT INTO rentals (rider_id, bike_id) VALUES (?, ?)',
      [req.body.rider_id, req.body.bike_id]
    );
    const rental = await database.get(
      'SELECT id, rider_id, bike_id, rental_date, return_date FROM rentals WHERE id = ?',
      [result.lastID]
    );
    return res.status(201).json({ message: 'Rental created successfully', rental });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create rental' });
  }
});

// POST /rentals/:id/return - record a bike return.
router.post('/:id/return', async (req, res) => {
  try {
    const database = await getDatabase();
    const rental = await database.get(
      'SELECT id, return_date FROM rentals WHERE id = ?',
      [req.params.id]
    );

    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }
    if (rental.return_date) {
      return res.status(409).json({ error: 'Rental has already been returned' });
    }

    await database.run(
      'UPDATE rentals SET return_date = CURRENT_TIMESTAMP WHERE id = ?',
      [req.params.id]
    );
    const updatedRental = await database.get(
      'SELECT id, rider_id, bike_id, rental_date, return_date FROM rentals WHERE id = ?',
      [req.params.id]
    );
    return res.status(200).json({
      message: 'Bike returned successfully',
      rental: updatedRental
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to return bike' });
  }
});

module.exports = router;