// controllers/pantaiController.js
const PantaiModel = require('../models/pantaiModel');

class PantaiController {
  // Get all pantai
  static async index(req, res) {
    try {
      const pantai = await PantaiModel.getAll();
      res.status(200).json({
        success: true,
        message: 'Data pantai berhasil diambil',
        data: pantai
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil data',
        error: error.message
      });
    }
  }

  // Get pantai by ID
  static async show(req, res) {
    try {
      const { id } = req.params;
      const pantai = await PantaiModel.getById(id);
      
      if (!pantai) {
        return res.status(404).json({
          success: false,
          message: 'Data pantai tidak ditemukan'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Data pantai berhasil diambil',
        data: pantai
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil data',
        error: error.message
      });
    }
  }

  // Create new pantai
  static async store(req, res) {
    try {
      const { nama_pantai, provinsi } = req.body;

      // Validasi input
      if (!nama_pantai || !provinsi) {
        return res.status(400).json({
          success: false,
          message: 'Nama pantai dan provinsi harus diisi'
        });
      }

      const result = await PantaiModel.create({ nama_pantai, provinsi });

      res.status(201).json({
        success: true,
        message: 'Data pantai berhasil ditambahkan',
        data: {
          id_pantai: result.insertId,
          nama_pantai,
          provinsi
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat menambahkan data',
        error: error.message
      });
    }
  }

  // Update pantai
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { nama_pantai, provinsi } = req.body;

      // Validasi input
      if (!nama_pantai || !provinsi) {
        return res.status(400).json({
          success: false,
          message: 'Nama pantai dan provinsi harus diisi'
        });
      }

      // Check if pantai exists
      const existingPantai = await PantaiModel.getById(id);
      if (!existingPantai) {
        return res.status(404).json({
          success: false,
          message: 'Data pantai tidak ditemukan'
        });
      }

      await PantaiModel.update(id, { nama_pantai, provinsi });

      res.status(200).json({
        success: true,
        message: 'Data pantai berhasil diperbarui',
        data: {
          id_pantai: id,
          nama_pantai,
          provinsi
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat memperbarui data',
        error: error.message
      });
    }
  }

  // Delete pantai
  static async destroy(req, res) {
    try {
      const { id } = req.params;

      // Check if pantai exists
      const existingPantai = await PantaiModel.getById(id);
      if (!existingPantai) {
        return res.status(404).json({
          success: false,
          message: 'Data pantai tidak ditemukan'
        });
      }

      await PantaiModel.delete(id);

      res.status(200).json({
        success: true,
        message: 'Data pantai berhasil dihapus'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat menghapus data',
        error: error.message
      });
    }
  }

  // Search pantai
  static async search(req, res) {
    try {
      const { keyword } = req.query;

      if (!keyword) {
        return res.status(400).json({
          success: false,
          message: 'Keyword pencarian harus diisi'
        });
      }

      const pantai = await PantaiModel.search(keyword);

      res.status(200).json({
        success: true,
        message: 'Pencarian berhasil',
        data: pantai
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mencari data',
        error: error.message
      });
    }
  }
}

module.exports = PantaiController;