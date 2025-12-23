/* =====================================================
 * SPK DESTINASI PANTAI – FRONTEND LOGIC (AHP + SAW)
 * ===================================================== */

/* === CRITERIA ORDERING (BARU) === */
const ORDERED_CRITERIA = [
    "Harga Tiket Masuk",
    "Rata-Rata Harga Makanan",
    "Ketersediaan Fasilitas Umum",
    "Kondisi Jalan",
    "Rating Google Maps"
];

/* === ERROR POPUP SIMPLE === */
function showError(message) {
    alert(message);
}

/* GLOBAL STATE */
let kriteriaData = [];
let hasilData = null;
let AHP_DATA = null;

/* Load ketika halaman siap */
document.addEventListener('DOMContentLoaded', async () => {
    await loadKriteria();
});

/* =====================================================
 * 1. LOAD KRITERIA + REORDER
 * ===================================================== */
async function loadKriteria() {
    try {
        const response = await API.getKriteria();

        if (response.success) {
            const fetched = response.data;

            const ordered = ORDERED_CRITERIA
                .map(name => fetched.find(f => f.nama_kriteria === name))
                .filter(Boolean);

            // Gunakan order manual jika cocok semua
            kriteriaData = (ordered.length === ORDERED_CRITERIA.length)
                ? ordered
                : fetched;

            displayKriteria(kriteriaData);
            generateRatingForm(kriteriaData);
        } else {
            showError("Gagal memuat kriteria");
        }
    } catch (err) {
        showError("Error: " + err.message);
    }
}

/* =====================================================
 * 2. TAMPILKAN KRITERIA
 * ===================================================== */
function displayKriteria(kriteria) {
    const container = document.getElementById('kriteriaList');
    let html = "";

    kriteria.forEach((k, i) => {
        const badge = k.jenis_kriteria === "benefit" ? "benefit" : "cost";
        html += `
            <div class="kriteria-item">
                <strong>C${i + 1}: ${k.nama_kriteria}</strong>
                <span class="badge ${badge}">${k.jenis_kriteria}</span>
            </div>
        `;
    });

    container.innerHTML = html;
}

/* =====================================================
 * 3. FORM PERBANDINGAN BERPASANGAN (PAIRWISE AHP)
 * ===================================================== */
function generateRatingForm(kriteria) {
    const container = document.getElementById('ratingForm');
    let html = "";

    const n = kriteria.length;
    let index = 0;

    html += `<h4>Perbandingan Berpasangan AHP</h4>`;
    html += `<p>Pilih tingkat kepentingan kriteria kiri dibanding kanan.</p>`;

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            html += `
                <div class="rating-row">
                <div class="rating-col rating-left"><strong>${kriteria[i].nama_kriteria}</strong></div>

                <div class="rating-col rating-mid">
                    <div class="slider-wrapper">
                    <input type="range"
                        min="1" max="9" step="1" value="1"
                        id="rating_${index}"
                        class="rating-slider"
                        oninput="updateRatingValue(${index}, this)">
                    <div class="rating-tooltip" id="value_${index}">1</div>
                    </div>
                </div>

                <div class="rating-col rating-right"><strong>${kriteria[j].nama_kriteria}</strong></div>
                </div>
            `;

            index++;
        }
    }

    container.innerHTML = html;
}

function updateRatingValue(index, inputEl) {
  const tooltip = document.getElementById(`value_${index}`);
  if (!tooltip) return;

  const value = parseFloat(inputEl.value);
  tooltip.textContent = value;

  const min = inputEl.min ? parseFloat(inputEl.min) : 0;
  const max = inputEl.max ? parseFloat(inputEl.max) : 100;
  const percent = (value - min) / (max - min);

  // posisi horizontal tooltip mengikuti knob
  tooltip.style.left = `${percent * 100}%`;
}


/* =====================================================
 * 4. HITUNG RANKING (KIRIM KE BACKEND)
 * ===================================================== */
async function hitungRanking() {
    const btn = document.getElementById('hitungBtn');
    btn.disabled = true;
    btn.textContent = "⏳ Menghitung...";


    try {
        const comparisons = [];
        const n = kriteriaData.length;
        const expected = (n * (n - 1)) / 2;


        for (let i = 0; i < expected; i++) {
            const el = document.getElementById(`rating_${i}`);
            comparisons.push(parseFloat(el.value));
        }


        const response = await API.hitungRanking(comparisons);
        console.log("BACKEND RESPONSE:", response);
        console.log('📊 TOTAL RANKING:', response.ranking.length); // ← TAMBAH INI
        console.log('📊 RANKING DATA:', response.ranking); // ← DAN INI


        if (!response.success) {
            return showError(response.message || "Perhitungan gagal");
        }


        if (!Array.isArray(response.ranking)) {
            return showError("Ranking tidak ditemukan dari backend");
        }


        hasilData = response;        // Simpan semua
        AHP_DATA = response.ahp;     // Simpan AHP


        displayHasil(response);


        document.getElementById("hasilSection")
            .scrollIntoView({ behavior: "smooth" });


    } catch (err) {
        showError("Error: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="bi bi-calculator mx-1"></i> Hitung Ranking`;

    }
}

/* =====================================================
 * 5. TAMPILKAN HASIL
 * ===================================================== */
function displayHasil(data) {
    document.getElementById("hasilSection").style.display = 'block';
    displayAHPInfo(data.ahp, data.totalAlternatif);
    displayBobotKriteria(data.kriteria);
    displayRankingTable(data.ranking);
}

/* AHP Summary */
function displayAHPInfo(ahp, totalAlternatif) {
    const container = document.getElementById('ahpInfo');

    const status = ahp.isConsistent
        ? `✔ Konsisten (CR = ${ahp.cr})`
        : `✖ Tidak Konsisten (CR = ${ahp.cr})`;

    container.innerHTML = `
        <div class="${ahp.isConsistent ? 'success' : 'error'}">
            <strong>Status Konsistensi AHP:</strong> ${status}
            <br><small>Total ${totalAlternatif} pantai dianalisis</small>
        </div>
    `;
}

/* Bobot Kriteria */
function displayBobotKriteria(kriteria) {
    const container = document.getElementById('bobotKriteria');
    let html = `<div class="bobot-grid">`;

    kriteria.forEach(k => {
        html += `
            <div class="bobot-item">
                <div class="nama">${k.nama_kriteria}</div>
                <div class="nilai">${k.bobotPersen}%</div>
            </div>
        `;
    });

    html += "</div>";
    container.innerHTML = html;
}

// spk.js - UPDATE FUNCTION displayRankingTable

/* === Ranking Table === */
function displayRankingTable(ranking) {
  const cardsContainer = document.getElementById('rankingCards');
  if (!cardsContainer) return;
  
  let html = '';
  
  // ✅ TAMPILKAN 10 DATA (atau semua kalau backend kirim semua)
  const topData = ranking.slice(0, 10); // Ambil 10 teratas
  
  topData.forEach(item => {
    const rankClass = item.rank <= 3 ? `rank-${item.rank}` : 'rank-other';
    
    html += `
      <div class="rank-card">
        <div class="rank-card-header">
          <span class="rank-badge ${rankClass}">#${item.rank}</span>
          <div class="rank-card-title">
            <div class="name"><strong>${item.nama_pantai}</strong></div>
            <div class="provinsi text-muted">${item.provinsi}</div>
          </div>
        </div>
        <div class="rank-card-body">
          <div class="score-row">
            <span class="text-muted">Skor Akhir:</span>
            <span class="score">${item.finalScore.toFixed(4)}</span>
          </div>
          <button class="btn-detail btn-secondary rounded-pill" onclick="showDetail(${item.id_pantai})">
            Detail
          </button>
        </div>
      </div>
    `;
  });
  
  cardsContainer.innerHTML = html;
}




/* =====================================================
 * 6. MODAL DETAIL SAW
 * ===================================================== */
function showDetail(idPantai) {
    const item = hasilData.ranking.find(r => r.id_pantai === idPantai);
    if (!item) return;

    const modal = document.getElementById('detailModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');

    title.textContent = `Detail: ${item.nama_pantai}`;

    let html = `
        <p><strong>Provinsi:</strong> ${item.provinsi}</p>
        <p><strong>Rank:</strong> #${item.rank}</p>
        <p><strong>Skor Akhir:</strong> ${item.finalScore.toFixed(4)}</p>

        <div class="detail-table">
            <h4>Rincian SAW</h4>
            <table>
                <thead>
                    <tr>
                        <th>Kriteria</th>
                        <th>Nilai Asli</th>
                        <th>Normalisasi</th>
                        <th>Bobot</th>
                        <th>Kontribusi</th>
                    </tr>
                </thead>
                <tbody>
    `;

    item.details.forEach((detail, idx) => {
        const bobot = hasilData.kriteria[idx].bobot;
        html += `
            <tr>
                <td><strong>${detail.kriteria}</strong></td>
                <td>${detail.nilaiAsli}</td>
                <td>${detail.nilaiNormalisasi}</td>
                <td>${bobot.toFixed(4)}</td>
                <td>${(detail.nilaiNormalisasi * bobot).toFixed(4)}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    body.innerHTML = html;
    modal.style.display = 'block';
}

/* =====================================================
 * 7. MODAL DETAIL AHP
 * ===================================================== */
function showAHPDetail() {
    if (!AHP_DATA) return alert("Data AHP belum tersedia!");

    const names = hasilData.kriteria.map(k => k.nama_kriteria);
    let html = "";

    html += `<h5 class="fw-bold mt-3">Matriks Perbandingan Berpasangan</h4>`;
    html += `<div class="table-responsive">${generateTable(AHP_DATA.pairwiseMatrix, names)}</div>`;

    html += `<h5 class="mt-3 fw-bold">Matriks Normalisasi</h4>`;
    html += `<div class="table-responsive">${generateTable(AHP_DATA.normalizedMatrix, names)}</div>`;

    html += `<h5 class="mt-3 fw-bold">Bobot Kriteria</h4><ul>`;
    AHP_DATA.weights.forEach((w, i) => {
        html += `<li>${names[i]}: ${w.toFixed(4)}</li>`;
    });
    html += `</ul>`;

    html += `
        <h5 class="fw-bold">Konsistensi</h4>
        <p><strong>λmax:</strong> ${AHP_DATA.lambdaMax}</p>
        <p><strong>CI:</strong> ${AHP_DATA.ci}</p>
        <p><strong>CR:</strong> ${AHP_DATA.cr}</p>
        <p><strong>Status:</strong> ${AHP_DATA.isConsistent ? "✔ Konsisten" : "✖ Tidak Konsisten"}</p>
    `;

    document.getElementById("ahpDetailBody").innerHTML = html;
    document.getElementById("ahpModal").style.display = "block";
}

/* =====================================================
 * GENERATE TABLE HELPER
 * ===================================================== */
function generateTable(matrix, headers = null) {
    let html = "<table class='matrix-table'>";

    if (headers) {
        html += "<thead><tr><th></th>";
        headers.forEach(h => html += `<th>${h}</th>`);
        html += "</tr></thead>";
    }

    html += "<tbody>";
    matrix.forEach((row, i) => {
        html += "<tr>";
        if (headers) html += `<th>${headers[i]}</th>`;
        row.forEach(val => html += `<td>${val}</td>`);
        html += "</tr>";
    });
    html += "</tbody></table>";

    return html;
}

/* =====================================================
 * 8. RESET FORM
 * ===================================================== */
function resetForm() {
    document.getElementById('hasilSection').style.display = 'none';

    hasilData = null;
    AHP_DATA = null;

    const n = kriteriaData.length;
    const expected = (n * (n - 1)) / 2;

    for (let i = 0; i < expected; i++) {
        document.getElementById(`rating_${i}`).value = 5;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* =====================================================
 * 9. MODAL HANDLERS
 * ===================================================== */
function closeModal() {
    document.getElementById('detailModal').style.display = 'none';
}

function closeAHPModal() {
    document.getElementById("ahpModal").style.display = "none";
}

window.onclick = function (event) {
    if (event.target === document.getElementById('detailModal')) closeModal();
    if (event.target === document.getElementById('ahpModal')) closeAHPModal();
};
