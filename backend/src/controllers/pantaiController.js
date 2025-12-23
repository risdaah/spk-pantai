// controllers/pantaiController.js

const PantaiModel = require('../models/pantaiModel');
const db = require('../config/database');

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

  // Create new pantai (simple version)
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

      const result = await PantaiModel.create({ 
        nama_pantai, 
        provinsi 
      });
      
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

  // =====================================================
  // FUNGSI UTAMA: Tambah pantai baru + detail kriteria + skor
  // =====================================================
  static async storeWithDetail(req, res) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        nama_pantai,
        provinsi,
        HTM,           // nilai angka, misal: 10000
        RRHM,          // nilai angka, misal: 25000
        RGM,           // nilai decimal, misal: 4.2
        fasilitas_umum, // array string, misal: ["Toilet", "Area Parkir"]
        kondisi_jalan   // array string, misal: ["Jalan Beraspal", "Kendaraan roda 2 bisa lewat"]
      } = req.body;

      // Validasi basic
      if (!nama_pantai || !provinsi) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Nama pantai dan provinsi harus diisi',
        });
      }

      // 1) Insert ke tabel pantai
      const [pantaiResult] = await connection.execute(
        `INSERT INTO pantai (nama_pantai, provinsi, HTM, RRHM, KFU, KJ, RGM)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          nama_pantai,
          provinsi,
          HTM || null,
          RRHM || null,
          fasilitas_umum ? fasilitas_umum.join(', ') : null,
          kondisi_jalan ? kondisi_jalan.join(', ') : null,
          RGM || null
        ]
      );

      const id_pantai = pantaiResult.insertId;

      // 2) Helper function: Cari sub_kriteria berdasarkan range
      const findSubKriteriaByRange = async (id_kriteria, nilai) => {
        if (!nilai && nilai !== 0) return null;
        
        const [rows] = await connection.execute(
          `SELECT id_sub_kriteria, nilai_skor 
           FROM sub_kriteria 
           WHERE id_kriteria = ? 
           AND range_min <= ? 
           AND range_max >= ?
           ORDER BY urutan ASC
           LIMIT 1`,
          [id_kriteria, nilai, nilai]
        );
        
        return rows[0] || null;
      };

      // 3) Helper function: Cari sub_kriteria berdasarkan label (untuk checklist)
      const findSubKriteriaByLabel = async (id_kriteria, label) => {
        const [rows] = await connection.execute(
          `SELECT id_sub_kriteria 
           FROM sub_kriteria 
           WHERE id_kriteria = ? 
           AND label = ?
           LIMIT 1`,
          [id_kriteria, label]
        );
        
        return rows[0]?.id_sub_kriteria || null;
      };

      // 4) Insert detail_pantai dan hitung skor untuk setiap kriteria

      // ===== KRITERIA 1: Harga Tiket Masuk (HTM) - Range =====
      if (HTM) {
        const subHTM = await findSubKriteriaByRange(1, HTM);
        if (subHTM) {
          await connection.execute(
            `INSERT INTO detail_pantai (id_pantai, id_kriteria, id_sub_kriteria)
             VALUES (?, 1, ?)`,
            [id_pantai, subHTM.id_sub_kriteria]
          );
          
          // Insert/Update skor
          await connection.execute(
            `INSERT INTO skor_pantai (id_pantai, id_kriteria, nilai_skor)
             VALUES (?, 1, ?)
             ON DUPLICATE KEY UPDATE nilai_skor = ?`,
            [id_pantai, subHTM.nilai_skor, subHTM.nilai_skor]
          );
        }
      }

      // ===== KRITERIA 2: Rata-Rata Harga Makanan (RRHM) - Range =====
      if (RRHM) {
        const subRRHM = await findSubKriteriaByRange(2, RRHM);
        if (subRRHM) {
          await connection.execute(
            `INSERT INTO detail_pantai (id_pantai, id_kriteria, id_sub_kriteria)
             VALUES (?, 2, ?)`,
            [id_pantai, subRRHM.id_sub_kriteria]
          );
          
          await connection.execute(
            `INSERT INTO skor_pantai (id_pantai, id_kriteria, nilai_skor)
             VALUES (?, 2, ?)
             ON DUPLICATE KEY UPDATE nilai_skor = ?`,
            [id_pantai, subRRHM.nilai_skor, subRRHM.nilai_skor]
          );
        }
      }

      // ===== KRITERIA 3: Ketersediaan Fasilitas Umum - Checklist (multi) =====
      if (fasilitas_umum && Array.isArray(fasilitas_umum) && fasilitas_umum.length > 0) {
        for (const fasilitas of fasilitas_umum) {
          const subId = await findSubKriteriaByLabel(3, fasilitas);
          if (subId) {
            await connection.execute(
              `INSERT INTO detail_pantai (id_pantai, id_kriteria, id_sub_kriteria)
               VALUES (?, 3, ?)`,
              [id_pantai, subId]
            );
          }
        }
        
        // Skor = jumlah fasilitas yang tersedia
        const skorFasilitas = fasilitas_umum.length;
        await connection.execute(
          `INSERT INTO skor_pantai (id_pantai, id_kriteria, nilai_skor)
           VALUES (?, 3, ?)
           ON DUPLICATE KEY UPDATE nilai_skor = ?`,
          [id_pantai, skorFasilitas, skorFasilitas]
        );
      }

      // ===== KRITERIA 4: Kondisi Jalan - Checklist (multi) =====
      if (kondisi_jalan && Array.isArray(kondisi_jalan) && kondisi_jalan.length > 0) {
        for (const kondisi of kondisi_jalan) {
          const subId = await findSubKriteriaByLabel(4, kondisi);
          if (subId) {
            await connection.execute(
              `INSERT INTO detail_pantai (id_pantai, id_kriteria, id_sub_kriteria)
               VALUES (?, 4, ?)`,
              [id_pantai, subId]
            );
          }
        }
        
        // Skor = jumlah kondisi jalan yang terpenuhi
        const skorKondisi = kondisi_jalan.length;
        await connection.execute(
          `INSERT INTO skor_pantai (id_pantai, id_kriteria, nilai_skor)
           VALUES (?, 4, ?)
           ON DUPLICATE KEY UPDATE nilai_skor = ?`,
          [id_pantai, skorKondisi, skorKondisi]
        );
      }

      // ===== KRITERIA 5: Rating Google Maps - Range =====
      if (RGM) {
        const subRating = await findSubKriteriaByRange(5, RGM);
        if (subRating) {
          await connection.execute(
            `INSERT INTO detail_pantai (id_pantai, id_kriteria, id_sub_kriteria)
             VALUES (?, 5, ?)`,
            [id_pantai, subRating.id_sub_kriteria]
          );
          
          await connection.execute(
            `INSERT INTO skor_pantai (id_pantai, id_kriteria, nilai_skor)
             VALUES (?, 5, ?)
             ON DUPLICATE KEY UPDATE nilai_skor = ?`,
            [id_pantai, subRating.nilai_skor, subRating.nilai_skor]
          );
        }
      }

      await connection.commit();

      return res.status(201).json({
        success: true,
        message: 'Pantai baru beserta detail kriteria dan skor berhasil ditambahkan',
        data: {
          id_pantai,
          nama_pantai,
          provinsi,
          HTM,
          RRHM,
          RGM,
          fasilitas_umum,
          kondisi_jalan
        },
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error in storeWithDetail:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat menambahkan pantai baru dan detail',
        error: error.message,
      });
    } finally {
      connection.release();
    }
  }

  // ===== METHOD UPDATE LENGKAP (TAMBAHKAN INI) =====
  static async updateLengkap(req, res) {
    let connection;
    
    try {
      const { id } = req.params;
      console.log('=== UPDATE PANTAI ID:', id, '===');
      console.log('Request body:', req.body);
      
      connection = await db.getConnection();
      await connection.beginTransaction();

      const {
        nama_pantai,
        provinsi,
        HTM,
        RRHM,
        RGM,
        fasilitas_umum,
        kondisi_jalan
      } = req.body;

      // Validasi
      if (!nama_pantai || !provinsi) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Nama pantai dan provinsi harus diisi',
        });
      }

      // 1) Cek apakah pantai ada
      const [checkPantai] = await connection.execute(
        'SELECT id_pantai FROM pantai WHERE id_pantai = ?',
        [id]
      );
      
      if (checkPantai.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Data pantai tidak ditemukan',
        });
      }

      // 2) Update tabel pantai
      await connection.execute(
        `UPDATE pantai 
         SET nama_pantai = ?, 
             provinsi = ?, 
             HTM = ?, 
             RRHM = ?, 
             KFU = ?, 
             KJ = ?, 
             RGM = ?
         WHERE id_pantai = ?`,
        [
          nama_pantai,
          provinsi,
          HTM ? `Rp${HTM.toLocaleString('id-ID')}` : null,
          RRHM ? `Rp${RRHM.toLocaleString('id-ID')}` : null,
          fasilitas_umum && fasilitas_umum.length > 0 ? fasilitas_umum.join(', ') : null,
          kondisi_jalan && kondisi_jalan.length > 0 ? kondisi_jalan.join(', ') : null,
          RGM || null,
          id
        ]
      );
      console.log('✅ Pantai updated');

      // 3) Hapus detail_pantai dan skor_pantai lama
      await connection.execute('DELETE FROM detail_pantai WHERE id_pantai = ?', [id]);
      await connection.execute('DELETE FROM skor_pantai WHERE id_pantai = ?', [id]);
      console.log('✅ Old details and scores deleted');

      // Helper: Cari sub_kriteria by range
      const findSubKriteriaByRange = async (id_kriteria, nilai) => {
        if (!nilai && nilai !== 0) return null;
        
        const [rows] = await connection.execute(
          `SELECT id_sub_kriteria, nilai_skor 
           FROM sub_kriteria 
           WHERE id_kriteria = ? 
           AND range_min <= ? 
           AND range_max >= ?
           ORDER BY urutan ASC
           LIMIT 1`,
          [id_kriteria, nilai, nilai]
        );
        
        return rows[0] || null;
      };

      // Helper: Cari sub_kriteria by label
      const findSubKriteriaByLabel = async (id_kriteria, label) => {
        if (!label) return null;
        
        const [rows] = await connection.execute(
          `SELECT id_sub_kriteria 
           FROM sub_kriteria 
           WHERE id_kriteria = ? 
           AND label LIKE ?
           LIMIT 1`,
          [id_kriteria, `%${label}%`]
        );
        
        return rows[0]?.id_sub_kriteria || null;
      };

      // 4) Insert detail_pantai dan skor_pantai baru

      // KRITERIA 1: HTM (Range)
      if (HTM && HTM > 0) {
        console.log('Processing HTM:', HTM);
        const subHTM = await findSubKriteriaByRange(1, HTM);
        if (subHTM) {
          await connection.execute(
            'INSERT INTO detail_pantai (id_pantai, id_kriteria, id_sub_kriteria) VALUES (?, 1, ?)',
            [id, subHTM.id_sub_kriteria]
          );
          await connection.execute(
            'INSERT INTO skor_pantai (id_pantai, id_kriteria, nilai_skor) VALUES (?, 1, ?)',
            [id, subHTM.nilai_skor]
          );
          console.log('✅ HTM processed');
        }
      }

      // KRITERIA 2: RRHM (Range)
      if (RRHM && RRHM > 0) {
        console.log('Processing RRHM:', RRHM);
        const subRRHM = await findSubKriteriaByRange(2, RRHM);
        if (subRRHM) {
          await connection.execute(
            'INSERT INTO detail_pantai (id_pantai, id_kriteria, id_sub_kriteria) VALUES (?, 2, ?)',
            [id, subRRHM.id_sub_kriteria]
          );
          await connection.execute(
            'INSERT INTO skor_pantai (id_pantai, id_kriteria, nilai_skor) VALUES (?, 2, ?)',
            [id, subRRHM.nilai_skor]
          );
          console.log('✅ RRHM processed');
        }
      }

      // KRITERIA 3: Fasilitas Umum (Checklist)
      if (fasilitas_umum && Array.isArray(fasilitas_umum) && fasilitas_umum.length > 0) {
        console.log('Processing Fasilitas:', fasilitas_umum.length, 'items');
        let countFasilitas = 0;
        
        for (const fasilitas of fasilitas_umum) {
          const subId = await findSubKriteriaByLabel(3, fasilitas);
          if (subId) {
            await connection.execute(
              'INSERT INTO detail_pantai (id_pantai, id_kriteria, id_sub_kriteria) VALUES (?, 3, ?)',
              [id, subId]
            );
            countFasilitas++;
          }
        }
        
        if (countFasilitas > 0) {
          await connection.execute(
            'INSERT INTO skor_pantai (id_pantai, id_kriteria, nilai_skor) VALUES (?, 3, ?)',
            [id, countFasilitas]
          );
          console.log('✅ Fasilitas processed:', countFasilitas);
        }
      }

      // KRITERIA 4: Kondisi Jalan (Checklist)
      if (kondisi_jalan && Array.isArray(kondisi_jalan) && kondisi_jalan.length > 0) {
        console.log('Processing Kondisi Jalan:', kondisi_jalan.length, 'items');
        let countKondisi = 0;
        
        for (const kondisi of kondisi_jalan) {
          const subId = await findSubKriteriaByLabel(4, kondisi);
          if (subId) {
            await connection.execute(
              'INSERT INTO detail_pantai (id_pantai, id_kriteria, id_sub_kriteria) VALUES (?, 4, ?)',
              [id, subId]
            );
            countKondisi++;
          }
        }
        
        if (countKondisi > 0) {
          await connection.execute(
            'INSERT INTO skor_pantai (id_pantai, id_kriteria, nilai_skor) VALUES (?, 4, ?)',
            [id, countKondisi]
          );
          console.log('✅ Kondisi Jalan processed:', countKondisi);
        }
      }

      // KRITERIA 5: Rating Google Maps (Range)
      if (RGM && RGM > 0) {
        console.log('Processing Rating:', RGM);
        const subRating = await findSubKriteriaByRange(5, RGM);
        if (subRating) {
          await connection.execute(
            'INSERT INTO detail_pantai (id_pantai, id_kriteria, id_sub_kriteria) VALUES (?, 5, ?)',
            [id, subRating.id_sub_kriteria]
          );
          await connection.execute(
            'INSERT INTO skor_pantai (id_pantai, id_kriteria, nilai_skor) VALUES (?, 5, ?)',
            [id, subRating.nilai_skor]
          );
          console.log('✅ Rating processed');
        }
      }

      await connection.commit();
      console.log('=== TRANSACTION COMMITTED ===');

      return res.status(200).json({
        success: true,
        message: 'Data pantai berhasil diupdate',
        data: {
          id_pantai: id,
          nama_pantai,
          provinsi,
          HTM,
          RRHM,
          RGM,
          fasilitas_umum,
          kondisi_jalan
        },
      });

    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      
      console.error('❌ ERROR in update:', error);
      console.error('Error stack:', error.stack);
      
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengupdate pantai',
        error: error.message,
      });
      
    } finally {
      if (connection) {
        connection.release();
      }
      console.log('=== END UPDATE ===');
    }
  }

}

module.exports = PantaiController;
