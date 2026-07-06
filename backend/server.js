const express = require('express');
const cors = require('cors');
const { initDb } = require('./database');

const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for dev simplicity (frontend Vite starts on 5173)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'Future Interns Client Lead Management System (Mini CRM) API is live!' });
});

// Register routers
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

// Auto-initialize SQLite database schema inside serverless functions
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await initDb();
      dbInitialized = true;
    } catch (error) {
      console.error('Failed to initialize database on request:', error);
    }
  }
  next();
});

// Initialize database and start listening for local development
async function startServer() {
  try {
    if (!process.env.VERCEL) {
      console.log('Initializing SQLite database locally...');
      await initDb();
      dbInitialized = true;
      app.listen(PORT, () => {
        console.log(`==========================================================`);
        console.log(`  CRM Backend Server running on http://localhost:${PORT}`);
        console.log(`==========================================================`);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
