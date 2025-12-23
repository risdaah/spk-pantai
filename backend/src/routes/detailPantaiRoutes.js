// routes/detailPantaiRoutes.js

const express = require('express');
const router = express.Router();
const DetailPantaiController = require('../controllers/detailPantaiController');

// Route untuk detail pantai
router.get('/', DetailPantaiController.index);
router.get('/summary', DetailPantaiController.getSummary);
router.get('/pantai/:id_pantai', DetailPantaiController.getByPantai);
router.get('/skor/:id_pantai', DetailPantaiController.getSkor);
router.get('/:id', DetailPantaiController.show);
router.post('/', DetailPantaiController.store);
router.put('/:id', DetailPantaiController.update);
router.delete('/:id', DetailPantaiController.destroy);

module.exports = router;
