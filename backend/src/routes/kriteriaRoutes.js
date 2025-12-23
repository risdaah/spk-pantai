// routes/kriteriaRoutes.js

const express = require('express');
const router = express.Router();
const kriteriaController = require('../controllers/kriteriaController');

// GET all kriteria dengan sub-kriteria
router.get('/kriteria-semua', kriteriaController.getKriteriaWithSub);

// GET kriteria by ID
router.get('/:id', kriteriaController.getKriteriaById);

// POST create kriteria
router.post('/', kriteriaController.createKriteria);

// PUT update kriteria
router.put('/:id', kriteriaController.updateKriteria);

// DELETE kriteria
router.delete('/:id', kriteriaController.deleteKriteria);

module.exports = router;
