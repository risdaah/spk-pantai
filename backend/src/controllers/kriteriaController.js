// controllers/kriteriaController.js

const Kriteria = require('../models/kriteriaModel');
const pool = require('../config/database');

// Get all kriteria dengan sub-kriteria
exports.getKriteriaWithSub = async (req, res) => {
  try {
    const rows = await Kriteria.getAllWithSub();
    const map = {};

    rows.forEach(row => {
      const id = row.id_kriteria;
      if (!map[id]) {
        map[id] = {
          id_kriteria: row.id_kriteria,
          nama_kriteria: row.nama_kriteria,
          jenis_kriteria: row.jenis_kriteria,
          tipe_penilaian: row.tipe_penilaian,
          sub_kriteria: []
        };
      }

      if (row.id_sub_kriteria) {
        map[id].sub_kriteria.push({
          id_sub_kriteria: row.id_sub_kriteria,
          label: row.label,
          range_min: row.range_min,
          range_max: row.range_max,
          nilai_skor: row.nilai_skor,
          urutan: row.urutan
        });
      }
    });

    const result = Object.values(map);
    return res.json({
      status: true,
      message: 'Berhasil mengambil data kriteria',
      data: result
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      message: 'Gagal mengambil data kriteria'
    });
  }
};

// Get kriteria by ID (untuk edit)
exports.getKriteriaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const kriteria = await Kriteria.getById(id);
    if (!kriteria) {
      return res.status(404).json({
        status: false,
        message: 'Kriteria tidak ditemukan'
      });
    }

    const subKriteria = await Kriteria.getSubKriteriaById(id);

    return res.json({
      status: true,
      data: {
        ...kriteria,
        sub_kriteria: subKriteria
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      message: 'Gagal mengambil data kriteria'
    });
  }
};

// Create kriteria dengan sub-kriteria
exports.createKriteria = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { nama_kriteria, jenis_kriteria, tipe_penilaian, sub_kriteria } = req.body;

    // Validasi
    if (!nama_kriteria || !jenis_kriteria || !tipe_penilaian) {
      await connection.rollback();
      return res.status(400).json({
        status: false,
        message: 'Nama kriteria, jenis, dan tipe penilaian harus diisi'
      });
    }

    // Insert kriteria
    const [kriteriaResult] = await connection.query(
      'INSERT INTO kriteria (nama_kriteria, jenis_kriteria, tipe_penilaian) VALUES (?, ?, ?)',
      [nama_kriteria, jenis_kriteria, tipe_penilaian]
    );

    const id_kriteria = kriteriaResult.insertId;

    // Insert sub-kriteria
    if (sub_kriteria && Array.isArray(sub_kriteria) && sub_kriteria.length > 0) {
      for (let i = 0; i < sub_kriteria.length; i++) {
        const sub = sub_kriteria[i];
        await connection.query(
          `INSERT INTO sub_kriteria 
           (id_kriteria, label, range_min, range_max, nilai_skor, urutan)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            id_kriteria,
            sub.label,
            sub.range_min || null,
            sub.range_max || null,
            sub.nilai_skor,
            i + 1 // urutan
          ]
        );
      }
    }

    await connection.commit();

    return res.status(201).json({
      status: true,
      message: 'Kriteria berhasil ditambahkan',
      data: { id_kriteria }
    });

  } catch (err) {
    await connection.rollback();
    console.error(err);
    return res.status(500).json({
      status: false,
      message: 'Gagal menambahkan kriteria: ' + err.message
    });
  } finally {
    connection.release();
  }
};

// Update kriteria dengan sub-kriteria
exports.updateKriteria = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { nama_kriteria, jenis_kriteria, tipe_penilaian, sub_kriteria } = req.body;

    // Cek kriteria ada
    const [checkKriteria] = await connection.query(
      'SELECT id_kriteria FROM kriteria WHERE id_kriteria = ?',
      [id]
    );

    if (checkKriteria.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        status: false,
        message: 'Kriteria tidak ditemukan'
      });
    }

    // Update kriteria
    await connection.query(
      'UPDATE kriteria SET nama_kriteria = ?, jenis_kriteria = ?, tipe_penilaian = ? WHERE id_kriteria = ?',
      [nama_kriteria, jenis_kriteria, tipe_penilaian, id]
    );

    // Hapus sub-kriteria lama
    await connection.query('DELETE FROM sub_kriteria WHERE id_kriteria = ?', [id]);

    // Insert sub-kriteria baru
    if (sub_kriteria && Array.isArray(sub_kriteria) && sub_kriteria.length > 0) {
      for (let i = 0; i < sub_kriteria.length; i++) {
        const sub = sub_kriteria[i];
        await connection.query(
          `INSERT INTO sub_kriteria 
           (id_kriteria, label, range_min, range_max, nilai_skor, urutan)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            id,
            sub.label,
            sub.range_min || null,
            sub.range_max || null,
            sub.nilai_skor,
            i + 1
          ]
        );
      }
    }

    await connection.commit();

    return res.json({
      status: true,
      message: 'Kriteria berhasil diupdate'
    });

  } catch (err) {
    await connection.rollback();
    console.error(err);
    return res.status(500).json({
      status: false,
      message: 'Gagal mengupdate kriteria: ' + err.message
    });
  } finally {
    connection.release();
  }
};

// Delete kriteria
exports.deleteKriteria = async (req, res) => {
  try {
    const { id } = req.params;

    const kriteria = await Kriteria.getById(id);
    if (!kriteria) {
      return res.status(404).json({
        status: false,
        message: 'Kriteria tidak ditemukan'
      });
    }

    await Kriteria.delete(id);

    return res.json({
      status: true,
      message: 'Kriteria berhasil dihapus'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      message: 'Gagal menghapus kriteria: ' + err.message
    });
  }
};
