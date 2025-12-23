// src/controllers/spkController.js
const db = require('../config/database');
const SPKHelper = require('../utils/spkHelper');

const ORDERED_CRITERIA = [
  "Harga Tiket Masuk",
  "Rata-Rata Harga Makanan",
  "Ketersediaan Fasilitas Umum",
  "Kondisi Jalan",
  "Rating Google Maps"
];

class SPKController {
  /**
   * GET /api/spk/kriteria
   */
  static async getKriteria(req, res) {
    try {
      const [kriteria] = await db.query(`
        SELECT 
          id_kriteria,
          nama_kriteria,
          jenis_kriteria,
          tipe_penilaian
        FROM kriteria
        ORDER BY id_kriteria
      `);

      res.json({
        success: true,
        data: kriteria
      });
    } catch (error) {
      console.error('Error getting kriteria:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data kriteria',
        error: error.message
      });
    }
  }


  static async hitungRanking(req, res) {
    try {
      // Accept multiple payload shapes:
      // 1) req.body is an array => comparisons
      // 2) req.body.ratings is array => comparisons or legacy ratings
      // 3) req.body.comparisons is array
      let payloadArray = null;
      if (Array.isArray(req.body)) {
        payloadArray = req.body;
      } else if (Array.isArray(req.body.ratings)) {
        payloadArray = req.body.ratings;
      } else if (Array.isArray(req.body.comparisons)) {
        payloadArray = req.body.comparisons;
      }

      if (!payloadArray || !Array.isArray(payloadArray)) {
        return res.status(400).json({
          success: false,
          message: 'Data rating/comparisons tidak valid. Kirim array comparisons atau { ratings: [...] }.'
        });
      }

      // 1. Ambil data kriteria dari DB
      const [kriteria] = await db.query(`
        SELECT 
          id_kriteria,
          nama_kriteria,
          jenis_kriteria
        FROM kriteria
        ORDER BY id_kriteria
      `);

      if (!Array.isArray(kriteria) || kriteria.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data kriteria tidak ditemukan'
        });
      }

      // Susun finalKriteria sesuai ORDERED_CRITERIA jika memungkinkan
      const ordered = ORDERED_CRITERIA.map(name => kriteria.find(k => k.nama_kriteria === name)).filter(Boolean);
      const finalKriteria = (ordered.length === ORDERED_CRITERIA.length) ? ordered : kriteria;

      const n = finalKriteria.length;
      const expectedComparisons = (n * (n - 1)) / 2;

      // Determine input type: legacy single-rating (length === n) OR pairwise (length === expectedComparisons)
      let pairwiseMatrix;
      let usedLegacyRatings = false;

      if (payloadArray.length === n) {
        // legacy: single rating per criterion (generate matrix from these ratings)
        usedLegacyRatings = true;
        // ensure numeric
        const ratings = payloadArray.map(v => Number(v));
        pairwiseMatrix = SPKHelper.generatePairwiseMatrixFromRatings(ratings);
      } else if (payloadArray.length === expectedComparisons) {
        // pairwise comparisons (values follow i<j order based on finalKriteria order)
        // convert to numbers and validate
        const comps = payloadArray.map(v => Number(v));
        if (comps.some(v => !isFinite(v) || v <= 0)) {
          return res.status(400).json({
            success: false,
            message: 'Semua nilai perbandingan harus berupa angka positif (1..9 biasanya).'
          });
        }

        pairwiseMatrix = SPKHelper.generatePairwiseMatrixFromComparisons(comps, finalKriteria.map(k => k.nama_kriteria));
      } else {
        return res.status(400).json({
          success: false,
          message: `Jumlah input tidak sesuai. Kirim ${n} (legacy) atau ${expectedComparisons} (pairwise). Dikirim: ${payloadArray.length}`
        });
      }

      // 3. Hitung bobot dengan AHP
      const ahpResult = SPKHelper.calculateAHP(pairwiseMatrix);

      // 4. Cek konsistensi
      if (!ahpResult.isConsistent) {
        return res.json({
          success: false,
          message: `Perbandingan tidak konsisten! CR = ${ahpResult.cr.toFixed(4)} (harus < 0.1). Silakan sesuaikan rating Anda agar lebih proporsional.`,
          cr: ahpResult.cr,
          weights: ahpResult.weights,
          pairwiseMatrix: pairwiseMatrix,
          suggestion: 'Coba kurangi perbedaan yang terlalu ekstrem antar rating kriteria.'
        });
      }

      // 5. Ambil data pantai dengan skor (pastikan jumlah kriteria sama)
      const [pantaiData] = await db.query(`
        SELECT 
          p.id_pantai,
          p.nama_pantai,
          p.provinsi,
          GROUP_CONCAT(sp.nilai_skor ORDER BY sp.id_kriteria) as skor_values
        FROM pantai p
        INNER JOIN skor_pantai sp ON p.id_pantai = sp.id_pantai
        GROUP BY p.id_pantai, p.nama_pantai, p.provinsi
        HAVING COUNT(DISTINCT sp.id_kriteria) = ?
        ORDER BY p.id_pantai
      `, [n]);

      if (!Array.isArray(pantaiData) || pantaiData.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data pantai tidak ditemukan atau tidak lengkap'
        });
      }

      // 6. Format data untuk SAW
      const alternatives = pantaiData.map(pantai => ({
        id_pantai: pantai.id_pantai,
        nama_pantai: pantai.nama_pantai,
        provinsi: pantai.provinsi,
        criteriaValues: pantai.skor_values.split(',').map(v => parseFloat(v))
      }));

      // 7. Hitung dengan SAW
      const criteriaTypes = finalKriteria.map(k => k.jenis_kriteria);
      const sawResults = SPKHelper.calculateSAW(alternatives, ahpResult.weights, criteriaTypes);

      // 8. Format hasil (TOP 10 only)
      const criteriaNames = finalKriteria.map(k => k.nama_kriteria);
      const formattedResults = SPKHelper.formatResults(sawResults, criteriaNames, 10);

      // Build safe ahp object for response (avoid undefined.map errors)
      const safeAHP = {
        weights: ahpResult.weights ? ahpResult.weights.map(w => parseFloat(w.toFixed(4))) : [],
        cr: typeof ahpResult.cr === 'number' ? parseFloat(ahpResult.cr.toFixed(4)) : null,
        ci: typeof ahpResult.ci === 'number' ? parseFloat(ahpResult.ci.toFixed(4)) : null,
        lambdaMax: typeof ahpResult.lambdaMax === 'number' ? parseFloat(ahpResult.lambdaMax.toFixed(4)) : null,
        weightedSum: Array.isArray(ahpResult.weightedSum) ? ahpResult.weightedSum.map(v => parseFloat(v.toFixed(4))) : [],
        normalizedMatrix: Array.isArray(ahpResult.normalizedMatrix) ? ahpResult.normalizedMatrix.map(row => row.map(v => parseFloat(v.toFixed(4)))) : [],
        pairwiseMatrix: Array.isArray(pairwiseMatrix) ? pairwiseMatrix.map(row => row.map(val => parseFloat(val.toFixed(4)))) : [],
        isConsistent: !!ahpResult.isConsistent
      };

      res.json({
        success: true,
        message: 'Perhitungan berhasil',
        ahp: safeAHP,
        kriteria: finalKriteria.map((k, idx) => ({
          id_kriteria: k.id_kriteria,
          nama_kriteria: k.nama_kriteria,
          jenis_kriteria: k.jenis_kriteria,
          rating: usedLegacyRatings ? Number(payloadArray[idx]) : null,
          bobot: ahpResult.weights ? parseFloat(ahpResult.weights[idx].toFixed(4)) : null,
          bobotPersen: ahpResult.weights ? parseFloat((ahpResult.weights[idx] * 100).toFixed(2)) : null
        })),
        ranking: formattedResults,
        totalAlternatif: sawResults.length,
        topN: 10
      });

    } catch (error) {
      console.error('Error calculating ranking:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghitung ranking',
        error: error.message
      });
    }
  }

  /**
   * GET /api/spk/pantai
   */
  static async getPantai(req, res) {
    try {
      const [pantai] = await db.query(`
        SELECT 
          p.id_pantai,
          p.nama_pantai,
          p.provinsi,
          sp.id_kriteria,
          k.nama_kriteria,
          k.jenis_kriteria,
          sp.nilai_skor
        FROM pantai p
        LEFT JOIN skor_pantai sp ON p.id_pantai = sp.id_pantai
        LEFT JOIN kriteria k ON sp.id_kriteria = k.id_kriteria
        ORDER BY p.id_pantai, sp.id_kriteria
      `);

      // Group by pantai
      const groupedData = {};
      pantai.forEach(row => {
        if (!groupedData[row.id_pantai]) {
          groupedData[row.id_pantai] = {
            id_pantai: row.id_pantai,
            nama_pantai: row.nama_pantai,
            provinsi: row.provinsi,
            skor: []
          };
        }

        if (row.id_kriteria) {
          groupedData[row.id_pantai].skor.push({
            id_kriteria: row.id_kriteria,
            nama_kriteria: row.nama_kriteria,
            jenis_kriteria: row.jenis_kriteria,
            nilai_skor: parseFloat(row.nilai_skor)
          });
        }
      });

      res.json({
        success: true,
        data: Object.values(groupedData)
      });

    } catch (error) {
      console.error('Error getting pantai:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data pantai',
        error: error.message
      });
    }
  }
}

module.exports = SPKController;
