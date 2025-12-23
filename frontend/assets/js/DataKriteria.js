// DataPantai.js

// Endpoint utama
const API_SUMMARY_URL = 'http://localhost:5000/api/spk/detail-pantai/summary';
const API_TAMBAH_PANTAI_URL = 'http://localhost:5000/api/spk/pantai/with-detail';
// Endpoint helper subkriteria (sesuaikan dengan helperRoutes kamu)
const API_SUBKRITERIA_URL = 'http://localhost:5000/api/spk/data/sub-kriteria';

// ------- TABEL RINGKASAN -------

function renderTable(pantaiList) {
  const tbody = document.getElementById('tableBody');
  const totalData = document.getElementById('totalData');
  const tableWrapper = document.getElementById('tableWrapper');

  tbody.innerHTML = '';

  pantaiList.forEach((p, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <th scope="row">${index + 1}</th>
      <td>${p.provinsi}</td>
      <td>${p.nama_pantai}</td>
      <td class="text-center">
        <div class="d-inline-flex gap-1">
          <button class="btn btn-sm btn-warning" onclick="editRow(${p.id_pantai})">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteRow(${p.id_pantai})">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  totalData.textContent = `Total pantai: ${pantaiList.length}`;
  totalData.classList.remove('d-none');
  tableWrapper.classList.remove('d-none');
}

function showLoading(show) {
  const loading = document.getElementById('loading');
  if (show) loading.classList.remove('d-none');
  else loading.classList.add('d-none');
}

function showError(message) {
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = message;
  errorDiv.classList.remove('d-none');
}

async function loadDataPantai() {
  showLoading(true);
  document.getElementById('error').classList.add('d-none');
  document.getElementById('tableWrapper').classList.add('d-none');

  try {
    const res = await fetch(API_SUMMARY_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();

    if (!json.success || !json.data) {
      throw new Error(json.message || 'Format data tidak sesuai');
    }

    let pantaiList = json.data;
    // Backend kamu saat ini mengirim [ [ {...}, {...} ] ]
    if (Array.isArray(pantaiList) && Array.isArray(pantaiList[0])) {
      pantaiList = pantaiList[0];
    }
    if (!Array.isArray(pantaiList)) {
      throw new Error('Format data tidak sesuai (bukan array)');
    }

    renderTable(pantaiList);
  } catch (err) {
    console.error(err);
    showError(`Gagal memuat data. ${err.message}. Cek API di ${API_SUMMARY_URL}`);
  } finally {
    showLoading(false);
  }
}

// ------- SUBKRITERIA UNTUK CHECKLIST (Kriteria 3 & 4) -------

async function fetchSubkriteria(idKriteria) {
  // gunakan path /sub-kriteria/:id_kriteria
  const url = `${API_SUBKRITERIA_URL}/${idKriteria}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Gagal load subkriteria kriteria ${idKriteria} (HTTP ${res.status})`);
  }
  const json = await res.json();
  if (!json.success || !Array.isArray(json.data)) {
    throw new Error(json.message || `Format subkriteria kriteria ${idKriteria} tidak sesuai`);
  }
  return json.data;
}

function populateChecklist(containerEl, items, namePrefix) {
  if (!containerEl) throw new Error('Elemen checklist tidak ditemukan di HTML');
  containerEl.innerHTML = '';
  items.forEach(item => {
    const id = `${namePrefix}_${item.id_sub_kriteria}`;
    const div = document.createElement('div');
    div.className = 'form-check';
    div.innerHTML = `
      <input class="form-check-input" type="checkbox" value="${item.id_sub_kriteria}" id="${id}">
      <label class="form-check-label" for="${id}">
        ${item.label}
      </label>
    `;
    containerEl.appendChild(div);
  });
}

async function loadSubkriteriaForForm() {
  try {
    // 3 = Fasilitas (checklist), 4 = Jalan (checklist)
    const [fasilitasList, jalanList] = await Promise.all([
      fetchSubkriteria(3),
      fetchSubkriteria(4),
    ]);

    const elFasilitas = document.getElementById('checklistFasilitas');
    const elJalan = document.getElementById('checklistJalan');

    populateChecklist(elFasilitas, fasilitasList, 'fasilitas');
    populateChecklist(elJalan, jalanList, 'jalan');
  } catch (err) {
    console.error(err);
    const formError = document.getElementById('formError');
    if (formError) {
      formError.textContent = `Gagal memuat pilihan checklist: ${err.message}`;
      formError.classList.remove('d-none');
    }
  }
}

// ------- FORM TAMBAH PANTAI -------

function getCheckedValues(containerEl) {
  const values = [];
  if (!containerEl) return values;
  containerEl.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
    values.push(parseInt(cb.value, 10));
  });
  return values;
}

async function handleSubmitPantai(event) {
  event.preventDefault();
  const btn = document.getElementById('btnSimpanPantai');
  const formError = document.getElementById('formError');
  formError.classList.add('d-none');
  formError.textContent = '';

  const namaPantai = document.getElementById('inputNamaPantai').value.trim();
  const provinsi = document.getElementById('inputProvinsi').value.trim();
  const HTM = document.getElementById('inputHTM').value.trim();
  const RRHM = document.getElementById('inputRRHM').value.trim();
  const RGM = document.getElementById('inputRGM').value.trim();

  const fasilitasIds = getCheckedValues(document.getElementById('checklistFasilitas'));
  const jalanIds = getCheckedValues(document.getElementById('checklistJalan'));

  if (!namaPantai || !provinsi || !HTM || !RRHM || !RGM) {
    formError.textContent = 'Nama pantai, provinsi, HTM, RRHM, dan Rating wajib diisi.';
    formError.classList.remove('d-none');
    return;
  }

  const payload = {
    namapantai: namaPantai,
    provinsi: provinsi,
    HTM,
    RRHM,
    RGM: parseFloat(RGM),
    fasilitasUmumIds: fasilitasIds,   // kriteria 3
    kondisiJalanIds: jalanIds         // kriteria 4
    // jika backend butuh id_sub_kriteria untuk range, nanti bisa ditambah
  };

  try {
    btn.disabled = true;
    btn.textContent = 'Menyimpan...';

    const res = await fetch(API_TAMBAH_PANTAI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || `HTTP ${res.status}`);
    }

    // Tutup modal
    const modalEl = document.getElementById('modalTambahPantai');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();

    // Reset form
    event.target.reset();
    document
      .getElementById('checklistFasilitas')
      .querySelectorAll('input[type="checkbox"]')
      .forEach(cb => (cb.checked = false));
    document
      .getElementById('checklistJalan')
      .querySelectorAll('input[type="checkbox"]')
      .forEach(cb => (cb.checked = false));

    // Reload tabel
    await loadDataPantai();
  } catch (err) {
    console.error(err);
    formError.textContent = `Gagal menyimpan data pantai: ${err.message}`;
    formError.classList.remove('d-none');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Simpan';
  }
}

// ------- INIT -------

function initEvents() {
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadDataPantai();
    });
  }

  const formTambah = document.getElementById('formTambahPantai');
  if (formTambah) {
    formTambah.addEventListener('submit', handleSubmitPantai);
  }

  const modalEl = document.getElementById('modalTambahPantai');
  if (modalEl) {
    modalEl.addEventListener('show.bs.modal', () => {
      loadSubkriteriaForForm();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initEvents();
  loadDataPantai();
});
