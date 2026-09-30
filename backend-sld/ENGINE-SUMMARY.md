# Engine SLD — Java Spring Boot (Ringkasan)

Ringkasan singkat engine SLD di backend `backend-sld/` untuk dibagikan ke tim.
Detail lengkap: [`API-SPEC.md`](API-SPEC.md).

## Arsitektur

Backend **Java (Spring Boot 3.3.5, Java 17, Maven, Apache POI)** memindahkan
engine SLD dari TypeScript ke server. Front-end React cukup mengunggah file
Excel dan merender JSON yang dikembalikan.

Sebagai **port 1:1 dari engine front-end** (`src/lib/sld/{parser,tier,adapter,layout,engineSld}.ts`),
bukan implementasi ulang — dan diverifikasi byte-identik antara FE & BE.

## Pipeline (5 tahap) — `SldEngineService.parse()`

```
ExcelReader → MappingDetector + Parser → TierEngine → Adapter
            → LayoutEngine + GraphEngine → EngSldGraph (JSON)
```

1. **`ExcelReader`** — baca workbook (`.xlsx`/`.xls`) via POI, deteksi baris header.
2. **`MappingDetector` + `Parser`** — auto-detect kolom (template fleksibel),
   hasilkan `Payload` (objek GI, koneksi, risk) + daftar isu.
3. **`TierEngine`** — hitung tier tiap GI (BFS multi-source; pembangkit = tier 0).
4. **`Adapter`** — payload + tier → view-model (`giList`, `lineList`, `ibrLinks`).
5. **`LayoutEngine` + `GraphEngine`** — hitung posisi x/y absolut, lalu emit
   `EngSldGraph` final (nodes, circuits, ibts, bays, pins).

## Output `/api/sld/parse`

```json
{ "meta": { "filename", "engine", "elapsedMs" },
  "issues": [ { "level", "message" } ],
  "graph":  { "id", "title", "viewName", "tierCount",
              "nodes": [], "circuits": [], "ibts": [], "bays": [], "pins": [] } }
```

Kontrak `graph` persis ekuivalen dengan `EngSldGraph` front-end sehingga
`SldSvgCanvas` merender tanpa penyesuaian.

## Ciri penting

- **5 endpoint REST**: `GET /api/health`, `POST /api/sld/preview`,
  `/payload`, `/viewmodel`, `/parse` (multipart `file=`; port 8080, CORS `*`).
- **Paritas FE=BE**: `scripts/pipeline-test/parity-graph.ts` membuktikan
  **EXACT MATCH** — Suralaya 21/19/3/0/3/4 (bounds 1340×1010) dan Jamali
  64/40/0/0/0/5 (bounds 1785×1230).
- **Template fleksibel**: `MappingDetector` mengenali kolom otomatis dari
  header, struktur Excel boleh bervariasi asal headernya jelas.
- **Snapping IBT** (roda ke busbar 150 kV) murni di sisi render FE;
  graf Java (`graph.ibts[].x`) tidak berubah.