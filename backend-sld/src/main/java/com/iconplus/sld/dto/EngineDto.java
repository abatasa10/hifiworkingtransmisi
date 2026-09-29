package com.iconplus.sld.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * Kontrak JSON yang dikembalikan backend ke front-end.
 * Bentuknya meniru struktur "EngSldGraph" di aplikasi React
 * (src/lib/sld/engineSld.ts) supaya SldSvgCanvas bisa langsung merender.
 */
public class EngineDto {

  public static class Graph {
    public String id;
    public String title;
    public String viewName;
    public int tierCount;
    public List<Node> nodes = new ArrayList<>();
    public List<Circuit> circuits = new ArrayList<>();
    public List<Ibt> ibts = new ArrayList<>();
    public List<Bay> bays = new ArrayList<>();
    public List<Pin> pins = new ArrayList<>();
  }

  public static class Node {
    public String code;
    public String label;
    public String name;
    public String type; // GITET | GI | GIS | GENERATING_UNIT | BEBAN
    public double voltageKv;
    public String role; // SOURCE | CORE | BOUNDARY
    public int tier;
    public String status; // ENERGIZED | DE_ENERGIZED | PLANNED
    public double x;
    public double halfWidth;
    public boolean labelTop;
    public boolean stackedAbove;
  }

  public static class Circuit {
    public String id;
    public String code;
    public String name;
    public String type; // SUTT | SKTT
    public double voltageKv;
    public String from;
    public String to;
    public double fromPort;
    public double toPort;
    public int circuitCount;
    public String status;
    public double loadingPct;
  }

  public static class Ibt {
    public String id;
    public String code;
    public String name;
    public String from;
    public String to;
    public double x;
    public String status;
  }

  public static class Bay {
    public String id;
    public String code;
    public String name;
    public String busCode;
    public double x;
    public int circuitCount;
    public String status;
  }

  public static class Pin {
    public int seq;
    public String kind; // SUBSTATION | CIRCUIT | TRANSFORMER
    public String code;
  }

  public static class Meta {
    public String filename;
    public String engine;
    public long elapsedMs;
  }

  public static class Issue {
    public String level; // error | warning | info
    public String message;
  }

  /** Pembungkus respons POST /api/sld/parse. */
  public static class ApiResponse {
    public Graph graph = new Graph();
    public Meta meta = new Meta();
    public List<Issue> issues = new ArrayList<>();
  }
}