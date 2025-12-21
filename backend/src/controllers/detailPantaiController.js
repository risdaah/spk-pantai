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

  // Create detail pantai (bisa multiple sub_kriteria untuk checklist)
  static async store(req, res) {
    try {
      const { id_pantai, id_kriteria, id_sub_kriteria } = req.body;

      // Validasi input
      if (!id_pantai || !id_kriteria || !id_sub_kriteria) {
        return res.status(400).json({
          success: false,
          message: 'id_pantai, id_kriteria, dan id_sub_kriteria harus diisi'
        });
      }

      // Get kriteria info untuk tahu tipe penilaian
      const kriteria = await DetailPantaiModel.getKriteriaInfo(id_kriteria);
      
      if (!kriteria) {
        return res.status(404).json({
          success: false,
          message: 'Kriteria tidak ditemukan'
        });
      }

      let insertedIds = [];

      // Jika tipe range, hanya boleh satu nilai
      if (kriteria.tipe_penilaian === 'range') {
        // Hapus data lama jika ada
        await DetailPantaiModel.deleteByPantaiKriteria(id_pantai, id_kriteria);

        // Insert data baru
        const result = await DetailPantaiModel.create({
          id_pantai,
          id_kriteria,
          id_sub_kriteria
        });
        insertedIds.push(result.insertId);

        // Get sub kriteria info untuk ambil nilai_skor
        const subKriteria = await DetailPantaiModel.getSubKriteriaInfo(id_sub_kriteria);
        
        // Update skor pantai
        await DetailPantaiModel.upsertSkorPantai(
          id_pantai,
          id_kriteria,
          subKriteria.nilai_skor
        );
      } else {
        // Tipe checklist, bisa multiple
        // id_sub_kriteria bisa array atau single value
        const subKriteriaArray = Array.isArray(id_sub_kriteria) 
          ? id_sub_kriteria 
          : [id_sub_kriteria];

        // Hapus data lama
        await DetailPantaiModel.deleteByPantaiKriteria(id_pantai, id_kriteria);

        // Insert multiple data
        for (const subKritId of subKriteriaArray) {
          const result = await DetailPantaiModel.create({
            id_pantai,
            id_kriteria,
            id_sub_kriteria: subKritId
          });
          insertedIds.push(result.insertId);
        }

        // Hitung skor (jumlah checklist yang dipilih)
        const score = await DetailPantaiModel.calculateScore(id_pantai, id_kriteria);
        
        // Update skor pantai
        await DetailPantaiModel.upsertSkorPantai(id_pantai, id_kriteria, score);
      }

      res.status(201).json({
        success: true,
        message: 'Data detail pantai berhasil ditambahkan dan skor diperbarui',
        data: {
          inserted_ids: insertedIds,
          id_pantai,
          id_kriteria
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
          message: 'id_pantai, id_kriteria, dan id_sub_kriteria harus diisi'
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

      // Update detail
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
        message: 'Data detail pantai berhasil diperbarui dan skor diperbarui',
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

      // Get detail info sebelum dihapus
      const existingDetail = await DetailPantaiModel.getById(id);
      if (!existingDetail) {
        return res.status(404).json({
          success: false,
          message: 'Data detail pantai tidak ditemukan'
        });
      }

      // Delete detail
      await DetailPantaiModel.delete(id);

      // Recalculate score
      const score = await DetailPantaiModel.calculateScore(
        existingDetail.id_pantai,
        existingDetail.id_kriteria
      );
      
      await DetailPantaiModel.upsertSkorPantai(
        existingDetail.id_pantai,
        existingDetail.id_kriteria,
        score
      );

      res.status(200).json({
        success: true,
        message: 'Data detail pantai berhasil dihapus dan skor diperbarui'
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
}

module.exports = DetailPantaiController;