// models/kriteriaModel.js

const pool = require('../config/database');

const Kriteria = {
  
  // Get all kriteria dengan sub-kriteria
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
      LEFT JOIN sub_kriteria sk ON sk.id_kriteria = k.id_kriteria
      ORDER BY k.id_kriteria, sk.urutan ASC
    `;
    const [rows] = await pool.query(sql);
    return rows;
  },

  // Get kriteria by ID
  async getById(id) {
    const sql = 'SELECT * FROM kriteria WHERE id_kriteria = ?';
    const [rows] = await pool.query(sql, [id]);
    return rows[0];
  },

  // Get sub-kriteria by kriteria ID
  async getSubKriteriaById(id_kriteria) {
    const sql = `
      SELECT * FROM sub_kriteria 
      WHERE id_kriteria = ? 
      ORDER BY urutan ASC
    `;
    const [rows] = await pool.query(sql, [id_kriteria]);
    return rows;
  },

  // Create kriteria
  async create(data) {
    const sql = `
      INSERT INTO kriteria (nama_kriteria, jenis_kriteria, tipe_penilaian)
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
      data.nama_kriteria,
      data.jenis_kriteria,
      data.tipe_penilaian
    ]);
    return result;
  },

  // Create sub-kriteria
  async createSubKriteria(data) {
    const sql = `
      INSERT INTO sub_kriteria 
      (id_kriteria, label, range_min, range_max, nilai_skor, urutan)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
      data.id_kriteria,
      data.label,
      data.range_min || null,
      data.range_max || null,
      data.nilai_skor,
      data.urutan
    ]);
    return result;
  },

  // Update kriteria
  async update(id, data) {
    const sql = `
      UPDATE kriteria 
      SET nama_kriteria = ?, 
          jenis_kriteria = ?, 
          tipe_penilaian = ?
      WHERE id_kriteria = ?
    `;
    const [result] = await pool.query(sql, [
      data.nama_kriteria,
      data.jenis_kriteria,
      data.tipe_penilaian,
      id
    ]);
    return result;
  },

  // Delete sub-kriteria by kriteria ID
  async deleteSubKriteriaByKriteriaId(id_kriteria) {
    const sql = 'DELETE FROM sub_kriteria WHERE id_kriteria = ?';
    const [result] = await pool.query(sql, [id_kriteria]);
    return result;
  },

  // Delete kriteria
  async delete(id) {
    // Delete sub-kriteria first (foreign key)
    await this.deleteSubKriteriaByKriteriaId(id);
    
    // Delete kriteria
    const sql = 'DELETE FROM kriteria WHERE id_kriteria = ?';
    const [result] = await pool.query(sql, [id]);
    return result;
  }

};

module.exports = Kriteria;
