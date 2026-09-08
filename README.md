# MANTAPS - Dashboard Peta Kerawanan Sistem & Subsistem Tenaga Listrik 2026

Aplikasi enterprise visualisasi sistem tenaga listrik, transmisi 500 kV & 150 kV, GI/GITET, IBT, pembangkit, UP2B/P2B, subsistem, serta Single Line Diagram (SLD) interaktif berbasis dokumen resmi:
> **"Buku Kerawanan Sistem & Subsistem Jawa, Madura dan Bali Tahun 2026"**

Aplikasi ini mengadopsi standar visual **MANTAPS PLN Corporate Design System** dengan tipografi Plus Jakarta Sans, palet enterprise PLN Blue (`#0046ad`, `#00368a`), dan matriks level kerawanan berstandar operasional.

---

## Fitur Utama

### 1. 4-Level Hierarchical Drill-Down
- **Level 1 - Peta Nasional:** Visualisasi peta pulau Indonesia dengan status sistem kelistrikan (Jamali, Sumatera, Kalimantan, Sulawesi, Maluku-Papua, Nusa Tenggara).
- **Level 2 - Sistem Jamali (Jawa-Madura-Bali):** Ringkasan sistem 500 kV & 150 kV, kapasitas pembangkit, beban puncak, dan matriks risiko sistemik.
- **Level 3 - Wilayah UP2B (P2B):**
  - UP2B DKI Jakarta & Banten
  - UP2B Jawa Barat
  - UP2B Jawa Tengah & DIY
  - UP2B Jawa Timur, Bali & Madura
- **Level 4 - Subsistem Operasional:** Detail subsistem kelistrikan (contoh: Subsistem Gandul - Muara Karang, Subsistem Balaraja, Subsistem Cilegon, dll).

### 2. Interactive Single Line Diagram (SLD) Berbasis React Flow
- **SLD Multi-Tier Interaktif:**
  - **Tier 1:** Pembangkitan (PLTU, PLTGU, PLTA, IPP)
  - **Tier 2:** Busbar 500 kV GITET
  - **Tier 3:** Trafo Interbus (IBT 500/150 kV)
  - **Tier 4:** Busbar 150 kV GI
  - **Tier 5:** Feeder / Saluran Transmisi 150 kV
  - **Tier 6:** Pusat Beban Konsumen
- **Simulasi Kerawanan Nyata:**
  - **Kasus Kerawanan #7 Buku Kerawanan 2026:** SUTET Gandul - Durkos - Kembangan (N-1 Overload 118% kapasitas termal).
  - Jalur transmisi terdampak menyala dengan animasi pulsating red (`#dc2626`).
  - Klik elemen untuk membuka *Inspector Drawer* yang menampilkan spesifikasi aset, beban normal vs darurat, dan SOP mitigasi manuver.

### 3. Matriks Kerawanan Operasional
- **Aman / Rendah:** Normal operasional (< 80% rating)
- **Sedang / Moderate:** Warning threshold (80% - 90%)
- **Rawan / Fair:** Siaga manuver beban (90% - 100%)
- **Sangat Rawan / High (N-1 Overload):** Kondisi kritis (> 100% rating)

---

## Teknologi yang Digunakan
- **Frontend Framework:** React 19 + TypeScript
- **Bundler:** Vite 8 (Rolldown engine)
- **Diagram SLD:** `@xyflow/react` (React Flow)
- **Icons:** `lucide-react`
- **Design System:** Custom Enterprise MANTAPS CSS (Plus Jakarta Sans, responsive flex/grid layouts)

---

## Cara Menjalankan

### 1. Prasyarat
- Node.js (v18 ke atas disarankan)
- npm / pnpm / yarn

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Menjalankan Server Development
```bash
npm run dev
```
Buka browser di `http://localhost:5173/`

### 4. Build untuk Produksi
```bash
npm run build
npm run preview
```

---

## Lisensi & Hak Cipta
PT PLN (Persero) / ICON+ — Internal Operational Engineering & Power System Reliability Dashboard.
