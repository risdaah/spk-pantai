// routes/detailPantaiRoutes.js
const express = require('express');
const router = express.Router();
const DetailPantaiController = require('../controllers/detailPantaiController');

// Get all detail pantai
router.get('/', DetailPantaiController.index);

// Get detail by pantai ID
router.get('/pantai/:id_pantai', DetailPantaiController.getByPantai);

// Get skor by pantai ID
router.get('/skor/:id_pantai', DetailPantaiController.getSkor);

// Get detail by ID
router.get('/:id', DetailPantaiController.show);

// Create detail pantai
router.post('/', DetailPantaiController.store);

// Update detail pantai
router.put('/:id', DetailPantaiController.update);

// Delete detail pantai
router.delete('/:id', DetailPantaiController.destroy);

module.exports = router;