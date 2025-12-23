// models/pantaiModel.js
const db = require('../config/database');

class PantaiModel {
  // Get all pantai
  static async getAll() {
    const query = 'SELECT * FROM pantai ORDER BY created_at DESC';
    const [rows] = await db.execute(query);
    return rows;
  }

  // Get pantai by ID
  static async getById(id) {
    const query = 'SELECT * FROM pantai WHERE id_pantai = ?';
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }

  // Create new pantai
  // Sebelumnya hanya namapantai, provinsi
  static async create(data) {
    const query = `
      INSERT INTO pantai (nama_pantai, provinsi, HTM, RRHM, KFU, KJ, RGM)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await db.execute(query, [
      data.namapantai,
      data.provinsi,
      data.HTM || null,
      data.RRHM || null,
      data.KFU || null,
      data.KJ || null,
      data.RGM || null,
    ]);
    return result;
  }

  // Update pantai
  static async update(id, data) {
    const query = 'UPDATE pantai SET nama_pantai = ?, provinsi = ? WHERE id_pantai = ?';
    const [result] = await db.execute(query, [data.nama_pantai, data.provinsi, id]);
    return result;
  }

  // Delete pantai
  static async delete(id) {
    const query = 'DELETE FROM pantai WHERE id_pantai = ?';
    const [result] = await db.execute(query, [id]);
    return result;
  }

  // Search pantai by name or province
  static async search(keyword) {
    const query = 'SELECT * FROM pantai WHERE nama_pantai LIKE ? OR provinsi LIKE ? ORDER BY created_at DESC';
    const [rows] = await db.execute(query, [`%${keyword}%`, `%${keyword}%`]);
    return rows;
  }
}

module.exports = PantaiModel;