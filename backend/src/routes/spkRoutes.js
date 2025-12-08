const express = require('express');
const router = express.Router();
const SPKController = require('../controllers/spkController');

// Import pantai routes untuk CRUD
const pantaiRoutes = require('./pantaiRoutes');

// GET semua kriteria
router.get('/kriteria', SPKController.getKriteria);

// GET semua pantai dengan skor
router.get('/pantai', SPKController.getPantai);

// POST hitung ranking
router.post('/hitung', SPKController.hitungRanking);

// Route untuk CRUD Pantai (pakai prefix dari pantaiRoutes)
router.use('/', pantaiRoutes);

module.exports = router;