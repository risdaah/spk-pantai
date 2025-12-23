// routes/pantaiRoutes.js
const express = require('express');
const router = express.Router();
const PantaiController = require('../controllers/pantaiController');

// Get all pantai
router.get('/semua-pantai', PantaiController.index);

// Search pantai
router.get('/data-pantai/search', PantaiController.search);

// Get pantai by ID
router.get('/pantai-by/:id', PantaiController.show);

// POST /api/pantai/with-detail
router.post('/with-detail', PantaiController.storeWithDetail);

// Create new pantai
router.post('/pantai-baru', PantaiController.store);

// Update pantai
router.put('/edit-pantai/:id', PantaiController.update);

// Delete pantai
router.delete('/hapus-pantai/:id', PantaiController.destroy);



module.exports = router;