// src/utils/spkHelper.js
class SPKHelper {

  // =========================
  // Utilities rounding
  // =========================

  static round3(value) {
    return Math.round(value * 1000) / 1000;
  }

  static round2(value) {
    return Math.round(value * 100) / 100;
  }

  // =========================
  // Pairwise Matrix Builder
  // =========================

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
          matrix[i][j] = this.round2(ratio);
        } else {
          matrix[i][j] = this.round2(1 / matrix[j][i]);
        }
      }
    }

    return matrix;
  }

  static generatePairwiseMatrixFromComparisons(pairwiseValues, criteriaOrder) {
    const n = criteriaOrder.length;
    if (pairwiseValues.length !== (n * (n - 1)) / 2) {
      throw new Error('Jumlah perbandingan tidak sesuai dengan jumlah kriteria');
    }

    const matrix = Array.from({ length: n }, () => Array(n).fill(1));

    let idx = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const rawVal = Number(pairwiseValues[idx]);
        if (!isFinite(rawVal) || rawVal <= 0) {
          throw new Error(`Nilai perbandingan tidak valid pada index ${idx}: ${pairwiseValues[idx]}`);
        }
        const v = this.round2(rawVal);
        matrix[i][j] = v;
        matrix[j][i] = this.round2(1 / v);
        idx++;
      }
    }

    return matrix;
  }

  // =========================
  // AHP - Excel Method (FINAL FIX!)
  // =========================

  /**
   * Normalisasi kolom (setiap elemen dibagi total kolom)
   */
  static ahpNormalizeMatrix(matrix) {
    const n = matrix.length;
    const colSums = Array(n).fill(0);

    // Hitung total per kolom
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        colSums[j] += matrix[i][j];
      }
    }

    // Normalisasi
    const normalized = matrix.map(row =>
      row.map((value, j) => value / colSums[j])
    );

    return normalized;
  }

  /**
   * Hitung bobot = rata-rata per baris dari matriks ternormalisasi
   */
  static ahpEigenvector(normalized) {
    const n = normalized.length;
    const weights = [];

    for (let i = 0; i < n; i++) {
      const rowSum = normalized[i].reduce((a, b) => a + b, 0);
      weights.push(rowSum / n);
    }

    return weights;
  }

  /**
   * Hitung weighted sum vector (A × w)
   */
  static ahpWeightedSum(matrix, weights) {
    const n = matrix.length;
    const weightedSum = [];

    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        sum += matrix[i][j] * weights[j];
      }
      weightedSum.push(sum);
    }

    return weightedSum;
  }

  /**
   * Hitung Consistency Vector per kriteria:
   * CV[i] = weighted_sum[i] / weight[i]
   */
  static ahpConsistencyVector(weightedSum, weights) {
    const n = weights.length;
    const consistencyVector = [];

    for (let i = 0; i < n; i++) {
      consistencyVector.push(weightedSum[i] / weights[i]);
    }

    return consistencyVector;
  }

  /**
   * Hitung lambda max = JUMLAH (SUM) dari weighted sum (A × w)
   * BUKAN rata-rata consistency vector!
   */
  static ahpLambdaMax(weightedSum) {
    return weightedSum.reduce((a, b) => a + b, 0);
  }

  /**
   * Consistency Index
   */
  static ahpCI(lambdaMax, n) {
    return (lambdaMax - n) / (n - 1);
  }

  /**
   * Consistency Ratio
   */
  static ahpCR(ci, n) {
    const RI = {
      1: 0.00,
      2: 0.00,
      3: 0.58,
      4: 0.90,
      5: 1.12,
      6: 1.24,
      7: 1.32,
      8: 1.41,
      9: 1.45,
      10: 1.49
    };
    return ci / (RI[n] || 1.49);
  }

  /**
   * Main AHP Calculation - Excel Compatible (FINAL!)
   */
  static calculateAHP(pairwiseMatrix) {
    const n = pairwiseMatrix.length;

    // 1. Normalisasi matriks (per kolom)
    const normalizedMatrix = this.ahpNormalizeMatrix(pairwiseMatrix);

    // 2. Hitung bobot (rata-rata per baris)
    const weights = this.ahpEigenvector(normalizedMatrix);

    // 3. Hitung weighted sum vector (A × w)
    const weightedSum = this.ahpWeightedSum(pairwiseMatrix, weights);

    // 4. Hitung consistency vector untuk display (weighted_sum / weight)
    const consistencyVector = this.ahpConsistencyVector(weightedSum, weights);

    // 5. Lambda Max = SUM dari weighted sum (A × w), BUKAN rata-rata!
    const lambdaMax = this.ahpLambdaMax(weightedSum);

    // 6. Hitung CI
    const ci = this.ahpCI(lambdaMax, n);

    // 7. Hitung CR
    const cr = this.ahpCR(ci, n);

    return {
      pairwiseMatrix,      
      normalizedMatrix,    
      weights,
      weightedSum,         // Ini yang Excel sebut "Jumlah" di context lain
      consistencyVector,   // (A×w)/w untuk referensi
      lambdaMax,           // SUM(A × w) = 5.389...
      ci,                  // 0.097...
      cr,                  // 0.086...
      isConsistent: cr <= 0.1,

      // Display dengan pembulatan
      display: {
        weights: weights.map(v => this.round3(v)),
        weightedSum: weightedSum.map(v => this.round3(v)),
        consistencyVector: consistencyVector.map(v => this.round3(v)),
        normalizedMatrix: normalizedMatrix.map(row => row.map(v => this.round3(v))),
        lambdaMax: this.round3(lambdaMax),
        ci: this.round3(ci),
        cr: this.round3(cr)
      }
    };
  }

  // =========================
  // SAW
  // =========================

  static normalizeSAW(alternatives, criteriaTypes) {
    const numCriteria = criteriaTypes.length;
    const normalized = [];

    for (let i = 0; i < alternatives.length; i++) {
      const normalizedRow = [];

      for (let j = 0; j < numCriteria; j++) {
        const values = alternatives.map(alt => alt.criteriaValues[j]);
        const currentValue = alternatives[i].criteriaValues[j];

        let val = 0;

        if (criteriaTypes[j] === "benefit") {
          const maxValue = Math.max(...values);
          val = maxValue > 0 ? currentValue / maxValue : 0;
        } else {
          const minValue = Math.min(...values.filter(v => v > 0));
          val = currentValue > 0 ? minValue / currentValue : 0;
        }

        normalizedRow.push(this.round3(val));
      }

      normalized.push(normalizedRow);
    }

    return normalized;
  }

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
        finalScore: this.round3(score)
      };
    });

    results.sort((a, b) => b.finalScore - a.finalScore);
    results.forEach((r, i) => (r.rank = i + 1));

    return results;
  }

  static formatResults(results, criteriaNames, topN = null) {
    const formatted = results.map(result => ({
      id_pantai: result.id_pantai,
      nama_pantai: result.nama_pantai,
      provinsi: result.provinsi,
      rank: result.rank,
      finalScore: this.round3(result.finalScore),
      criteriaValues: result.criteriaValues,
      normalizedValues: result.normalizedValues.map(v => this.round3(v)),
      details: criteriaNames.map((name, idx) => ({
        kriteria: name,
        nilaiAsli: result.criteriaValues[idx],
        nilaiNormalisasi: this.round3(result.normalizedValues[idx])
      }))
    }));

    if (topN && topN > 0) {
      return formatted.slice(0, topN);
    }

    return formatted;
  }
}

module.exports = SPKHelper;
