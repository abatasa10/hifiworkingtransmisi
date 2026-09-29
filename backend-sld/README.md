# SLD Server Mode — Backend Java (Spring Boot)

Backend untuk halaman **"SLD Server Mode"** di aplikasi React. Engine SLD
(parsing Excel, tiering, layout, geometri) pindah ke server Java; front-end
tetap merender hasil JSON dengan canvas yang sama.

> **Aman & additive**: folder ini terpisah dari aplikasi React. Halaman lain
> tidak terpengaruh. Backend berjalan sendiri di port `8080`.

## Jalankan

```bash
./mvnw spring-boot:run
```

Awalnya `mvnw` akan mengunduh Maven ke `~/.m2/wrapper/dists` (sekali saja),
lalu Spring Boot menerima koneksi di **http://localhost:8080**.

## Endpoint

| Method | Path             | Fungsi                                              |
|--------|------------------|-----------------------------------------------------|
| GET    | `/api/health`    | Cek koneksi engine (dipakai tombol "Cek Koneksi")   |
| POST   | `/api/sld/parse` | Terima upload Excel (`multipart`, field `file`) → JSON graf SLD |

Response `/api/sld/parse`:

```json
{
  "graph":   { "id", "title", "viewName", "tierCount", "nodes", "circuits", "ibts", "bays", "pins" },
  "meta":    { "filename", "engine", "elapsedMs" },
  "issues":  [ { "level": "warning", "message": "..." } ]
}
```

Bentuk `graph` menyamai struktur `EngSldGraph` di `src/lib/sld/engineSld.ts`,
jadi `SldSvgCanvas` front-end langsung bisa merender tanpa perubahan.

## Status implementasi

- [x] Skeleton Spring Boot: health + parse (masih **MOCK** — graf contoh)
- [x] Parsing Excel asli dengan Apache POI (porting `parser.ts`) — **ExcelReader + preview** ✅
- [x] Pemetaan kolom (porting `mapping.ts`) — **MappingDetector** ✅ (diuji vs template Suralaya)
- [ ] Tier & graf (porting `tier.ts`, `adapter.ts`)
- [ ] Layout & geometri (porting `layout.ts`, `engineSld.ts`)
- [ ] Deployment

## Panduan porting engine (5 tahap) — untuk rekan BE

Semua logika engine saat ini berada di **TypeScript** di folder
`peta-kerawanan/src/lib/sld/`. Tujuan: port **1:1 ke Java** dengan **urutan &
konstanta identik**, supaya hasilnya sama persis dengan halaman Upload SLD
yang sudah berjalan (front-end), untuk file Excel yang sama.

> Prinsip kunci: jangan "mengerjakan ulang" atau memperbaiki logika — salin
> perilakunya apa adanya, termasuk konstanta "ajaib" (`tierGap=220`,
> `pitch=14`, dst). Verifikasi dengan membandingkan output per tahap.

| Tahap | File TS acuan | Deliverable Java | Cara verifikasi |
|-------|---------------|------------------|-----------------|
| **1. Baca Excel** | `parser.ts` bagian `readHeaderRows`/`sheetHeaders` | kelas baca workbook → grid baris/kolom via **Apache POI** | `POST /api/sld/preview` → nama sheet + header terdeteksi |
| **2. Deteksi kolom** | `mapping.ts` (`autoDetectMapping`, `cleanKey`) | `MappingDetector` → mapping kolom | bandingkan hasil preview FE vs BE untuk sheet sama |
| **3. Parse → payload** | `parser.ts` (`parseFlexibleSheet`, `parseEngineWorkbook`) + `types.ts` | objek GI, connection, risk (normalisasi) | `POST /api/sld/parse` → JSON object/connection sama |
| **4. Tier + view-model** | `tier.ts` (`computeTiers`) + `adapter.ts` (`toViewModel`) | tier BFS multi-source + flatten node/line | bandingkan jumlah GI, line, tier range |
| **5. Layout + graf akhir** | `layout.ts` (`computeEngineLayout`) + `engineSld.ts` (`toEngSldGraph`) | JSON `EngSldGraph` (yang dipakai canvas) | bandingkan JSON graf FE vs BE |

**Konstanta geometri yang wajib sama** (`engineSld.ts`):
`sourceY=80, tierTop=150, tierGap=220, busStroke=6, wireStroke=2.2, pitch=14,
pmt=10, bayLen=42, padX=60`, fungsi `engBusY`, `engTierLineY`, warna tegangan
(≥500 → `#0047AB`, ≥150 → `#C00000`, lain → `#E0A400`).

**Alat verifikasi parity**: di repo React sudah ada
`scripts/pipeline-test/main.ts <file.xlsx>` yang menjalankan pipeline FE penuh
(parse → tier → view-model → layout) lalu mencetak ringkasan (jumlah GI, jumlah
line, tier range, sample ID). Buat ekuivalennya di Java (atau tes JUnit) dan
bandingkan angkanya dengan file Excel yang sama.

**Tes pakai fixture asli** (di repo React):
`public/template_kerawanan_subsistem_suralaya_cilegon.xlsx` dan
`public/template_sistem_500kv_jamali.xlsx`.

## Struktur

```
backend-sld/
├── pom.xml
├── mvnw                      # maven wrapper (unduh Maven otomatis)
└── src/main/java/com/iconplus/sld/
    ├── SldServerApplication.java
    ├── dto/EngineDto.java    # kontrak JSON (meniru EngSldGraph)
    ├── service/SldEngineService.java   # engine (tahap 1: mock)
    └── web/SldParseController.java     # REST API
```