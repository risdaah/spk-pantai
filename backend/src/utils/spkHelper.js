// src/utils/spkHelper.js
class SPKHelper {

  /**
   * Generate matriks perbandingan berpasangan dari rating individual (legacy)
   * @param {Array} ratings - Rating untuk setiap kriteria [9, 5, 7, 8, 3]
   * @returns {Array} - Matriks perbandingan berpasangan
   */
  static generatePairwiseMatrixFromRatings(ratings) {
    const n = ratings.length;
    const matrix = [];

    for (let i = 0; i < n; i++) {
      matrix[i] = [];
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else if (i < j) {
          const ratio = ratings[i] / ratings[j];
          matrix[i][j] = ratio;
        } else {
          matrix[i][j] = 1 / matrix[j][i];
        }
      }
    }

    return matrix;
  }

  /**
   * Generate pairwise matrix dari input comparisons berurutan.
   * pairwiseValues: array of length n*(n-1)/2 following loop i<j order
   * criteriaOrder: array of criteria names (length n) — menentukan urutan baris/kolom
   */
  static generatePairwiseMatrixFromComparisons(pairwiseValues, criteriaOrder) {
    const n = criteriaOrder.length;
    if (pairwiseValues.length !== (n * (n - 1)) / 2) {
      throw new Error('Jumlah perbandingan tidak sesuai dengan jumlah kriteria');
    }

    // initialize matrix NxN with 1s
    const matrix = Array.from({ length: n }, () => Array(n).fill(1));

    let idx = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const val = Number(pairwiseValues[idx]);
        if (!isFinite(val) || val <= 0) {
          throw new Error(`Nilai perbandingan tidak valid pada index ${idx}: ${pairwiseValues[idx]}`);
        }
        matrix[i][j] = val;
        matrix[j][i] = 1 / val;
        idx++;
      }
    }

    return matrix;
  }

  /**
   * Normalisasi matriks perbandingan berpasangan (kolom)
   * Menghasilkan matriks yang setiap elemen: a_ij / sum_k a_kj
   */
  static normalizeMatrix(matrix) {
    const n = matrix.length;
    const colSums = new Array(n).fill(0);

    // Hitung jumlah tiap kolom
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        colSums[j] += matrix[i][j];
      }
    }

    // Normalisasi per kolom
    const normalized = [];
    for (let i = 0; i < n; i++) {
      const row = [];
      for (let j = 0; j < n; j++) {
        // Hindari pembagian dengan 0 (defensive)
        row.push(colSums[j] !== 0 ? matrix[i][j] / colSums[j] : 0);
      }
      normalized.push(row);
    }

    return normalized;
  }

  /**
   * Hitung eigenvector utama menggunakan Power Method (Metode resmi AHP)
   */
  static eigenvectorPowerMethod(matrix, maxIter = 1000, tolerance = 1e-12) {
    const n = matrix.length;

    // Vector awal: seragam
    let eigenVector = Array(n).fill(1 / n);

    for (let iter = 0; iter < maxIter; iter++) {
      const nextVector = new Array(n).fill(0);

      // matrix * vector
      for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < n; j++) {
          sum += matrix[i][j] * eigenVector[j];
        }
        nextVector[i] = sum;
      }

      // Normalisasi (sum)
      const total = nextVector.reduce((a, b) => a + b, 0) || 1;
      for (let i = 0; i < n; i++) {
        nextVector[i] /= total;
      }

      // Cek konvergensi
      let diff = 0;
      for (let i = 0; i < n; i++) {
        diff += Math.abs(nextVector[i] - eigenVector[i]);
      }

      eigenVector = nextVector;

      if (diff < tolerance) break;
    }

    return eigenVector;
  }

  /**
   * Hitung bobot AHP menggunakan metode eigenvector utama
   * Juga mengembalikan normalizedMatrix agar controller dapat menampilkannya jika dibutuhkan
   */
  static calculateAHP(pairwiseMatrix) {
    const n = pairwiseMatrix.length;

    // Defensive: pastikan matrix persegi
    for (let i = 0; i < n; i++) {
      if (!Array.isArray(pairwiseMatrix[i]) || pairwiseMatrix[i].length !== n) {
        throw new Error('Pairwise matrix must be square');
      }
    }

    // 0) Buat normalizedMatrix (kolom) untuk tujuan tampilan / pemeriksaan
    const normalizedMatrix = this.normalizeMatrix(pairwiseMatrix);

    // 1) Hitung eigenvector (bobot)
    const weights = this.eigenvectorPowerMethod(pairwiseMatrix);

    // 2) Hitung weighted sum (A * w)
    const weightedSum = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        sum += pairwiseMatrix[i][j] * weights[j];
      }
      weightedSum[i] = sum;
    }

    // 3) Hitung lambdaMax
    let lambdaMax = 0;
    for (let i = 0; i < n; i++) {
      // defensive: jika bobot 0, hindari pembagian / inf
      lambdaMax += weights[i] ? (weightedSum[i] / weights[i]) : 0;
    }
    lambdaMax /= n;

    // 4) Consistency Index (CI)
    const ci = (lambdaMax - n) / (n - 1);

    // 5) Random Index (RI) berdasarkan n (Saaty)
    const RI = [0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];
    const ri = RI[n - 1] !== undefined ? RI[n - 1] : 1.49;

    // 6) Consistency Ratio (CR)
    const cr = ri !== 0 ? ci / ri : 0;

    return {
      weights,
      lambdaMax,
      ci,
      cr,
      weightedSum,
      normalizedMatrix,
      pairwiseMatrix,
      isConsistent: cr < 0.1
    };
  }

  /**
   * Perhitungan SAW (Simple Additive Weighting)
   */
  static calculateSAW(alternatives, weights, criteriaTypes) {
    const normalized = this.normalizeSAW(alternatives, criteriaTypes);

    const results = alternatives.map((alt, idx) => {
      let score = 0;
      for (let j = 0; j < weights.length; j++) {
        score += normalized[idx][j] * weights[j];
      }

      return {
        ...alt,
        normalizedValues: normalized[idx],
        finalScore: score
      };
    });

    results.sort((a, b) => b.finalScore - a.finalScore);
    results.forEach((result, index) => (result.rank = index + 1));
    return results;
  }

  /**
   * Normalisasi untuk SAW
   */
  static normalizeSAW(alternatives, criteriaTypes) {
    const numCriteria = criteriaTypes.length;
    const normalized = [];

    for (let i = 0; i < alternatives.length; i++) {
      const normalizedRow = [];
      for (let j = 0; j < numCriteria; j++) {
        const values = alternatives.map(alt => alt.criteriaValues[j]);
        const currentValue = alternatives[i].criteriaValues[j];

        let normalizedValue;

        if (criteriaTypes[j] === 'benefit') {
          const maxValue = Math.max(...values);
          normalizedValue = maxValue > 0 ? currentValue / maxValue : 0;
        } else {
          const minValue = Math.min(...values.filter(v => v > 0));
          normalizedValue = currentValue > 0 ? minValue / currentValue : 0;
        }

        normalizedRow.push(normalizedValue);
      }
      normalized.push(normalizedRow);
    }

    return normalized;
  }

  /**
   * Format hasil SAW untuk response
   */
  static formatResults(results, criteriaNames, topN = null) {
    const formatted = results.map(result => ({
      id_pantai: result.id_pantai,
      nama_pantai: result.nama_pantai,
      provinsi: result.provinsi,
      rank: result.rank,
      finalScore: parseFloat(result.finalScore.toFixed(4)),
      criteriaValues: result.criteriaValues,
      normalizedValues: result.normalizedValues.map(v => parseFloat(v.toFixed(4))),
      details: criteriaNames.map((name, idx) => ({
        kriteria: name,
        nilaiAsli: result.criteriaValues[idx],
        nilaiNormalisasi: parseFloat(result.normalizedValues[idx].toFixed(4))
      }))
    }));

    if (topN && topN > 0) {
      return formatted.slice(0, topN);
    }

    return formatted;
  }
}

module.exports = SPKHelper;
