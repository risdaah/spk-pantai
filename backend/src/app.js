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
const helperRoutes = require('./routes/helperRoutes');
const pantaiRoutes = require('./routes/pantaiRoutes');
const detailPantaiRoutes = require('./routes/detailPantaiRoutes');
app.use('/api/spk', spkRoutes);
app.use('/api/spk/data', helperRoutes);
app.use('/api/spk/pantai', pantaiRoutes);
app.use('/api/spk/detail-pantai', detailPantaiRoutes);

module.exports = app;