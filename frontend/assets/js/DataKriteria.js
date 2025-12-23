// DataKriteria.js - VERSI LENGKAP CRUD

// ===== KONFIGURASI API =====
const API_BASE = 'http://localhost:5000/api/spk';
const API_KRITERIA_URL = `${API_BASE}/kriteria/kriteria-semua`;
const API_KRITERIA_SINGLE_URL = `${API_BASE}/kriteria`;

// Data global
let allKriteriaData = [];
let isEditMode = false;
let currentEditId = null;
let subKriteriaCounter = 0;

// DOM elements
const tbody = document.getElementById('tableBody');
const totalKriteriaEl = document.getElementById('totalKriteria');

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ DataKriteria.js loaded');
  loadKriteria();
});

// ===== ESCAPE QUOTES =====
function escapeQuotes(str) {
  if (!str) return '';
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ===== LOAD KRITERIA =====
async function loadKriteria() {
  console.log('📥 Loading kriteria...');
  
  try {
    // Show loading
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2 text-muted">Memuat data kriteria...</p>
        </td>
      </tr>
    `;

    const res = await fetch(API_KRITERIA_URL);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const json = await res.json();
    console.log('API response:', json);

    if (!json.status) {
      throw new Error(json.message || 'Gagal memuat data');
    }

    const data = json.data || [];
    allKriteriaData = data;
    
    // Update total
    if (totalKriteriaEl) {
      totalKriteriaEl.textContent = data.length;
    }

    // Clear tbody
    tbody.innerHTML = '';

    // Render
    if (data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-muted">
            <i class="bi bi-inbox" style="font-size: 2rem;"></i>
            <p class="mt-2">Belum ada data kriteria</p>
            <small>Klik tombol "Tambah Data Kriteria" untuk menambah data baru</small>
          </td>
        </tr>
      `;
    } else {
      data.forEach((k, i) => {
        const row = renderRow(k, i);
        tbody.appendChild(row);
      });
    }

    console.log('✅ Kriteria loaded:', data.length);

  } catch (err) {
    console.error('❌ Error:', err);
    
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4 text-danger">
          <i class="bi bi-exclamation-triangle" style="font-size: 2rem;"></i>
          <p class="mt-2"><strong>Error:</strong> ${err.message}</p>
          <small>Pastikan server backend berjalan di http://localhost:5000</small>
        </td>
      </tr>
    `;
  }
}

// ===== RENDER ROW =====
function renderRow(kriteria, index) {
  const tr = document.createElement('tr');

  // Bangun list sub_kriteria
  let subListHtml = '';
  if (Array.isArray(kriteria.sub_kriteria) && kriteria.sub_kriteria.length > 0) {
    subListHtml = `
      <ul class="subkriteria-list mb-0">
        ${kriteria.sub_kriteria
          .map((sk) => {
            if (kriteria.tipe_penilaian === 'range') {
              return `<li>
                <strong>${sk.label ?? ''}</strong>
                (${sk.range_min} - ${sk.range_max}) → Skor: ${sk.nilai_skor}
              </li>`;
            }
            return `<li>${sk.label} → Skor: ${sk.nilai_skor}</li>`;
          })
          .join('')}
      </ul>
    `;
  } else {
    subListHtml = '<span class="text-muted">Belum ada sub-kriteria</span>';
  }

  // Badges
  const jenisBadge = kriteria.jenis_kriteria === 'benefit' 
    ? '<span class="badge bg-success">Benefit</span>' 
    : '<span class="badge bg-danger">Cost</span>';

  const tipeBadge = kriteria.tipe_penilaian === 'range' 
    ? '<span>Range</span>' 
    : '<span>Checklist</span>';

  tr.innerHTML = `
    <td class="text-center">${index + 1}</td>
    <td class="kriteria-text"><strong>${kriteria.nama_kriteria}</strong></td>
    <td>${jenisBadge}</td>
    <td>${tipeBadge}</td>
    <td>${subListHtml}</td>
    <td class="text-center">
      <button class="btn btn-sm btn-warning me-1"
              onclick="editKriteria(${kriteria.id_kriteria})"
              title="Edit">
        <i class="bi bi-pencil"></i> Edit
      </button>
      <!-- <button class="btn btn-sm btn-danger"
              onclick="deleteKriteria(${kriteria.id_kriteria}, '${escapeQuotes(kriteria.nama_kriteria)}')"
              title="Hapus">
        <i class="bi bi-trash"></i> Hapus
      </button> -->
    </td>
  `;

  return tr;
}

// ===== OPEN ADD MODAL =====
function openAddModal() {
  console.log('➕ Open Add Modal');
  
  // Reset mode
  isEditMode = false;
  currentEditId = null;
  subKriteriaCounter = 0;
  
  // Reset form
  document.getElementById('kriteriaForm').reset();
  document.getElementById('modalTitle').textContent = 'Tambah Data Kriteria';
  document.getElementById('subKriteriaContainer').innerHTML = '<p class="text-muted text-center">Pilih tipe penilaian terlebih dahulu</p>';
  
  // Open modal
  const modal = new bootstrap.Modal(document.getElementById('modalKriteria'));
  modal.show();
}

// ===== EDIT KRITERIA =====
async function editKriteria(id) {
  console.log('✏️ Edit kriteria ID:', id);
  
  try {
    const response = await fetch(`${API_KRITERIA_SINGLE_URL}/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Data kriteria:', result);
    
    if (!result.status || !result.data) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memuat Data',
        text: result.message || 'Unknown error'
      });
      return;
    }
    
    const kriteria = result.data;
    
    // Set mode edit
    isEditMode = true;
    currentEditId = id;
    subKriteriaCounter = 0;
    
    // Set form values
    document.getElementById('modalTitle').textContent = 'Edit Data Kriteria';
    document.getElementById('namaKriteria').value = kriteria.nama_kriteria || '';
    document.getElementById('jenisKriteria').value = kriteria.jenis_kriteria || '';
    document.getElementById('tipePenilaian').value = kriteria.tipe_penilaian || '';
    
    // Populate sub-kriteria
    const container = document.getElementById('subKriteriaContainer');
    container.innerHTML = '';
    
    if (kriteria.sub_kriteria && kriteria.sub_kriteria.length > 0) {
      kriteria.sub_kriteria.forEach(sub => {
        addSubKriteriaRow(sub, kriteria.tipe_penilaian);
      });
    } else {
      container.innerHTML = '<p class="text-muted text-center">Tidak ada sub-kriteria</p>';
    }
    
    // Open modal
    const modal = new bootstrap.Modal(document.getElementById('modalKriteria'));
    modal.show();
    
  } catch (error) {
    console.error('Error loading kriteria:', error);
    Swal.fire({
      icon: 'error',
      title: 'Terjadi Kesalahan',
      text: error.message
    });
  }
}

// ===== DELETE KRITERIA =====
async function deleteKriteria(id, nama) {
  console.log('🗑️ Delete kriteria ID:', id);

  const result = await Swal.fire({
    title: 'Hapus Kriteria?',
    text: `Hapus kriteria "${nama}"?\n\n⚠️ Peringatan: Semua sub-kriteria dan data terkait akan ikut terhapus!`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal'
  });

  if (!result.isConfirmed) {
    return;
  }

  try {
    const response = await fetch(`${API_KRITERIA_SINGLE_URL}/${id}`, {
      method: 'DELETE'
    });

    const deleteResult = await response.json();
    console.log('Delete response:', deleteResult);

    if (deleteResult.status || deleteResult.success) {
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Kriteria berhasil dihapus!'
      });
      loadKriteria();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menghapus',
        text: deleteResult.message || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Terjadi Kesalahan',
      text: error.message
    });
  }
}

// ===== HANDLE TIPE CHANGE =====
function handleTipeChange() {
  const tipe = document.getElementById('tipePenilaian').value;
  const container = document.getElementById('subKriteriaContainer');
  
  console.log('Tipe changed to:', tipe);
  
  if (!tipe) {
    container.innerHTML = '<p class="text-muted text-center">Pilih tipe penilaian terlebih dahulu</p>';
    return;
  }
  
  // Clear existing
  subKriteriaCounter = 0;
  container.innerHTML = '<p class="text-muted text-center">Klik tombol "Tambah Sub-Kriteria" untuk menambah data</p>';
}

// ===== ADD SUB-KRITERIA =====
function addSubKriteria() {
  const tipe = document.getElementById('tipePenilaian').value;
  
  if (!tipe) {
    alert('❌ Pilih tipe penilaian terlebih dahulu!');
    return;
  }
  
  addSubKriteriaRow(null, tipe);
}

// ===== ADD SUB-KRITERIA ROW =====
function addSubKriteriaRow(data = null, tipe = null) {
  if (!tipe) {
    tipe = document.getElementById('tipePenilaian').value;
  }
  
  const container = document.getElementById('subKriteriaContainer');
  
  // Clear placeholder text if first item
  if (subKriteriaCounter === 0) {
    container.innerHTML = '';
  }
  
  const rowId = `sub_${subKriteriaCounter++}`;
  const div = document.createElement('div');
  div.className = 'card mb-2';
  div.id = rowId;
  
  if (tipe === 'range') {
    // RANGE: Label, Range Min, Range Max, Skor
    div.innerHTML = `
      <div class="card-body p-3">
        <div class="row g-2">
          <div class="col-md-3">
            <label class="form-label small">Label <span class="text-danger">*</span></label>
            <input type="text" class="form-control form-control-sm sub-label" 
                   placeholder="Contoh: Sangat Murah" 
                   value="${data?.label || ''}" required />
          </div>
          <div class="col-md-2">
            <label class="form-label small">Min <span class="text-danger">*</span></label>
            <input type="number" class="form-control form-control-sm sub-range-min" 
                   placeholder="0" 
                   value="${data?.range_min || ''}" required />
          </div>
          <div class="col-md-2">
            <label class="form-label small">Max <span class="text-danger">*</span></label>
            <input type="number" class="form-control form-control-sm sub-range-max" 
                   placeholder="10000" 
                   value="${data?.range_max || ''}" required />
          </div>
          <div class="col-md-2">
            <label class="form-label small">Skor <span class="text-danger">*</span></label>
            <input type="number" step="0.1" class="form-control form-control-sm sub-nilai-skor" 
                   placeholder="5" 
                   value="${data?.nilai_skor || ''}" required />
          </div>
          <div class="col-md-3 d-flex align-items-end">
            <button type="button" class="btn btn-sm btn-danger w-100" onclick="removeSubKriteria('${rowId}')">
              <i class="bi bi-trash"></i> Hapus
            </button>
          </div>
        </div>
      </div>
    `;
  } else {
    // CHECKLIST: Label, Skor
    div.innerHTML = `
      <div class="card-body p-3">
        <div class="row g-2">
          <div class="col-md-6">
            <label class="form-label small">Label <span class="text-danger">*</span></label>
            <input type="text" class="form-control form-control-sm sub-label" 
                   placeholder="Contoh: Toilet" 
                   value="${data?.label || ''}" required />
          </div>
          <div class="col-md-3">
            <label class="form-label small">Skor <span class="text-danger">*</span></label>
            <input type="number" step="0.1" class="form-control form-control-sm sub-nilai-skor" 
                   placeholder="1" 
                   value="${data?.nilai_skor || ''}" required />
          </div>
          <div class="col-md-3 d-flex align-items-end">
            <button type="button" class="btn btn-sm btn-danger w-100" onclick="removeSubKriteria('${rowId}')">
              <i class="bi bi-trash"></i> Hapus
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  container.appendChild(div);
}

// ===== REMOVE SUB-KRITERIA =====
function removeSubKriteria(rowId) {
  const element = document.getElementById(rowId);
  if (element) {
    element.remove();
  }
  
  // Check if empty
  const container = document.getElementById('subKriteriaContainer');
  if (container.children.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">Klik tombol "Tambah Sub-Kriteria" untuk menambah data</p>';
  }
}

// ===== HANDLE SAVE =====
async function handleSave(event) {
  event.preventDefault();
  
  console.log('💾 Saving... Mode:', isEditMode ? 'EDIT' : 'ADD');
  
  // Get form data
  const nama_kriteria = document.getElementById('namaKriteria').value.trim();
  const jenis_kriteria = document.getElementById('jenisKriteria').value;
  const tipe_penilaian = document.getElementById('tipePenilaian').value;
  
  // Validate
  if (!nama_kriteria || !jenis_kriteria || !tipe_penilaian) {
    Swal.fire({
      icon: 'error',
      title: 'Validasi Gagal',
      text: 'Semua field wajib diisi!'
    });
    return;
  }
  
  // Get sub-kriteria
  const container = document.getElementById('subKriteriaContainer');
  const subCards = container.querySelectorAll('.card');
  
  const sub_kriteria = [];
  
  for (let card of subCards) {
    const label = card.querySelector('.sub-label')?.value.trim();
    const nilai_skor = parseFloat(card.querySelector('.sub-nilai-skor')?.value);
    
    if (!label || !nilai_skor) {
      Swal.fire({
        icon: 'error',
        title: 'Validasi Gagal',
        text: 'Semua sub-kriteria harus diisi lengkap!'
      });
      return;
    }
    
    const subData = {
      label,
      nilai_skor
    };
    
    // Jika range, tambahkan range_min dan range_max
    if (tipe_penilaian === 'range') {
      const range_min = parseFloat(card.querySelector('.sub-range-min')?.value);
      const range_max = parseFloat(card.querySelector('.sub-range-max')?.value);
      
      if (isNaN(range_min) || isNaN(range_max)) {
        Swal.fire({
          icon: 'error',
          title: 'Validasi Gagal',
          text: 'Range min dan max harus diisi!'
        });
        return;
      }
      
      subData.range_min = range_min;
      subData.range_max = range_max;
    }
    
    sub_kriteria.push(subData);
  }
  
  if (sub_kriteria.length === 0) {
    Swal.fire({
      icon: 'error',
      title: 'Validasi Gagal',
      text: 'Minimal harus ada 1 sub-kriteria!'
    });
    return;
  }
  
  const formData = {
    nama_kriteria,
    jenis_kriteria,
    tipe_penilaian,
    sub_kriteria
  };
  
  console.log('Form data:', formData);
  
  try {
    let response;
    
    if (isEditMode && currentEditId) {
      // UPDATE
      response = await fetch(`${API_KRITERIA_SINGLE_URL}/${currentEditId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
    } else {
      // CREATE
      response = await fetch(API_KRITERIA_SINGLE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
    }
    
    const result = await response.json();
    console.log('Save response:', result);
    
    if (result.status || result.success) {
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: isEditMode ? 'Kriteria berhasil diupdate!' : 'Kriteria berhasil ditambahkan!'
      });
      closeModal();
      loadKriteria();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: result.message || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Terjadi Kesalahan',
      text: error.message
    });
  }
}

// ===== CLOSE MODAL =====
function closeModal() {
  const modalEl = document.getElementById('modalKriteria');
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();
  
  // Reset
  isEditMode = false;
  currentEditId = null;
  subKriteriaCounter = 0;
}

console.log('✅ DataKriteria.js loaded');
