// DataKriteria.js

// Endpoint kriteria + sub_kriteria
const API_KRITERIA_URL = 'http://localhost:5000/api/spk/kriteria/kriteria-semua';

// DOM elements
const tbody = document.getElementById('tableBody');
const totalKriteriaEl = document.getElementById('totalKriteria');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');

// Render 1 baris kriteria + list sub-kriteria
function renderRow(kriteria, index) {
  const tr = document.createElement('tr');

  // Bangun list sub_kriteria (ul > li)
  let subListHtml = '';
  if (Array.isArray(kriteria.sub_kriteria) && kriteria.sub_kriteria.length > 0) {
    subListHtml = `
      <ul class="subkriteria-list">
        ${kriteria.sub_kriteria
          .map((sk) => {
            // Kalau tipe range => tampilkan range + skor
            if (kriteria.tipe_penilaian === 'range') {
              return `<li>
                <strong>${sk.label ?? ''}</strong>
                (${sk.range_min} - ${sk.range_max}) &mdash; skor: ${sk.nilai_skor}
              </li>`;
            }

            // Kalau tipe checklist => tampilkan label + skor
            return `<li>
              ${sk.label} &mdash; skor: ${sk.nilai_skor}
            </li>`;
          })
          .join('')}
      </ul>
    `;
  } else {
    subListHtml = '<span class="text-muted">Belum ada sub-kriteria</span>';
  }

  tr.innerHTML = `
    <td>${index + 1}</td>
    <td class="kriteria-text">${kriteria.nama_kriteria}</td>
    <td>${kriteria.jenis_kriteria}</td>
    <td>${kriteria.tipe_penilaian}</td>
    <td>${subListHtml}</td>
  `;

  return tr;
}

// Ambil data dari API dan render
async function loadKriteria() {
  try {
    loadingState.classList.remove('d-none');
    errorState.classList.add('d-none');
    tbody.innerHTML = '';

    const res = await fetch(API_KRITERIA_URL);
    const json = await res.json();

    if (!json.status) {
      throw new Error(json.message || 'Gagal memuat data');
    }

    const data = json.data || [];
    totalKriteriaEl.textContent = data.length;

    data.forEach((k, i) => {
      const row = renderRow(k, i);
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error(err);
    errorState.classList.remove('d-none');
  } finally {
    loadingState.classList.add('d-none');
  }
}

// Auto-load saat halaman dibuka
document.addEventListener('DOMContentLoaded', loadKriteria);
