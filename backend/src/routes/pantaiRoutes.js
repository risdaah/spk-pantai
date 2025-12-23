// routes/pantaiRoutes.js

const express = require('express');
const router = express.Router();
const PantaiController = require('../controllers/pantaiController');

// Route untuk CRUD pantai
router.get('/', PantaiController.index);
router.get('/search', PantaiController.search);
router.get('/:id', PantaiController.show);
router.post('/', PantaiController.store);
router.post('/with-detail', PantaiController.storeWithDetail); // Route baru untuk tambah lengkap
router.put('/:id', PantaiController.updateLengkap);
router.delete('/:id', PantaiController.destroy);

module.exports = router;
