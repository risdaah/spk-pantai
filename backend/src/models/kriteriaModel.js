const pool = require('../config/database'); // sesuaikan path ke database.js kamu

const Kriteria = {
  async getAllWithSub() {
    const sql = `
      SELECT 
        k.id_kriteria,
        k.nama_kriteria,
        k.jenis_kriteria,
        k.tipe_penilaian,
        sk.id_sub_kriteria,
        sk.label,
        sk.range_min,
        sk.range_max,
        sk.nilai_skor,
        sk.urutan
      FROM kriteria k
      LEFT JOIN sub_kriteria sk 
        ON sk.id_kriteria = k.id_kriteria
      ORDER BY k.id_kriteria, sk.urutan ASC
    `;

    // karena pool adalah mysql2/promise
    const [rows] = await pool.query(sql);
    return rows;
  }
};

module.exports = Kriteria;
