// controllers/detailPantaiController.js

const DetailPantaiModel = require('../models/detailPantaiModel');

class DetailPantaiController {
  
  // Get all detail pantai
  static async index(req, res) {
    try {
      const details = await DetailPantaiModel.getAll();
      res.status(200).json({
        success: true,
        message: 'Data detail pantai berhasil diambil',
        data: details
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil data',
        error: error.message
      });
    }
  }

  // Get detail by pantai ID
  static async getByPantai(req, res) {
    try {
      const { id_pantai } = req.params;
      const details = await DetailPantaiModel.getByPantaiId(id_pantai);
      
      res.status(200).json({
        success: true,
        message: 'Data detail pantai berhasil diambil',
        data: details
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil data',
        error: error.message
      });
    }
  }

  // Get detail by ID
  static async show(req, res) {
    try {
      const { id } = req.params;
      const detail = await DetailPantaiModel.getById(id);
      
      if (!detail) {
        return res.status(404).json({
          success: false,
          message: 'Data detail pantai tidak ditemukan'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Data detail pantai berhasil diambil',
        data: detail
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil data',
        error: error.message
      });
    }
  }

  // Create detail pantai
  static async store(req, res) {
    try {
      const { id_pantai, id_kriteria, id_sub_kriteria } = req.body;
      
      // Validasi input
      if (!id_pantai || !id_kriteria || !id_sub_kriteria) {
        return res.status(400).json({
          success: false,
          message: 'Semua field harus diisi'
        });
      }

      const result = await DetailPantaiModel.create({
        id_pantai,
        id_kriteria,
        id_sub_kriteria
      });

      // Hitung dan update skor
      const score = await DetailPantaiModel.calculateScore(id_pantai, id_kriteria);
      await DetailPantaiModel.upsertSkorPantai(id_pantai, id_kriteria, score);

      res.status(201).json({
        success: true,
        message: 'Data detail pantai berhasil ditambahkan',
        data: {
          id_detail: result.insertId,
          id_pantai,
          id_kriteria,
          id_sub_kriteria
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

  // Update detail pantai
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { id_pantai, id_kriteria, id_sub_kriteria } = req.body;
      
      // Validasi input
      if (!id_pantai || !id_kriteria || !id_sub_kriteria) {
        return res.status(400).json({
          success: false,
          message: 'Semua field harus diisi'
        });
      }

      // Check if detail exists
      const existingDetail = await DetailPantaiModel.getById(id);
      if (!existingDetail) {
        return res.status(404).json({
          success: false,
          message: 'Data detail pantai tidak ditemukan'
        });
      }

      await DetailPantaiModel.update(id, {
        id_pantai,
        id_kriteria,
        id_sub_kriteria
      });

      // Recalculate score
      const score = await DetailPantaiModel.calculateScore(id_pantai, id_kriteria);
      await DetailPantaiModel.upsertSkorPantai(id_pantai, id_kriteria, score);

      res.status(200).json({
        success: true,
        message: 'Data detail pantai berhasil diperbarui',
        data: {
          id_detail: id,
          id_pantai,
          id_kriteria,
          id_sub_kriteria
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

  // Delete detail pantai
  static async destroy(req, res) {
    try {
      const { id } = req.params;
      
      // Check if detail exists
      const existingDetail = await DetailPantaiModel.getById(id);
      if (!existingDetail) {
        return res.status(404).json({
          success: false,
          message: 'Data detail pantai tidak ditemukan'
        });
      }

      const { id_pantai, id_kriteria } = existingDetail;

      await DetailPantaiModel.delete(id);

      // Recalculate score after deletion
      const score = await DetailPantaiModel.calculateScore(id_pantai, id_kriteria);
      await DetailPantaiModel.upsertSkorPantai(id_pantai, id_kriteria, score);

      res.status(200).json({
        success: true,
        message: 'Data detail pantai berhasil dihapus'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat menghapus data',
        error: error.message
      });
    }
  }

  // Get skor pantai
  static async getSkor(req, res) {
    try {
      const { id_pantai } = req.params;
      const skor = await DetailPantaiModel.getSkorPantai(id_pantai);
      
      res.status(200).json({
        success: true,
        message: 'Data skor pantai berhasil diambil',
        data: skor
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil data',
        error: error.message
      });
    }
  }

  // Get summary (ringkasan semua pantai dengan detail)
  static async getSummary(req, res) {
    try {
      const summary = await DetailPantaiModel.getPantaiWithDetailSummary();
      
      res.status(200).json({
        success: true,
        message: 'Ringkasan data pantai berhasil diambil',
        data: summary
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil ringkasan',
        error: error.message
      });
    }
  }
}

module.exports = DetailPantaiController;
