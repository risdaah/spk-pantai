// models/detailPantaiModel.js

const db = require('../config/database');

class DetailPantaiModel {
  
  // Get all detail pantai dengan join
  static async getAll() {
    const query = `
      SELECT 
        dp.id_detail,
        dp.id_pantai,
        p.nama_pantai,
        p.provinsi,
        dp.id_kriteria,
        k.nama_kriteria,
        k.jenis_kriteria,
        k.tipe_penilaian,
        dp.id_sub_kriteria,
        sk.label as sub_kriteria_label,
        sk.range_min,
        sk.range_max,
        sk.nilai_skor,
        dp.tanggal_input
      FROM detail_pantai dp
      JOIN pantai p ON dp.id_pantai = p.id_pantai
      JOIN kriteria k ON dp.id_kriteria = k.id_kriteria
      JOIN sub_kriteria sk ON dp.id_sub_kriteria = sk.id_sub_kriteria
      ORDER BY dp.tanggal_input DESC
    `;
    const [rows] = await db.execute(query);
    return rows;
  }

  // Get detail by pantai ID
  static async getByPantaiId(id_pantai) {
    const query = `
      SELECT 
        dp.id_detail,
        dp.id_pantai,
        p.nama_pantai,
        p.provinsi,
        dp.id_kriteria,
        k.nama_kriteria,
        k.jenis_kriteria,
        k.tipe_penilaian,
        dp.id_sub_kriteria,
        sk.label as sub_kriteria_label,
        sk.range_min,
        sk.range_max,
        sk.nilai_skor,
        dp.tanggal_input
      FROM detail_pantai dp
      JOIN pantai p ON dp.id_pantai = p.id_pantai
      JOIN kriteria k ON dp.id_kriteria = k.id_kriteria
      JOIN sub_kriteria sk ON dp.id_sub_kriteria = sk.id_sub_kriteria
      WHERE dp.id_pantai = ?
      ORDER BY k.id_kriteria, sk.urutan
    `;
    const [rows] = await db.execute(query, [id_pantai]);
    return rows;
  }

  // Get detail by ID
  static async getById(id) {
    const query = `
      SELECT 
        dp.*,
        p.nama_pantai,
        k.nama_kriteria,
        sk.label as sub_kriteria_label
      FROM detail_pantai dp
      JOIN pantai p ON dp.id_pantai = p.id_pantai
      JOIN kriteria k ON dp.id_kriteria = k.id_kriteria
      JOIN sub_kriteria sk ON dp.id_sub_kriteria = sk.id_sub_kriteria
      WHERE dp.id_detail = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }

  // Create detail pantai
  static async create(data) {
    const query = `
      INSERT INTO detail_pantai (id_pantai, id_kriteria, id_sub_kriteria)
      VALUES (?, ?, ?)
    `;
    const [result] = await db.execute(query, [
      data.id_pantai || data.idpantai,
      data.id_kriteria || data.idkriteria,
      data.id_sub_kriteria || data.idsubkriteria
    ]);
    return result;
  }

  // Update detail pantai
  static async update(id, data) {
    const query = `
      UPDATE detail_pantai 
      SET id_pantai = ?, id_kriteria = ?, id_sub_kriteria = ?
      WHERE id_detail = ?
    `;
    const [result] = await db.execute(query, [
      data.id_pantai,
      data.id_kriteria,
      data.id_sub_kriteria,
      id
    ]);
    return result;
  }

  // Delete detail pantai
  static async delete(id) {
    const query = 'DELETE FROM detail_pantai WHERE id_detail = ?';
    const [result] = await db.execute(query, [id]);
    return result;
  }

  // Delete all detail by pantai and kriteria
  static async deleteByPantaiKriteria(id_pantai, id_kriteria) {
    const query = 'DELETE FROM detail_pantai WHERE id_pantai = ? AND id_kriteria = ?';
    const [result] = await db.execute(query, [id_pantai, id_kriteria]);
    return result;
  }

  // Get kriteria info
  static async getKriteriaInfo(id_kriteria) {
    const query = 'SELECT * FROM kriteria WHERE id_kriteria = ?';
    const [rows] = await db.execute(query, [id_kriteria]);
    return rows[0];
  }

  // Get sub kriteria info
  static async getSubKriteriaInfo(id_sub_kriteria) {
    const query = 'SELECT * FROM sub_kriteria WHERE id_sub_kriteria = ?';
    const [rows] = await db.execute(query, [id_sub_kriteria]);
    return rows[0];
  }

  // Calculate score for pantai and kriteria
  static async calculateScore(id_pantai, id_kriteria) {
    // Get kriteria info
    const kriteria = await this.getKriteriaInfo(id_kriteria);
    
    if (kriteria.tipe_penilaian === 'range') {
      // Untuk tipe range, ambil satu nilai skor dari sub_kriteria
      const query = `
        SELECT sk.nilai_skor
        FROM detail_pantai dp
        JOIN sub_kriteria sk ON dp.id_sub_kriteria = sk.id_sub_kriteria
        WHERE dp.id_pantai = ? AND dp.id_kriteria = ?
        LIMIT 1
      `;
      const [rows] = await db.execute(query, [id_pantai, id_kriteria]);
      return rows[0]?.nilai_skor || 0;
    } else {
      // Untuk tipe checklist, hitung jumlah fasilitas yang tersedia
      const query = `
        SELECT COUNT(*) as jumlah
        FROM detail_pantai
        WHERE id_pantai = ? AND id_kriteria = ?
      `;
      const [rows] = await db.execute(query, [id_pantai, id_kriteria]);
      return rows[0].jumlah;
    }
  }

  // Update or insert skor pantai
  static async upsertSkorPantai(id_pantai, id_kriteria, nilai_skor) {
    const query = `
      INSERT INTO skor_pantai (id_pantai, id_kriteria, nilai_skor)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE nilai_skor = ?
    `;
    const [result] = await db.execute(query, [
      id_pantai,
      id_kriteria,
      nilai_skor,
      nilai_skor
    ]);
    return result;
  }

  // Get skor pantai
  static async getSkorPantai(id_pantai) {
    const query = `
      SELECT 
        sp.id_skor,
        sp.id_pantai,
        p.nama_pantai,
        sp.id_kriteria,
        k.nama_kriteria,
        k.jenis_kriteria,
        sp.nilai_skor,
        sp.updated_at
      FROM skor_pantai sp
      JOIN pantai p ON sp.id_pantai = p.id_pantai
      JOIN kriteria k ON sp.id_kriteria = k.id_kriteria
      WHERE sp.id_pantai = ?
      ORDER BY k.id_kriteria
    `;
    const [rows] = await db.execute(query, [id_pantai]);
    return rows;
  }

  // Ambil ringkasan per pantai
  static async getPantaiWithDetailSummary() {
    const query = `
      SELECT 
        p.id_pantai,
        p.nama_pantai,
        p.provinsi,
        p.HTM,
        p.RRHM,
        p.RGM,
        GROUP_CONCAT(
          CASE WHEN k.id_kriteria = 3 THEN sk.label END
          ORDER BY sk.urutan SEPARATOR ', '
        ) AS fasilitas_umum,
        GROUP_CONCAT(
          CASE WHEN k.id_kriteria = 4 THEN sk.label END
          ORDER BY sk.urutan SEPARATOR ', '
        ) AS kondisi_jalan
      FROM pantai p
      LEFT JOIN detail_pantai dp ON p.id_pantai = dp.id_pantai
      LEFT JOIN kriteria k ON dp.id_kriteria = k.id_kriteria
      LEFT JOIN sub_kriteria sk ON dp.id_sub_kriteria = sk.id_sub_kriteria
      GROUP BY 
        p.id_pantai,
        p.nama_pantai,
        p.provinsi,
        p.HTM,
        p.RRHM,
        p.RGM
      ORDER BY p.id_pantai ASC
    `;
    const [rows] = await db.execute(query);
    return rows;
  }
}

module.exports = DetailPantaiModel;
