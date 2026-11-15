const express = require('express');
const { initializeDatabase } = require('./src/database');

const ridersRouter = require('./src/routes/riders');
const bikesRouter = require('./src/routes/bikes');
const rentalsRouter = require('./src/routes/rentals');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to SpinCycle Bikes API',
    endpoints: {
      riders: '/riders',
      bikes: '/bikes',
      rentals: '/rentals',
      rentalDetails: '/rentals/details'
    }
  });
});

app.use('/riders', ridersRouter);
app.use('/bikes', bikesRouter);
app.use('/rentals', rentalsRouter);

// Handle invalid JSON bodies.
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  return next(err);
});

// Handle unknown routes.
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`SpinCycle Bikes API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;