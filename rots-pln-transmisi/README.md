# ROTS – Rencana Operasi Tahunan Semester | PLN Transmisi

Dashboard monitoring dan evaluasi rencana operasi sistem tenaga listrik semesteran untuk PLN Transmisi.

![ROTS PLN Transmisi Dashboard](https://raw.githubusercontent.com/placeholder/rots-pln-transmisi/main/assets/preview.png)

## ⚡ Fitur Utama
1. **Executive Operations Cockpit**:
   - Status Sistem Real-time (**NORMAL**, **SIAGA**, **DEFISIT**) berbasis Batas Cadangan Minimum (default 2.000 MW).
   - Radial Gauge Meter Cadangan Daya (CAD).
   - 6 Key Parameter Harian (DMN, Planned Outage, Unplanned Outage, DMP, Beban Puncak, Cadangan Daya).
2. **Neraca Daya ROTS (Stacked Area Chart)**:
   - Visualisasi hierarki pembangkitan grid (*Power Grid Dispatch Hierarchy*).
   - Area DMP (Steel Sky Cyan), Planned Outage (Amber Gold), Unplanned Outage (Rose Red), Plafon DMN (Sapphire Blue), dan kurva Beban Puncak (BP).
   - Mode Layar Penuh (Fullscreen) interaktif dengan tab switcher dan navigasi bulanan.
3. **Analisis Tren & Komparasi**:
   - Trend Cadangan Daya harian terhadap garis ambang batas (Threshold & Defisit).
   - Komparasi bulanan DMP vs BP (Beban Puncak).
   - Donut chart distribusi status hari operasi.
4. **Ringkasan Bulanan & Breakdown Outage**:
   - Tabel ringkasan bulanan (DMP avg, BP max, CAD avg, CAD min, jumlah hari per status).
   - Rincian komponen Planned Outage (PO, MO) dan Unplanned Outage (FO, FO EP, DER KIT, DER TRANS, VARMUS).
5. **Simulasi Parameter & Formula Audit Trail**:
   - Traceability formula matematis: `DMP = DMN - Outage`, `CAD = DMP - BP`.
   - Ubah ambang batas cadangan minimum secara dinamis.
6. **Ekspor & Impor Data Excel (.xlsx)**:
   - Dukungan upload data template Excel ROTS.
   - Ekspor laporan berformat Excel.

## 🚀 Menjalankan Secara Online (GitHub Pages)
Aplikasi ini dibangun menggunakan arsitektur web client-side (HTML5, CSS3, Vanilla JavaScript ES6+) murni, sehingga dapat langsung di-host gratis di **GitHub Pages** tanpa server backend.

### Cara Mengaktifkan GitHub Pages:
1. Buka repositori ini di GitHub.
2. Masuk ke menu **Settings** > **Pages** (di sidebar kiri).
3. Pada bagian **Build and deployment** > **Source**:
   - Pilih `Deploy from a branch`.
   - Branch: `main` (atau `master`), folder: `/ (root)`.
4. Klik **Save**.
5. Tunggu 1–2 menit, link website aktif Anda akan muncul di bagian atas halaman (contoh: `https://<username>.github.io/<nama-repo>/`).

## 💻 Menjalankan Secara Lokal
```bash
# Clone repository
git clone https://github.com/<username>/<nama-repo>.git
cd <nama-repo>

# Jalankan server lokal (misalnya Python)
python3 -m http.server 3030
```
Buka browser pada: `http://localhost:3030`

---
© 2026 PT PLN (Persero) Transmisi. All rights reserved.
