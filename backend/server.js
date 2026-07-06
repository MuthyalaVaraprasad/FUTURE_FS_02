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

// Initialize database and start listening
async function startServer() {
  try {
    console.log('Initializing SQLite database...');
    await initDb();
    console.log('Database tables successfully initialized.');
    
    app.listen(PORT, () => {
      console.log(`==========================================================`);
      console.log(`  CRM Backend Server running on http://localhost:${PORT}`);
      console.log(`==========================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
