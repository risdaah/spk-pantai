// DataPantai.js - VERSI LENGKAP & FIXED

// ===== KONFIGURASI API =====
const API_BASE = 'http://localhost:5000/api/spk';
const API_SUMMARY_URL = `${API_BASE}/detail-pantai/summary`;
const API_PANTAI_URL = `${API_BASE}/pantai`;
const API_TAMBAH_PANTAI_URL = `${API_BASE}/pantai/with-detail`;
const API_DELETE_PANTAI_URL = `${API_BASE}/pantai`;
const API_SUBKRITERIA_URL = `${API_BASE}/data/sub-kriteria`;

// Data global
let fasilitasOptions = [];
let kondisiJalanOptions = [];
let allPantaiData = [];

// Variable untuk tracking mode edit
let isEditMode = false;
let currentEditId = null;

// ===== INIT: Load saat halaman dimuat =====
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ Page loaded!');
  loadData();
  loadFasilitasOptions();
  loadKondisiJalanOptions();
});

// ===== LOAD DATA PANTAI =====
async function loadData() {
  console.log('📥 Loading data from:', API_SUMMARY_URL);
  
  try {
    const response = await fetch(API_SUMMARY_URL);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('API result:', result);
    
    if (result.success && result.data) {
      allPantaiData = result.data;
      console.log(`✅ Loaded ${result.data.length} pantai`);
      renderTable(result.data);
    } else {
      console.warn('No data or error:', result);
      showError('Tidak ada data atau terjadi kesalahan');
    }
  } catch (error) {
    console.error('❌ Error loading data:', error);
    showError('Error: ' + error.message);
  }
}

// ===== RENDER TABLE =====
function renderTable(pantaiList) {
  console.log('🎨 Rendering table with', pantaiList ? pantaiList.length : 0, 'items');
  
  const tbody = document.getElementById('tableBody');
  const totalData = document.getElementById('totalData');
  
  if (!tbody) {
    console.error('❌ tableBody element not found!');
    return;
  }
  
  tbody.innerHTML = '';
  
  if (!pantaiList || pantaiList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center py-4">
          <div class="text-muted">
            <i class="bi bi-inbox" style="font-size: 2rem;"></i>
            <p class="mt-2">Belum ada data pantai</p>
            <small>Klik tombol "Tambah Data Pantai" untuk menambah data baru</small>
          </div>
        </td>
      </tr>
    `;
    if (totalData) totalData.textContent = '0';
    return;
  }
  
  if (totalData) totalData.textContent = pantaiList.length;
  
  pantaiList.forEach((p, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-center">${index + 1}</td>
      <td><strong>${p.nama_pantai || '-'}</strong></td>
      <td>${p.provinsi || '-'}</td>
      <td>${p.HTM || '-'}</td>
      <td>${p.RRHM || '-'}</td>
      <td class="text-center">${p.RGM || '-'}</td>
      <td class="kriteria-text"><small>${p.fasilitas_umum || '-'}</small></td>
      <td class="kriteria-text"><small>${p.kondisi_jalan || '-'}</small></td>
      <td class="text-center">
        <button class="btn btn-sm btn-warning me-1" onclick="editPantai(${p.id_pantai})" title="Edit">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="deletePantai(${p.id_pantai}, '${escapeQuotes(p.nama_pantai)}')" title="Hapus">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  console.log('✅ Table rendered successfully');
}

// ===== SHOW ERROR =====
function showError(message) {
  const tbody = document.getElementById('tableBody');
  if (!tbody) return;
  
  tbody.innerHTML = `
    <tr>
      <td colspan="9" class="text-center py-4 text-danger">
        <i class="bi bi-exclamation-triangle" style="font-size: 2rem;"></i>
        <p class="mt-2">${message}</p>
        <small>Pastikan server backend berjalan di http://localhost:5000</small>
      </td>
    </tr>
  `;
}

// ===== ESCAPE QUOTES =====
function escapeQuotes(str) {
  if (!str) return '';
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ===== EDIT PANTAI (FUNGSI LENGKAP) =====
async function editPantai(id) {
  console.log('✏️ Edit pantai ID:', id);
  
  try {
    const url = `${API_PANTAI_URL}/${id}`;
    console.log('Fetching from:', url);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Data pantai:', result);
    
    if (!result.success || !result.data) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memuat Data',
        text: result.message || 'Unknown error'
      });
      return;
    }
    
    const pantai = result.data;
    
    // Set mode edit
    isEditMode = true;
    currentEditId = id;
    
    // Ubah judul modal
    document.getElementById('modalTitle').textContent = 'Edit Data Pantai';
    
    // Isi form dengan data yang ada
    document.getElementById('namaPantai').value = pantai.nama_pantai || '';
    document.getElementById('provinsi').value = pantai.provinsi || '';
    
    // Parse harga (hapus "Rp", ".", ",", dan spasi)
    const htmValue = pantai.HTM ? parseInt(pantai.HTM.replace(/[^\d]/g, '')) : 0;
    const rrhmValue = pantai.RRHM ? parseInt(pantai.RRHM.replace(/[^\d]/g, '')) : 0;
    
    console.log('Parsed HTM:', htmValue, 'RRHM:', rrhmValue);
    
    document.getElementById('HTM').value = htmValue || '';
    document.getElementById('RRHM').value = rrhmValue || '';
    document.getElementById('RGM').value = pantai.RGM || '';
    
    // Uncheck semua checkbox dulu
    document.querySelectorAll('input[name="fasilitas"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[name="kondisi"]').forEach(cb => cb.checked = false);
    
    // Check fasilitas yang sesuai
    if (pantai.KFU) {
      const fasilitasList = pantai.KFU.split(',').map(f => f.trim());
      console.log('Fasilitas dari DB:', fasilitasList);
      
      document.querySelectorAll('input[name="fasilitas"]').forEach(cb => {
        // Cek apakah checkbox value ada di list
        const isMatched = fasilitasList.some(f => 
          f.toLowerCase().includes(cb.value.toLowerCase()) || 
          cb.value.toLowerCase().includes(f.toLowerCase())
        );
        if (isMatched) {
          cb.checked = true;
          console.log('✅ Checked:', cb.value);
        }
      });
    }
    
    // Check kondisi jalan yang sesuai
    if (pantai.KJ) {
      const kondisiList = pantai.KJ.split(',').map(k => k.trim());
      console.log('Kondisi jalan dari DB:', kondisiList);
      
      document.querySelectorAll('input[name="kondisi"]').forEach(cb => {
        const isMatched = kondisiList.some(k => 
          k.toLowerCase().includes(cb.value.toLowerCase()) || 
          cb.value.toLowerCase().includes(k.toLowerCase())
        );
        if (isMatched) {
          cb.checked = true;
          console.log('✅ Checked:', cb.value);
        }
      });
    }
    
    // Buka modal
    const modal = new bootstrap.Modal(document.getElementById('modalPantai'));
    modal.show();
    
  } catch (error) {
    console.error('❌ Error loading pantai data:', error);
    Swal.fire({
      icon: 'error',
      title: 'Terjadi Kesalahan',
      text: error.message
    });
  }
}

// ===== LOAD FASILITAS OPTIONS =====
async function loadFasilitasOptions() {
  try {
    const response = await fetch(`${API_SUBKRITERIA_URL}/3`);
    const result = await response.json();
    
    if (result.success && result.data) {
      fasilitasOptions = result.data;
      renderFasilitasCheckbox();
      console.log('✅ Loaded', fasilitasOptions.length, 'fasilitas options');
    }
  } catch (error) {
    console.error('Error loading fasilitas:', error);
  }
}

// ===== LOAD KONDISI JALAN OPTIONS =====
async function loadKondisiJalanOptions() {
  try {
    const response = await fetch(`${API_SUBKRITERIA_URL}/4`);
    const result = await response.json();
    
    if (result.success && result.data) {
      kondisiJalanOptions = result.data;
      renderKondisiJalanCheckbox();
      console.log('✅ Loaded', kondisiJalanOptions.length, 'kondisi jalan options');
    }
  } catch (error) {
    console.error('Error loading kondisi jalan:', error);
  }
}

// ===== RENDER FASILITAS CHECKBOX =====
function renderFasilitasCheckbox() {
  const container = document.getElementById('fasilitasContainer');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (fasilitasOptions.length === 0) {
    container.innerHTML = '<p class="text-muted">Tidak ada data</p>';
    return;
  }
  
  fasilitasOptions.forEach(item => {
    const div = document.createElement('div');
    div.className = 'form-check';
    div.innerHTML = `
      <input class="form-check-input" type="checkbox" value="${item.label}" name="fasilitas" id="fas_${item.id_sub_kriteria}">
      <label class="form-check-label" for="fas_${item.id_sub_kriteria}">
        ${item.label}
      </label>
    `;
    container.appendChild(div);
  });
}

// ===== RENDER KONDISI JALAN CHECKBOX =====
function renderKondisiJalanCheckbox() {
  const container = document.getElementById('kondisiJalanContainer');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (kondisiJalanOptions.length === 0) {
    container.innerHTML = '<p class="text-muted">Tidak ada data</p>';
    return;
  }
  
  kondisiJalanOptions.forEach(item => {
    const div = document.createElement('div');
    div.className = 'form-check';
    div.innerHTML = `
      <input class="form-check-input" type="checkbox" value="${item.label}" name="kondisi" id="kondisi_${item.id_sub_kriteria}">
      <label class="form-check-label" for="kondisi_${item.id_sub_kriteria}">
        ${item.label}
      </label>
    `;
    container.appendChild(div);
  });
}

// ===== MODAL FUNCTIONS =====
function openAddModal() {
  // Reset mode
  isEditMode = false;
  currentEditId = null;
  
  document.getElementById('modalTitle').textContent = 'Tambah Data Pantai';
  document.getElementById('pantaiForm').reset();
  
  // Uncheck all checkboxes
  document.querySelectorAll('input[name="fasilitas"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('input[name="kondisi"]').forEach(cb => cb.checked = false);
  
  const modal = new bootstrap.Modal(document.getElementById('modalPantai'));
  modal.show();
}

function closeModal() {
  const modalEl = document.getElementById('modalPantai');
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();
  
  // Reset mode
  isEditMode = false;
  currentEditId = null;
}

// ===== SAVE DATA (Support ADD & EDIT) =====
async function handleSave(event) {
  event.preventDefault();
  
  console.log('💾 Saving data... Mode:', isEditMode ? 'EDIT' : 'ADD');
  
  const formData = {
    nama_pantai: document.getElementById('namaPantai').value.trim(),
    provinsi: document.getElementById('provinsi').value.trim(),
    HTM: parseInt(document.getElementById('HTM').value) || 0,
    RRHM: parseInt(document.getElementById('RRHM').value) || 0,
    RGM: parseFloat(document.getElementById('RGM').value) || 0,
    fasilitas_umum: Array.from(document.querySelectorAll('input[name="fasilitas"]:checked'))
      .map(cb => cb.value),
    kondisi_jalan: Array.from(document.querySelectorAll('input[name="kondisi"]:checked'))
      .map(cb => cb.value)
  };
  
  console.log('Form data:', formData);
  
  if (!formData.nama_pantai || !formData.provinsi) {
    Swal.fire({
      icon: 'warning',
      title: 'Validasi Gagal',
      text: 'Nama pantai dan provinsi harus diisi!'
    });
    return;
  }

  try {
    let response;
    
    if (isEditMode && currentEditId) {
      // MODE UPDATE
      console.log('Updating pantai ID:', currentEditId);
      response = await fetch(`${API_PANTAI_URL}/${currentEditId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
    } else {
      // MODE CREATE
      console.log('Creating new pantai');
      response = await fetch(API_TAMBAH_PANTAI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
    }

    const result = await response.json();
    console.log('Save response:', result);
    
    if (result.success) {
      Swal.fire({
        icon: 'success',
        title: isEditMode ? 'Data Berhasil Diupdate' : 'Data Berhasil Ditambahkan',
        text: isEditMode ? 'Data pantai telah berhasil diupdate!' : 'Data pantai telah berhasil ditambahkan!'
      });
      closeModal();
      loadData();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan Data',
        text: result.message
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

// ===== DELETE =====
async function deletePantai(id, nama) {
  const result = await Swal.fire({
    title: 'Konfirmasi Hapus',
    text: `Apakah Anda yakin ingin menghapus pantai "${nama}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal'
  });

  if (!result.isConfirmed) return;

  try {
    const response = await fetch(`${API_DELETE_PANTAI_URL}/${id}`, {
      method: 'DELETE'
    });

    const responseResult = await response.json();

    if (responseResult.success) {
      Swal.fire({
        icon: 'success',
        title: 'Data Berhasil Dihapus',
        text: 'Data pantai telah berhasil dihapus!'
      });
      loadData();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menghapus Data',
        text: responseResult.message
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

// ===== SEARCH =====
function handleSearch() {
  const keyword = document.getElementById('searchInput').value.toLowerCase();
  
  if (!keyword) {
    renderTable(allPantaiData);
    return;
  }
  
  const filtered = allPantaiData.filter(p => {
    return (
      (p.nama_pantai && p.nama_pantai.toLowerCase().includes(keyword)) ||
      (p.provinsi && p.provinsi.toLowerCase().includes(keyword))
    );
  });
  
  renderTable(filtered);
}

console.log('✅ DataPantai.js loaded');
