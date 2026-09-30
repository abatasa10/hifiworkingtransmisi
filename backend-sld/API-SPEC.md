# SLD Server Mode — API Specification

Backend **Spring Boot (Java)** untuk halaman "SLD Server Mode" di aplikasi
React. Bertugas menerima file Excel (`.xlsx`/`.xls`), menjalankan engine SLD,
dan mengembalikan graf final (`EngSldGraph`) yang siap dirender oleh
`SldSvgCanvas` di front-end.

> Engine Java ini adalah **port 1:1** dari engine TypeScript di front-end
> (`src/lib/sld/{parser,tier,adapter,layout,engineSld}.ts`). Paritas
> diverifikasi secara byte-identik lewat `scripts/pipeline-test/*.ts`.

---

## 1. Stack & Build

| | |
|---|---|
| Runtime | Java 17 |
| Framework | Spring Boot 3.3.5 (`spring-boot-starter-web`) |
| Build | Maven (wrapper `./mvnw`) |
| Excel parser | Apache POI 5.2.5 (`poi-ooxml`) |
| JSON | Jackson (bawaan Spring) |
| Port | 8080 |
| CORS | `*` |

Artifact: `com.iconplus:sld-server:0.1.0` (`sld-server`).

Menjalankan:

```bash
cd backend-sld
./mvnw spring-boot:run            # dev, port 8080
# atau pakai jar:
./mvnw package -DskipTests
java -jar target/sld-server-0.1.0.jar
```

## 2. Endpoints

Semua POST menerima **multipart** `file=<workbook.xlsx>`. Response JSON.

| Method | Path | Keterangan |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/sld/preview` | Inspeksi setiap sheet: header terdeteksi + 5 baris data + hasil auto-detect kolom (`MappingDetector`) |
| POST | `/api/sld/payload` | Parse mentah: objek GI, koneksi, risk + daftar isu |
| POST | `/api/sld/viewmodel` | Parse → tier → view-model + ringkasan (giList/lineList/ibrLinks/tierRange) |
| POST | `/api/sld/parse` | **End-to-end**: Parse → Tier → Adapter → Layout → Graph → `EngSldGraph` final |

Contoh:

```bash
curl -F "file=@template_kerawanan_subsistem_suralaya_cilegon.xlsx" \
  http://localhost:8080/api/sld/parse
```

## 3. Pipeline (endpoint `/api/sld/parse`)

```
ExcelReader (POI)
        │  baca workbook + deteksi baris header
        v
MappingDetector
        │  auto-detect kolom (template fleksibel, header bisa bervariasi)
        v
Parser ──► EnginePayloadDto.ParseResult { payload, issues }
        v
TierEngine.computeTiers(payload)        // tier BFS multi-source
        v
Adapter.toViewModel(payload, tierMap)   // giList, lineList, ibrLinks
        v
LayoutEngine.computeEngineLayout(...)   // koordinat x/y absolut
        v
GraphEngine.toEngSldGraph(...)          // nodes/circuits/ibts/bays/pins
        v
EngineDto.ApiResponse { meta, issues, graph }
```

## 4. Kontrak `/api/sld/parse`

```json
{
  "meta": {
    "filename": "template_...xlsx",
    "engine": "spring-boot-java (engine sld)",
    "elapsedMs": 42
  },
  "issues": [
    { "level": "error | warning | info", "message": "..." }
  ],
  "graph": {
    "id": "upload",
    "title": "SLD",
    "viewName": "SLD",
    "tierCount": 5,
    "nodes": [
      {
        "code": "srlya", "label": "SURALAYA", "name": "Suralaya",
        "type": "GI", "voltageKv": 150.0,
        "role": "CORE", "tier": 1, "status": "ENERGIZED",
        "x": 123.5, "halfWidth": 228.0,
        "labelTop": true, "stackedAbove": false
      }
    ],
    "circuits": [
      {
        "id": "c1", "code": "...", "name": "...",
        "type": "SUTT | SKTT", "voltageKv": 500.0,
        "from": "suralaya", "to": "cilegonbaru",
        "fromPort": -1.0, "toPort": 1.0,
        "circuitCount": 2, "status": "ENERGIZED", "loadingPct": 0.0
      }
    ],
    "ibts": [
      {
        "id": "i1", "code": "IBT-01", "name": "...",
        "from": "suralayabaru", "to": "srlya",
        "x": 390.0, "status": "ENERGIZED"
      }
    ],
    "bays": [
      { "id": "b1", "code": "...", "name": "...", "busCode": "srlya",
        "x": 445.0, "circuitCount": 2, "status": "ENERGIZED" }
    ],
    "pins": [
      { "seq": 1, "kind": "SUBSTATION | CIRCUIT | TRANSFORMER", "code": "..." }
    ]
  }
}
```

### 4.1 Enumerasi penting

| Field | Nilai |
|---|---|
| `node.type` | `GITET` \| `GI` \| `GIS` \| `GENERATING_UNIT` \| `BEBAN` |
| `node.role` | `SOURCE` (pusat pembangkit) \| `CORE` \| `BOUNDARY` |
| `node.status` | `ENERGIZED` \| `DE_ENERGIZED` \| `PLANNED` |
| `circuit.type` | `SUTT` \| `SKTT` |
| `pin.kind` | `SUBSTATION` (risiko pada GI) \| `CIRCUIT` (risiko pada jalur) \| `TRANSFORMER` (risiko pada IBT) |

## 5. Catatan untuk tim backend

1. **Kontrak graph identik** dengan `EngSldGraph` di front-end
   (`src/lib/sld/engineSld.ts`) — `SldSvgCanvas` langsung merender tanpa
   penyesuaian. Jika kontrak ini diubah, front-end harus ikut.
2. **Template fleksibel**: `MappingDetector` mengenali kolom secara otomatis
   dari header (label "GI/Dari GI/Ke GI/Tegangan/No IBT/dll."). Struktur
   sheet `Jalur_Transmisi`/`Gardu_Induk` boleh bervariasi asal headernya
   jelas.
3. **Snapping IBT (roda ke busbar 150 kV) dilakukan di sisi render FE** —
   kontrak `graph.ibts[].x` tetap memuat pusat GI 500 kV dan tidak berubah di
   Java.
4. Paritas FE=BE diverifikasi dengan `scripts/pipeline-test/parity-graph.ts`
   terhadap fixture Suralaya & Jamali (hasil **EXACT MATCH**, bounds 1340×1010
   dan 1785×1230).