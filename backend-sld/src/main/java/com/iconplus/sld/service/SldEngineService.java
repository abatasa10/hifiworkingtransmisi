package com.iconplus.sld.service;

import com.iconplus.sld.adapter.Adapter;
import com.iconplus.sld.dto.EngineDto;
import com.iconplus.sld.dto.EnginePayloadDto;
import com.iconplus.sld.dto.ViewModelDto;
import com.iconplus.sld.graph.GraphEngine;
import com.iconplus.sld.layout.LayoutEngine;
import com.iconplus.sld.parser.Parser;
import com.iconplus.sld.reader.ExcelReader;
import com.iconplus.sld.tier.TierEngine;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.apache.poi.ss.usermodel.Workbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Mesin SLD (tahap 1–5 selesai): end-to-end pipeline Java 1:1 dengan
 * front-end — baca Excel (POI) → deteksi kolom → Parser (payload) →
 * TierEngine → Adapter (view-model) → LayoutEngine → GraphEngine
 * (graf EngSldGraph asli). Bukan lagi mock.
 */
@Service
public class SldEngineService {

  private final ExcelReader excel = new ExcelReader();
  private final Parser parser = new Parser();

  public EngineDto.ApiResponse parse(MultipartFile file) throws Exception {
    long start = System.currentTimeMillis();
    EngineDto.ApiResponse res = new EngineDto.ApiResponse();

    String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
    try (InputStream in = file.getInputStream();
         Workbook wb = excel.open(in)) {

      EnginePayloadDto.ParseResult pr = parser.parseWorkbookToPayload(wb, filename);
      Map<String, Integer> tierMap = TierEngine.computeTiers(pr.payload);
      String subsystemName = (pr.payload.subsystem.name == null || pr.payload.subsystem.name.isBlank())
          ? "SLD" : pr.payload.subsystem.name;

      ViewModelDto.Result vm = Adapter.toViewModel(pr.payload, tierMap, subsystemName);

      List<ViewModelDto.Line> allLines = new ArrayList<>(vm.ibrLinks);
      allLines.addAll(vm.lineList);

      Map<String, LayoutEngine.NodePosition> pos =
          LayoutEngine.computeEngineLayout(vm.giList, allLines, tierMap);

      res.graph = GraphEngine.toEngSldGraph(
          vm.giList, allLines, pos, pr.payload.risks, "upload", subsystemName, subsystemName);
      res.meta.filename = filename;
      res.meta.engine = "spring-boot-java (engine sld)";

      for (EnginePayloadDto.Issue i : pr.issues) {
        EngineDto.Issue out = new EngineDto.Issue();
        out.level = i.level;
        out.message = i.message;
        res.issues.add(out);
      }
    }

    res.meta.elapsedMs = System.currentTimeMillis() - start;
    return res;
  }
}