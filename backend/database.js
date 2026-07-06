const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Utility wrappers to return Promises instead of callbacks
const query = {
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
};

// Initialize database schemas
async function initDb() {
  // 1. Leads Table
  await query.run(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      company TEXT,
      source TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      value REAL DEFAULT 0,
      probability INTEGER DEFAULT 20,
      tags TEXT,
      followup_date TEXT,
      bant_budget INTEGER DEFAULT 0,
      bant_authority INTEGER DEFAULT 0,
      bant_need INTEGER DEFAULT 0,
      bant_timeline INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Dynamically add BANT columns if table already exists
  try { await query.run("ALTER TABLE leads ADD COLUMN bant_budget INTEGER DEFAULT 0"); } catch(e){}
  try { await query.run("ALTER TABLE leads ADD COLUMN bant_authority INTEGER DEFAULT 0"); } catch(e){}
  try { await query.run("ALTER TABLE leads ADD COLUMN bant_need INTEGER DEFAULT 0"); } catch(e){}
  try { await query.run("ALTER TABLE leads ADD COLUMN bant_timeline INTEGER DEFAULT 0"); } catch(e){}

  // 2. Notes Table
  await query.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE CASCADE
    )
  `);

  // 3. Activity Log Table
  await query.run(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE CASCADE
    )
  `);

  // 4. Users Table (Admin accounts)
  await query.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin'
    )
  `);

  // Seed default admin account
  const defaultAdmin = 'admin';
  const defaultPass = 'admin123';
  const existingUser = await query.get('SELECT * FROM users WHERE username = ?', [defaultAdmin]);
  
  if (!existingUser) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPass, salt);
    await query.run(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [defaultAdmin, hashedPassword, 'admin']
    );
    console.log(`Default admin seeded. Username: ${defaultAdmin}, Password: ${defaultPass}`);
  }
}

module.exports = {
  db,
  query,
  initDb
};
