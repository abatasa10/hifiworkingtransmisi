package com.iconplus.sld.service;

import com.iconplus.sld.dto.EngineDto;
import java.io.IOException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Mesin SLD. TAHAP 1 (skeleton): endpoint sudah jalan tapi masih MOCK —
 * mengembalikan contoh graf agar alur front-end ↔ backend terbukti.
 * TAHAP 2: porting parser.ts → Apache POI di sini (baca Excel asli).
 */
@Service
public class SldEngineService {

  public EngineDto.ApiResponse parse(MultipartFile file) {
    long start = System.currentTimeMillis();
    EngineDto.ApiResponse res = new EngineDto.ApiResponse();

    res.meta.filename = demoFilename(file);
    res.meta.engine = "spring-boot-java (mock engine)";

    // ---- contoh graf kecil ala Suralaya (GITET 500 kV → GI 150 kV) ----
    EngineDto.Graph g = res.graph;
    g.id = "server-demo";
    g.title = "SLD DEMO — Suralaya (Hasil Java Engine)";
    g.viewName = "SURALAYA-CILEGON";
    g.tierCount = 2;

    EngineDto.Node slrda = node("SLRDA", "SLRDA", "Suralaya", "GITET", 500, "SOURCE", 0, 0, 90, true);
    EngineDto.Node cilegon = node("CILEGON", "CILN", "Cilegon", "GI", 150, "CORE", 1, 0, 90, false);
    EngineDto.Node sahale = node("SGA", "SGA", "Sahale", "GI", 150, "CORE", 1, 300, 60, false);
    EngineDto.Node mcc = node("MCCI4", "MCCI4", "MCC Cilegon", "GI", 150, "BOUNDARY", 1, 620, 60, false);
    g.nodes.add(slrda);
    g.nodes.add(cilegon);
    g.nodes.add(sahale);
    g.nodes.add(mcc);

    EngineDto.Circuit c1 = circuit("c1", "SLRDA-CILEGON", "SUTT-SLRDA-CILEGON", "SUTT", 500, "SLRDA", "CILEGON", 0, 0, 1, 42.5);
    EngineDto.Circuit c2 = circuit("c2", "CILEGON-SGA", "SUTT-CILEGON-SGA", "SUTT", 150, "CILEGON", "SGA", 0, 0, 2, 31.2);
    EngineDto.Circuit c3 = circuit("c3", "SGA-MCCI4", "SUTT-SGA-MCCI4", "SUTT", 150, "SGA", "MCCI4", 0, 0, 1, 27.0);
    g.circuits.add(c1);
    g.circuits.add(c2);
    g.circuits.add(c3);

    EngineDto.Ibt ibt = new EngineDto.Ibt();
    ibt.id = "INTERNAL_IBT_1_SLRDA-CILEGON";
    ibt.code = "SLRDA-CILEGON";
    ibt.name = "IBT SLRDA 1";
    ibt.from = "SLRDA";
    ibt.to = "CILEGON";
    ibt.x = 0;
    ibt.status = "ENERGIZED";
    g.ibts.add(ibt);

    EngineDto.Pin pin = new EngineDto.Pin();
    pin.seq = 7;
    pin.kind = "SUBSTATION";
    pin.code = "SLRDA";
    g.pins.add(pin);

    EngineDto.Bay bay = new EngineDto.Bay();
    bay.id = "bay-1";
    bay.code = "BAY-1";
    bay.name = "Bay 1";
    bay.busCode = "CILEGON";
    bay.x = 120;
    bay.circuitCount = 1;
    bay.status = "ENERGIZED";
    g.bays.add(bay);

    res.meta.elapsedMs = System.currentTimeMillis() - start;
    return res;
  }

  private String demoFilename(MultipartFile file) {
    try {
      String name = file.getOriginalFilename();
      if (name != null && !name.isBlank()) {
        return name + " (contoh graf mock)";
      }
    } catch (Exception ignored) {
      // file tidak terbaca — masih tahap mock
    }
    return "mock-workbook.xlsx (contoh graf mock)";
  }

  private EngineDto.Node node(String code, String label, String name, String type, double kv,
                              String role, int tier, double x, double halfWidth, boolean labelTop) {
    EngineDto.Node n = new EngineDto.Node();
    n.code = code;
    n.label = label;
    n.name = name;
    n.type = type;
    n.voltageKv = kv;
    n.role = role;
    n.tier = tier;
    n.x = x;
    n.halfWidth = halfWidth;
    n.labelTop = labelTop;
    n.status = "ENERGIZED";
    return n;
  }

  private EngineDto.Circuit circuit(String id, String code, String name, String type, double kv,
                                    String from, String to, double fromPort, double toPort,
                                    int count, double loading) {
    EngineDto.Circuit c = new EngineDto.Circuit();
    c.id = id;
    c.code = code;
    c.name = name;
    c.type = type;
    c.voltageKv = kv;
    c.from = from;
    c.to = to;
    c.fromPort = fromPort;
    c.toPort = toPort;
    c.circuitCount = count;
    c.status = "ENERGIZED";
    c.loadingPct = loading;
    return c;
  }
}