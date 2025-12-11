// routes/helperRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all kriteria
router.get('/kriteria', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM kriteria ORDER BY id_kriteria');
    res.status(200).json({
      success: true,
      message: 'Data kriteria berhasil diambil',
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan',
      error: error.message
    });
  }
});

// Get sub kriteria by kriteria ID
router.get('/sub-kriteria/:id_kriteria', async (req, res) => {
  try {
    const { id_kriteria } = req.params;
    const [rows] = await db.execute(
      'SELECT * FROM sub_kriteria WHERE id_kriteria = ? ORDER BY urutan',
      [id_kriteria]
    );
    res.status(200).json({
      success: true,
      message: 'Data sub kriteria berhasil diambil',
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan',
      error: error.message
    });
  }
});

// Get all sub kriteria
router.get('/sub-kriteria', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        sk.*,
        k.nama_kriteria,
        k.tipe_penilaian
      FROM sub_kriteria sk
      JOIN kriteria k ON sk.id_kriteria = k.id_kriteria
      ORDER BY sk.id_kriteria, sk.urutan
    `);
    res.status(200).json({
      success: true,
      message: 'Data sub kriteria berhasil diambil',
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan',
      error: error.message
    });
  }
});

// Get all pantai (simple list)
router.get('/pantai', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM pantai ORDER BY nama_pantai');
    res.status(200).json({
      success: true,
      message: 'Data pantai berhasil diambil',
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan',
      error: error.message
    });
  }
});

module.exports = router;