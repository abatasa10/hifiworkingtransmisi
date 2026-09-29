package com.iconplus.sld.web;

import com.iconplus.sld.dto.EngineDto;
import com.iconplus.sld.service.SldEngineService;
import java.util.Map;
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

  @PostMapping("/api/sld/parse")
  public EngineDto.ApiResponse parse(@RequestParam("file") MultipartFile file) {
    return service.parse(file);
  }
}