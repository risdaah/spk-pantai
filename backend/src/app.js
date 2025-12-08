const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'API SPK Destinasi Pantai',
    endpoints: {
      kriteria: 'GET /api/spk/kriteria',
      pantai: 'GET /api/spk/pantai',
      hitung: 'POST /api/spk/hitung'
    }
  });
});

// Import routes
const spkRoutes = require('./routes/spkRoutes');
app.use('/api/spk', spkRoutes);

module.exports = app;