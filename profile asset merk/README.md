# Profil Aset Transmisi – Dashboard MANTAPS PLN

Dashboard web enterprise **Profil Aset Transmisi** untuk aplikasi **MANTAPS PLN** dengan konsep utama **Seamless Progressive Drill-Down**.

Pengguna dapat menganalisis kondisi aset transmisi berdasarkan lokasi, jenis aset, merk/pabrikan, Health Index, umur aset, dan jumlah aset tanpa berpindah halaman yang terpisah.

---

## 🧭 Struktur Progressive Drill-Down (6 Level)

1. **Level 1: Peta Nasional (Indonesia)**
   - Peta interaktif GIS Indonesia **terisi seluruh Indonesia**: 38 titik provinsi (bukan 6 bulatan wilayah), ukuran titik mengikuti jumlah aset, dan warna mengikuti 6 wilayah.
   - Legenda warna wilayah di pojok kiri bawah peta beserta jumlah aset per wilayah.
   - **Jenis Aset difokuskan ke Power Transformer** karena seluruh drill-down berikutnya memakai satu jenis aset.
   - Dropdown **Merk** memuat 24 merk (5 merk utama + 19 merk minor di dalam *Lainnya*).
   - **Filter lokasi berjenjang** mengikuti urutan standar MANTAPS (Peta Risiko): **Unit Induk → Unit Pelaksana → ULTG → GI (Gardu Induk) → Bay**. Dropdown anak **terkunci (abu-abu) sampai induknya dipilih**, dan hanya menampilkan opsi yang sah di bawah induk tersebut — misalnya Unit Pelaksana hanya menampilkan unit milik Unit Induk terpilih, GI milik ULTG terpilih, dan Bay milik GI terpilih. Tersedia tombol **Reset** untuk mengembalikan semua filter.
     - Struktur: 6 Unit Induk, 43 Unit Pelaksana, 49 ULTG, 95 Gardu Induk, serta ribuan Bay transmisi (Bay Trafo, Bay Penghantar, Bay Kopel, dsb).
     - Setiap pilihan menyorot Gardu Induk & Bay terkait di peta dan memperbarui kartu konteks secara dinamis.
   - **Pencarian peta**: kolom *Cari Unit Induk, Unit Pelaksana, ULTG, GI, Bay, provinsi, atau merk...* mencakup seluruh hierarki organisasi 5 tingkat (**Unit Induk / Unit Pelaksana / ULTG / GI / Bay**), 38 provinsi, 6 wilayah, dan 24 merk. Memilih hasil langsung mengisi filter berjenjang dan memfokuskan peta ke lokasi tersebut.
   - Klik titik provinsi **Jawa** → langsung masuk ke Level 2 pada scope provinsi tersebut. Klik provinsi di luar Jawa → muncul *notice* berisi angka provinsi (aset, HI, HI 4–5) dengan catatan bahwa data drill-down merk & unit baru tersedia untuk wilayah Jawa, plus tombol pintas ke drill-down Jawa.
   - Floating Card: *Statistik Nasional Sistem Transmisi* (UPT, ULTG, GI, Provinsi, Total Aset, Kapasitas MVA).
   - Legenda Standar Health Index (HI 1 s.d HI 5) muncul mulai Level 2 (di Level 1 diganti legenda wilayah).
   - Kartu Konteks Indonesia dihitung dari daftar 38 provinsi: **Total Aset 30.784, 24 Merk, Rata-rata HI 2,64, HI 4–5: 6.280 unit (20,4%)**. Rekap 6 wilayah: Jawa 10.214, Sumatera 9.080, Kalimantan 4.010, Sulawesi 3.780, Nusa Tenggara 2.030, Papua & Maluku 1.670.

2. **Level 2: Wilayah / Sistem (Jawa / Jawa Barat)**
   - Peta melakukan zoom dinamis (*flyTo*) ke Pulau Jawa dengan marker cluster per provinsi.
   - **Peta tetap tersedia** dengan tinggi ringkas (360 px) plus tombol *Perbesar Peta* / *Perkecil Peta* (640 px) supaya analitik di bawahnya mendapat ruang tanpa kehilangan konteks lokasi.
   - **6 KPI cards** di header, semuanya mengikuti scope: Power Transformer, Jumlah Merk, Rata-rata HI, Unit HI 4–5, Rata-rata Umur, dan Gardu Induk.
   - Sebelum provinsi dipilih, scope aktif adalah **agregat se-Jawa** (5 provinsi). Kartu konteks peta menampilkan ringkasan aggregate dan daftar provinsi.
   - Klik marker provinsi, baris tabel, atau batang grafik → seluruh isi halaman ikut berganti ke scope provinsi tersebut.
   - **Empat tab analitik di bawah peta**, semuanya khusus **Power Transformer** dan semuanya mengikuti scope:
     1. **Sebaran Aset** — tombol eksplorasi, grafik batang *Power Transformer vs Unit HI 4–5 per provinsi* (klik batang untuk memfokuskan provinsi), kartu ringkasan HI 1–2 / HI 3 / HI 4–5, daftar rincian per kategori HI, dan tabel ringkasan 5 provinsi (Total Aset, Power Transformer, Merk, HI, HI 4–5, Umur, Gardu Induk).
     2. **Profil Merk** — diagram batang komposisi merk, grafik *Unit HI 4–5 per merk* (prioritas perbaikan), dan tabel rincian 6 baris (5 merk utama + grup *Lainnya*). **Baris *Lainnya* bisa diklik** → terbuka modal *Rincian Merk Lainnya* berisi 19 merk (unit, pangsa, HI, HI 4–5, umur) dan setiap barisnya bisa diklik untuk masuk ke Level 4.
     3. **Profil Jenis Aset** — kartu Power Transformer dengan daftar metrik teknis (HI, HI 4–5, umur, kapasitas terpasang dalam MVA, Gardu Induk, jumlah merk), grafik donat sebaran Health Index, dan tabel sebaran unit per UPT (unit, MVA, HI 4–5, rasio, kondisi).
     4. **Umur Aset** — grafik batang kelompok umur (diwarnai per kondisi), grafik tren Health Index 2021–2026, dan tabel rincian kelompok umur (unit, pangsa, kapasitas MVA, kondisi).
   - Kolom bertanda ¹ pada tabel provinsi mencakup seluruh jenis aset, sedangkan kolom Power Transformer dan Merk PT khusus Power Transformer.
   - Breadcrumb: `Indonesia > Jawa` (agregat) atau `Indonesia > Jawa > Jawa Barat` (provinsi).

3. **Level 3: Jenis Aset (Power Transformer)**
   - Seluruh KPI, tabel, dan diagram dihitung dari scope aktif, baik agregat Jawa maupun provinsi terpilih.
   - KPI Ringkasan pada scope Jawa Barat: *Jumlah Aset (842), Jumlah Merk (12), Rata-rata HI (2,74), Aset HI 4–5 (170 / 20,2%), Rata-rata Umur (18,4 thn)*.
   - KPI Ringkasan pada scope Jawa agregat: *Jumlah Aset (2.514), Jumlah Merk (24), Rata-rata HI (2,74), Aset HI 4–5 (508 / 20,2%), Rata-rata Umur (17,8 thn)*.
   - Diagram Batang Horizontal: *Jumlah Aset per Merk* (ABB, Siemens, Toshiba, GE, Hitachi, dan grup *Lainnya* yang bisa diklik untuk melihat 19 merknya).
   - Diagram Batang Bertumpuk 100%: *Distribusi Health Index per Merk* (HI 1–5).
   - Diagram Sebaran Umur Aset per Merk, tabel sebaran UPT (unit, MVA, HI 4–5), dan tabel proporsi HI per merk.

> **Kategori "Lainnya" (19 merk)**: ABB, Siemens, Toshiba, GE, dan Hitachi ditampilkan sebagai baris sendiri karena share-nya besar. Sisanya dikelompokkan sebagai *Lainnya* agar tabel dan grafik tetap terbaca, tetapi **dapat diklik** di mana pun (tabel merk Level 2, tabel HI Level 3, bar merk, dan stacked bar) untuk membuka daftar 19 merk di dalamnya — Hyundai, Hyosung, S&C Electric, Plus Celcom, Ecowatt, Victor, Merlin Gerin, Aichi, Elin, Fuji Electric, Schneider Electric, Sunlight, Star, Megapower, Tosis, Japan Electric, Kobe Steel, Nitto Kogyo, dan Daewoo. Unit, sebaran HI, dan sebaran umur tiap merk diturunkan dari bobot, avg HI, dan avg umur sehingga selalu konsisten dengan total scope.
   - Breadcrumb: `Indonesia > Jawa > Power Transformer` (agregat) atau `Indonesia > Jawa > Jawa Barat > Power Transformer` (provinsi).

4. **Level 4: Merk / Pabrikan (ABB)**
   - Profil analitis obyektif merk ABB untuk Power Transformer pada scope aktif.
   - 7 KPI cards: *Jumlah Aset, Rata-rata HI, % HI 1–2, % HI 3, % HI 4–5, Avg Umur, Unit >20 Tahun*.
   - Donut Chart: *Distribusi Health Index* (Center label: 182 Aset untuk Jawa Barat, 543 Aset untuk Jawa agregat).
   - Bar Chart: *Sebaran Umur Aset* (0–5, 6–10, 11–20, 21–30, >30 tahun).
   - Mini Map GIS: *Sebaran Lokasi Gardu Induk* dengan titik trafo ABB sesuai scope.
   - Line Chart: *Tren Health Index 2021 s.d 2026*.
   - Modal Interaktif: *Bandingkan Merk* (Radar chart & komparasi teknis ABB vs Siemens vs Toshiba), judul modal menyesuaikan scope.

5. **Level 5: Daftar Aset (Tabel Unit)**
   - Tabel lengkap: *No, ID Asset, Nama Asset, GI, UPT, Tegangan, Tahun Operasi, Umur, Health Index, Status, Aksi*.
   - Jumlah baris menyesuaikan merk dan scope: 30 baris (Jawa agregat) atau 12 baris (provinsi) untuk merk utama.
   - Pencarian real-time & filter status.
   - Export data ke format CSV.
   - Tombol *Lihat Detail →* pada setiap baris unit aset.

6. **Level 6: Detail Asset (TRF-ABB-001)**
   - Foto teknis resolusi tinggi trafo GI Cibatu 150 kV.
   - Informasi spesifikasi teknis lengkap.
   - Grafik riwayat Health Index per tahun.
   - Riwayat Inspeksi (Level 1 visual, uji DGA & Furan, thermovisi bushing, tegangan tembus minyak).
   - Riwayat Pemeliharaan (purifikasi minyak, penggantian gasket, overhaul OLTC).
   - **Dukungan Keputusan (Decision Support Analysis)** dengan rekomendasi dan 5 pilar aksi (Monitoring rutin, Inspeksi lanjutan, Har preventif, Evaluasi penggantian, Prioritas perencanaan).

---

## 🎨 Standar Desain Visual & Warna Health Index

- **HI 1 — Sangat Baik**: Biru (`#2563eb`)
- **HI 2 — Baik**: Hijau (`#10b981`)
- **HI 3 — Cukup**: Kuning / Amber (`#f59e0b`)
- **HI 4 — Perlu Perhatian**: Oranye (`#f97316`)
- **HI 5 — Buruk**: Merah (`#ef4444`)

---

## 🚀 Cara Menjalankan

### Opsi 1: Buka Langsung File HTML
Buka file `profile asset merk/index.html` di browser apa pun (Chrome, Edge, Safari, Firefox). Semua dependensi Leaflet, Chart.js, dan Lucide sudah tersimpan secara lokal dan siap digunakan secara offline.

### Opsi 2: Menggunakan Local Web Server
Jalankan perintah berikut di terminal:
```bash
cd "profile asset merk"
python3 -m http.server 7789
```
Buka browser pada alamat: **http://localhost:7789/**
