const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const dbPath = path.join(__dirname, '..', 'spincycle.db');
let db;

async function getDatabase() {
  if (!db) {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    await db.exec('PRAGMA foreign_keys = ON;');
  }
  return db;
}

async function initializeDatabase() {
  const database = await getDatabase();

  await database.exec(`
    CREATE TABLE IF NOT EXISTS riders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bikes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rentals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rider_id INTEGER NOT NULL,
      bike_id INTEGER NOT NULL,
      rental_date TEXT DEFAULT CURRENT_TIMESTAMP,
      return_date TEXT,
      FOREIGN KEY (rider_id) REFERENCES riders(id) ON DELETE RESTRICT,
      FOREIGN KEY (bike_id) REFERENCES bikes(id) ON DELETE RESTRICT
    );
  `);

  return database;
}

module.exports = { getDatabase, initializeDatabase };