package com.iconplus.sld.web;

import com.iconplus.sld.dto.EngineDto;
import com.iconplus.sld.mapping.ColumnMapping;
import com.iconplus.sld.mapping.MappingDetector;
import com.iconplus.sld.reader.ExcelReader;
import com.iconplus.sld.service.SldEngineService;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * REST API untuk halaman "SLD Server Mode".
 * Front-end React memanggil endpoint ini secara cross-origin.
 */
@RestController
@CrossOrigin(origins = "*")
public class SldParseController {

  private final SldEngineService service;
  private final ExcelReader excel = new ExcelReader();
  private final MappingDetector detector = new MappingDetector();

  public SldParseController(SldEngineService service) {
    this.service = service;
  }

  @GetMapping("/api/health")
  public Map<String, Object> health() {
    return Map.of(
        "status", "ok",
        "engine", "spring-boot-java",
        "version", "0.1.0-mock");
  }

  /**
   * Tahap 1+2 (verifikasi): preview setiap sheet — header terdeteksi, 5 baris
   * data pertama, dan hasil deteksi kolom (MappingDetector).
   */
  @PostMapping("/api/sld/preview")
  public Map<String, Object> preview(@RequestParam("file") MultipartFile file) throws Exception {
    Map<String, Object> out = new LinkedHashMap<>();
    out.put("filename", file.getOriginalFilename());
    List<Map<String, Object>> sheets = new ArrayList<>();

    try (InputStream in = file.getInputStream();
         Workbook wb = excel.open(in)) {
      for (String sn : excel.sheetNames(wb)) {
        Sheet sheet = wb.getSheet(sn);
        ExcelReader.HeaderRows hr = excel.readHeaderRows(sheet);

        List<Map<String, String>> previewRows = new ArrayList<>();
        List<Map<String, String>> rows = hr.rows;
        for (int i = 0; i < Math.min(5, rows.size()); i++) {
          previewRows.add(rows.get(i));
        }

        Map<String, Object> sheetInfo = new LinkedHashMap<>();
        sheetInfo.put("name", sn);
        sheetInfo.put("headers", hr.headers);
        sheetInfo.put("previewRows", previewRows);
        ColumnMapping m = detector.autoDetect(hr.headers);
        sheetInfo.put("mapping", toMap(m));
        sheets.add(sheetInfo);
      }
    }
    out.put("sheets", sheets);
    return out;
  }

  private Map<String, String> toMap(ColumnMapping m) {
    Map<String, String> map = new LinkedHashMap<>();
    map.put("gi", m.gi); map.put("code", m.code); map.put("tier", m.tier);
    map.put("tierFrom", m.tierFrom); map.put("tierTo", m.tierTo);
    map.put("assetType", m.assetType); map.put("symbolFrom", m.symbolFrom);
    map.put("symbolTo", m.symbolTo); map.put("busbarShape", m.busbarShape);
    map.put("capacity", m.capacity); map.put("ibtNumber", m.ibtNumber);
    map.put("from", m.from); map.put("to", m.to); map.put("lineName", m.lineName);
    map.put("voltage", m.voltage); map.put("risk", m.risk); map.put("riskNumber", m.riskNumber);
    map.put("load", m.load); map.put("loadC2", m.loadC2); map.put("circuits", m.circuits);
    map.put("circuitNumber", m.circuitNumber); map.put("lengthKm", m.lengthKm);
    map.put("corridor", m.corridor); map.put("uit", m.uit); map.put("condition", m.condition);
    map.put("impact", m.impact); map.put("mitigation", m.mitigation);
    map.put("solution", m.solution); map.put("bus150", m.bus150); map.put("feeder", m.feeder);
    map.put("bayKind", m.bayKind); map.put("viewKey", m.viewKey); map.put("status", m.status);
    map.put("noKerawanan", m.noKerawanan); map.put("connectedTo", m.connectedTo);
    map.put("impactedGis", m.impactedGis); map.put("functLoc", m.functLoc);
    return map;
  }

  @PostMapping("/api/sld/parse")
  public EngineDto.ApiResponse parse(@RequestParam("file") MultipartFile file) {
    return service.parse(file);
  }
}