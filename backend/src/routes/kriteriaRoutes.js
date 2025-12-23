const express = require('express');
const router = express.Router();
const kriteriaController = require('../controllers/kriteriaController');

// GET /api/spk/kriteria
router.get('/kriteria-semua', kriteriaController.getKriteriaWithSub);

module.exports = router;
