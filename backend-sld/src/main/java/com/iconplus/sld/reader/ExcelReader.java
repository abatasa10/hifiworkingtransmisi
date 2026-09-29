package com.iconplus.sld.reader;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;

/**
 * Tahap 1 — baca Excel (port `readHeaderRows`/`sheetHeaders` di parser.ts).
 * Semua sel dibaca sebagai teks (DataFormatter) seperti perilaku `xlsx`
 * library: angka menjadi string, null menjadi "".
 */
public class ExcelReader {

  private static final DataFormatter FMT = new DataFormatter();

  /** baca workbook dari input stream (mendukung .xlsx dan .xls). */
  public Workbook open(InputStream in) throws Exception {
    return WorkbookFactory.create(in);
  }

  public List<String> sheetNames(Workbook wb) {
    List<String> names = new ArrayList<>();
    for (int i = 0; i < wb.getNumberOfSheets(); i++) {
      names.add(wb.getSheetName(i));
    }
    return names;
  }

  /** seluruh isi sheet sebagai grid baris → kolom (teks). */
  public List<List<String>> grid(Sheet sheet) {
    List<List<String>> out = new ArrayList<>();
    for (Row row : sheet) {
      List<String> cells = new ArrayList<>();
      int last = row.getLastCellNum();
      for (int i = 0; i < last; i++) {
        Cell c = row.getCell(i);
        cells.add(c == null ? "" : FMT.formatCellValue(c));
      }
      out.add(cells);
    }
    return out;
  }

  /** hasil deteksi baris header + baris data (key-value per header). */
  public static class HeaderRows {
    public List<String> headers = new ArrayList<>();
    public List<Map<String, String>> rows = new ArrayList<>();
  }

  /**
   * Mirip `readHeaderRows` (parser.ts): cari baris header di 25 baris pertama
   * (row yang memuat kata kunci GI/gardu/asset/tier/dst., tanpa sel panjang),
   * lalu jadikan baris-baris berikutnya sebagai data keyed-by-header.
   */
  public HeaderRows readHeaderRows(Sheet sheet) {
    List<List<String>> grid = grid(sheet);
    int headerIdx = -1;
    List<String> headers = new ArrayList<>();

    int limit = Math.min(25, grid.size());
    for (int r = 0; r < limit && headerIdx < 0; r++) {
      List<String> row = grid.get(r);
      if (row.isEmpty()) continue;
      List<String> h = new ArrayList<>();
      for (String c : row) {
        if (!c.isBlank()) h.add(c.trim());
      }
      if (h.isEmpty()) continue;
      boolean longCell = h.stream().anyMatch(c -> c.length() > 60);
      if (longCell) continue;
      String key = cleanKey(String.join(" ", h));
      if (containsAny(key,
          "gi", "gardu", "asset", "nama", "darigi", "penghantar", "tier",
          "kode", "ibt", "bus", "trafo", "kerawanan")) {
        headerIdx = r;
        headers = h;
      }
    }

    HeaderRows hr = new HeaderRows();
    if (headerIdx < 0) return hr;
    hr.headers = headers;

    for (int r = headerIdx + 1; r < grid.size(); r++) {
      List<String> raw = grid.get(r);
      boolean any = raw.stream().anyMatch(s -> !s.isBlank());
      if (!any) continue;
      Map<String, String> o = new LinkedHashMap<>();
      for (int i = 0; i < headers.size() && i < raw.size(); i++) {
        o.put(headers.get(i), raw.get(i));
      }
      hr.rows.add(o);
    }
    return hr;
  }

  /** header baris (baris tak-kosong pertama), seperti `sheetHeaders`. */
  public List<String> sheetHeaders(Sheet sheet) {
    for (List<String> row : grid(sheet)) {
      if (row.isEmpty()) continue;
      List<String> h = new ArrayList<>();
      for (String c : row) {
        if (!c.isBlank()) h.add(c.trim());
      }
      if (!h.isEmpty()) return h;
    }
    return List.of();
  }

  /** port `cleanKey` di mapping.ts (lowercase, buang non a-z0-9). */
  public static String cleanKey(String s) {
    StringBuilder sb = new StringBuilder();
    for (char ch : (s == null ? "" : s).toLowerCase().toCharArray()) {
      if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9')) sb.append(ch);
    }
    return sb.toString();
  }

  private static boolean containsAny(String s, String... keys) {
    for (String k : keys) {
      if (s.contains(k)) return true;
    }
    return false;
  }
}