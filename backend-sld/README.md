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
- [ ] Parsing Excel asli dengan Apache POI (porting `parser.ts`)
- [ ] Pemetaan kolom (porting `mapping.ts`)
- [ ] Tier & graf (porting `tier.ts`, `adapter.ts`)
- [ ] Layout & geometri (porting `layout.ts`, `engineSld.ts`)
- [ ] Deployment

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