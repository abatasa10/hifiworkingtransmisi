package com.iconplus.sld.dto;

import java.util.ArrayList;
import java.util.List;

/** DTO hasil parsing — port `types.ts` (EnginePayload dan temannya). */
public class EnginePayloadDto {

  public static class Meta {
    public String filename;
    public String document_type;
    public String analytical_hint;
    public String source_ref;
    public String effective_date;
  }

  public static class Subsystem {
    public String code;
    public String name;
    public String apb;
    public List<View> views = new ArrayList<>();
  }

  public static class View {
    public String view_key;
    public String name;
    public List<String> source_keys = new ArrayList<>();
  }

  public static class Object {
    public String external_key;
    public String object_type;
    public String raw_label;
    public String site_name;
    public Double voltage_hv_kv;
    public Double voltage_lv_kv;
    public String unit_no;
    public Integer tier_hint;
    public String status_hint;
    public Double confidence;
    public Boolean is_bay;
    public String bay_feeder_key;
    public String bay_kind;
    public Boolean has_transformer;
    public Boolean has_capacitor;
    public Integer transformer_count;
    public Integer capacitor_count;
    public String symbol_note;
    public List<String> view_keys = new ArrayList<>();
    public String outlet_key;
    public String role_hint;
    public Integer bay_circuit_count;
    public List<Integer> risk_seq = new ArrayList<>();
    public String risk_level;
    public List<String> connected_keys = new ArrayList<>();
    public List<String> impacted_keys = new ArrayList<>();
    public String funct_loc;
    public String condition;
    public String impact;
    public String mitigation;
    public String follow_up;
  }

  public static class Connection {
    public String from_external_key;
    public String to_external_key;
    public String relation_type;
    public String circuit_type_hint;
    public String status_hint;
    public Integer circuit_count;
    public Integer circuit_number;
    public String unit_no;
    public Boolean single_phi;
    public Double confidence;
    public String note;
    public List<String> view_keys = new ArrayList<>();
    public String line_name;
    public Double voltage_kv;
    public Double length_km;
    public Double loading_c1;
    public Double loading_c2;
    public String corridor;
    public String uit;
    public Integer tier_from_hint;
    public Integer tier_to_hint;
    public List<Integer> risk_seq = new ArrayList<>();
    public String risk_level;
    public String condition;
    public String impact;
    public String mitigation;
    public String follow_up;
  }

  public static class Risk {
    public Integer seq_no;
    public String uit;
    public String category;
    public String title;
    public String condition;
    public String impact;
    public String mitigation;
    public String follow_up;
    public String pin_kind;
    public String pin_key;
  }

  public static class Payload {
    public Meta meta = new Meta();
    public Subsystem subsystem = new Subsystem();
    public List<Object> objects = new ArrayList<>();
    public List<Connection> connections = new ArrayList<>();
    public List<Risk> risks = new ArrayList<>();
  }

  public static class ParseResult {
    public Payload payload;
    public List<Issue> issues = new ArrayList<>();
  }

  public static class Issue {
    public String level;
    public String message;
  }
}