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

  // create versi full
  // Tambah pantai baru + detail kriteria sekaligus
  static async storeWithDetail(req, res) {
    const {
      namapantai,
      provinsi,
      HTM,
      RRHM,
      RGM,
      fasilitasUmumIds,   // array idsubkriteria untuk kriteria 3
      kondisiJalanIds,    // array idsubkriteria untuk kriteria 4
      htmSubId,           // idsubkriteria untuk kriteria 1 (range HTM)
      rrhmSubId,          // idsubkriteria untuk kriteria 2 (range RRHM)
      ratingSubId         // idsubkriteria untuk kriteria 5 (range rating)
    } = req.body;

    try {
      // Validasi basic
      if (!namapantai || !provinsi) {
        return res.status(400).json({
          success: false,
          message: 'Nama pantai dan provinsi harus diisi',
        });
      }

      // 1) Insert ke tabel pantai
      const pantaiResult = await PantaiModel.create({
        namapantai,
        provinsi,
        HTM,
        RRHM,
        // teks gabungan KFU/KJ bisa kamu bentuk di frontend atau nanti di summary
        KFU: null,
        KJ: null,
        RGM,
      });

      const idpantai = pantaiResult.insertId;

      // 2) Insert detail_pantai berdasarkan idsubkriteria
      const insertedDetailIds = [];

      // Helper untuk insert 1 detail + upsert skor (pakai logic existing di DetailPantaiModel)
      const insertDetailRange = async (idkriteria, idsubkriteria) => {
        if (!idsubkriteria) return;

        // hapus lama (harusnya belum ada untuk pantai baru, tapi aman)
        await DetailPantaiModel.deleteByPantaiKriteria(idpantai, idkriteria);

        const result = await DetailPantaiModel.create({
          idpantai,
          idkriteria,
          idsubkriteria,
        });
        insertedDetailIds.push(result.insertId);

        const sub = await DetailPantaiModel.getSubKriteriaInfo(idsubkriteria);
        await DetailPantaiModel.upsertSkorPantai(
          idpantai,
          idkriteria,
          sub.nilaiskor || 0
        );
      };

      const insertDetailChecklist = async (idkriteria, idArray) => {
        if (!idArray || !Array.isArray(idArray) || idArray.length === 0) return;

        await DetailPantaiModel.deleteByPantaiKriteria(idpantai, idkriteria);

        for (const sid of idArray) {
          const result = await DetailPantaiModel.create({
            idpantai,
            idkriteria,
            idsubkriteria: sid,
          });
          insertedDetailIds.push(result.insertId);
        }

        // hitung skor checklist (jumlah fasilitas) & upsert ke skorpantai
        const score = await DetailPantaiModel.calculateScore(idpantai, idkriteria);
        await DetailPantaiModel.upsertSkorPantai(idpantai, idkriteria, score);
      };

      // kriteria 1: HTM (range)
      await insertDetailRange(1, htmSubId);

      // kriteria 2: RRHM (range)
      await insertDetailRange(2, rrhmSubId);

      // kriteria 5: Rating Google Maps (range)
      await insertDetailRange(5, ratingSubId);

      // kriteria 3: Ketersediaan Fasilitas Umum (checklist, multi)
      await insertDetailChecklist(3, fasilitasUmumIds);

      // kriteria 4: Kondisi Jalan (checklist, multi)
      await insertDetailChecklist(4, kondisiJalanIds);

      return res.status(201).json({
        success: true,
        message: 'Pantai baru beserta detail kriteria berhasil ditambahkan',
        data: {
          idpantai,
          namapantai,
          provinsi,
          HTM,
          RRHM,
          RGM,
          insertedDetailIds,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat menambahkan pantai baru dan detail',
        error: error.message,
      });
    }
  }
}

module.exports = PantaiController;