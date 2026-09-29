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
| POST   | `/api/sld/preview` | Upload Excel → nama sheet + header + deteksi kolom (tahap 1–2) |
| POST   | `/api/sld/payload` | Upload Excel → `EnginePayload` asli: objek GI, connection, risk (tahap 3) |
| POST   | `/api/sld/parse` | Upload Excel (`multipart`, field `file`) → JSON graf SLD |

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
- [x] Parse → payload (porting `parser.ts` + `types.ts`) — **Parser** ✅ (parity FE=BE teruji)
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
| **3. Parse → payload** | `parser.ts` (`parseFlexibleSheet`, `parseEngineWorkbook`) + `types.ts` | `Parser` → objek GI, connection, risk (normalisasi) | `POST /api/sld/payload` → bandingkan `objects`/`connections`/`risks` dengan `scripts/pipeline-test/parse-only.ts` |
| **4. Tier + view-model** | `tier.ts` (`computeTiers`) + `adapter.ts` (`toViewModel`) | tier BFS multi-source + flatten node/line | bandingkan jumlah GI, line, tier range |
| **5. Layout + graf akhir** | `layout.ts` (`computeEngineLayout`) + `engineSld.ts` (`toEngSldGraph`) | JSON `EngSldGraph` (yang dipakai canvas) | bandingkan JSON graf FE vs BE |

**Konstanta geometri yang wajib sama** (`engineSld.ts`):
`sourceY=80, tierTop=150, tierGap=220, busStroke=6, wireStroke=2.2, pitch=14,
pmt=10, bayLen=42, padX=60`, fungsi `engBusY`, `engTierLineY`, warna tegangan
(≥500 → `#0047AB`, ≥150 → `#C00000`, lain → `#E0A400`).

**Alat verifikasi parity**: di repo React sudah ada
`scripts/pipeline-test/main.ts <file.xlsx>` yang menjalankan pipeline FE penuh
(parse → tier → view-model → layout) lalu mencetak ringkasan (jumlah GI, jumlah
line, tier range, sample ID). Untuk membandingkan hasil **tahap 3** saja, pakai
`scripts/pipeline-test/parse-only.ts <file.xlsx>` (cetak seluruh objek,
connection, risk + isu). Buat ekuivalennya di Java (atau tes JUnit) dan
bandingkan angka & sample ID-nya dengan file Excel yang sama.

**Hasil verifikasi tahap 3 (29-09-2026)** — Java `Parser` vs FE `parse-only.ts`:

| Fixture | Objek | Koneksi | Risk | Isu | Status |
|--------|-------|---------|------|-----|--------|
| Suralaya (subsistem 500/150 kV) | 24 | 20 | 3 | 0 | ✅ identik |
| Jamali (sistem 500 kV) | 64 | 58 | 0 | 0 | ✅ identik |

Cara mengulang:
```bash
# backend: restart lalu
curl -s -X POST -F "file=@public/template_sistem_500kv_jamali.xlsx" http://localhost:8080/api/sld/payload
# front-end: dari folder aplikasi
npx tsx scripts/pipeline-test/parse-only.ts public/template_sistem_500kv_jamali.xlsx
```

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
    ├── dto/EnginePayloadDto.java  # payload parse (port types.ts) — tahap 3
    ├── reader/ExcelReader.java    # baca workbook/header (tahap 1)
    ├── mapping/ColumnMapping.java + MappingDetector.java  # deteksi kolom (tahap 2)
    ├── parser/Parser.java         # Excel → EnginePayload (tahap 3)
    ├── service/SldEngineService.java   # engine (tahap 1–5: parse masih mock)
    └── web/SldParseController.java     # REST API
```