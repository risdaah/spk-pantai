# 🌊 Wavercision - Sistem Pendukung Keputusan Destinasi Pantai Terbaik di Pulau Jawa, Indonesia

**Wavercision** adalah aplikasi web Sistem Pendukung Keputusan (SPK) yang membantu wisatawan menemukan destinasi pantai terbaik di Pulau Jawa berdasarkan preferensi pribadi menggunakan metode **AHP (Analytical Hierarchy Process)** dan **SAW (Simple Additive Weighting)**.

## 🎯 Fitur Utama

- ✅ **Manajemen Data Pantai** - CRUD data destinasi pantai dengan lengkap
- ✅ **Manajemen Kriteria** - Edit data Kriteria untuk menyesuaikan dengan kondisi lapangan.
- ✅ **Perhitungan AHP** - Bobot kriteria berdasarkan tingkat kepentingan pengguna
- ✅ **Ranking SAW** - Peringkat 10 pantai terbaik berdasarkan skor akhir
- ✅ **Validasi Konsistensi** - Consistency Ratio (CR) untuk memastikan input valid
- ✅ **Detail Perhitungan** - Transparansi proses perhitungan dengan matriks lengkap

## 📊 Metodologi

### **Kriteria Penilaian:**
1. **Harga Tiket Masuk** - Cost
2. **Rata-Rata Harga Makanan** - Cost
3. **Ketersediaan Fasilitas Umum** - Benefit
4. **Kondisi Jalan** - Benefit
5. **Rating Google Maps** - Benefit

### **Metode Perhitungan:**
- **AHP**: Menentukan bobot kriteria berdasarkan perbandingan berpasangan dengan validasi CR < 0.1
- **SAW**: Menghitung skor akhir setiap alternatif dengan normalisasi nilai

## 🛠️ Teknologi yang Digunakan

### **Frontend:**
- HTML5 + CSS3
- JavaScript (ES6+)
- Bootstrap 5.3.0
- Bootstrap Icons
- SweetAlert2 (Alert interaktif)

### **Backend:**
- Node.js + Express.js
- MySQL Database
- Custom SPK Helper Library

### **Utilities:**
- SPKHelper (AHP & SAW calculations)
- Database connection handler

## 📂 Struktur Folder
wavercision/
├── backend/
│ ├── config/
│ │ └── database.js
│ ├── controllers/
│ │ ├── pantaiController.js
│ │ ├── kriteriaController.js
│ │ ├── spkController.js
│ │ └── detailPantaiController.js
│ ├── models/
│ │ ├── pantaiModel.js
│ │ ├── kriteriaModel.js
│ │ └── detailPantaiModel.js
│ ├── routes/
│ │ ├── pantaiRoutes.js
│ │ ├── kriteriaRoutes.js
│ │ ├── spkRoutes.js
│ │ └── helperRoutes.js
│ ├── utils/
│ │ └── spkHelper.js
│ ├── server.js
│ └── package.json
├── frontend/
│ ├── assets/
│ │ ├── css/
│ │ │ ├── style.css
│ │ │ ├── DataKriteria.css
│ │ │ └── DataPantai.css
│ │ ├── js/
│ │ │ ├── spk.js
│ │ │ ├── api.js
│ │ │ ├── DataKriteria.js
│ │ │ └── DataPantai.js
│ │ └── img/
│ │ └── Group 13.png
│ └── pages/
│ ├── index.html
│ ├── hitung.html
│ ├── DataPantai.html
│ └── DataKriteria.html
├── database/
│ └── spk_pantai.sql
└── README.md


## 🚀 Cara Menjalankan

### **1. Setup Database**
-- Import database
mysql -u root -p
CREATE DATABASE spk_pantai;
USE spk_pantai;
SOURCE database/spk_pantai.sql;

### **2. Setup Backend**
Masuk ke folder backend
cd backend

Install dependencies
npm install

Konfigurasi database di config/database.js
Sesuaikan host, user, password, database
Jalankan server
npm start

atau
node server.js

Server berjalan di http://localhost:5000

### **3. Setup Frontend**
Buka frontend dengan Live Server atau langsung buka file HTML
Atau gunakan http-server:
cd frontend
npx http-server -p 8080

Akses di http://localhost:8080


## 📖 Cara Penggunaan

### **1. Tambah Data Pantai**
- Buka menu **Data Pantai**
- Klik **Tambah Data Pantai**
- Isi form: Nama, Provinsi, HTM, RRHM, Rating, Fasilitas, Kondisi Jalan
- Simpan

### **2. Kelola Kriteria** (Opsional untuk admin)
- Buka menu **Data Kriteria**
- Edit skala penilaian jika diperlukan
- **Catatan:** Kriteria sudah ditentukan berdasarkan metodologi penelitian

### **3. Hitung Ranking Pantai**
- Buka menu **Perhitungan**
- Lihat daftar kriteria
- Atur tingkat kepentingan dengan slider (skala 1-9)
- Klik **Hitung Ranking**
- Lihat hasil Top 10 pantai terbaik
- Klik **Detail** untuk melihat rincian perhitungan SAW
- Klik **Lihat Detail AHP** untuk validasi konsistensi

## 📊 API Endpoints


## ©️ Copyright. 2025
```
- Talia Aprianti
- Nanda Kharisma Safitri
- Risda Rahmawati Harsono

Sistem Informasi, Fakultas Ilmu Komputer, Universitas Pembangunan Nasional Veteran Jawa Timur
```
