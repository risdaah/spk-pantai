const Kriteria = require('../models/kriteriaModel');

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
