package com.iconplus.sld.mapping;

import java.util.List;

/** Kontrak mapping kolom — port `ColumnMapping` di mapping.ts. */
public class ColumnMapping {
  public String gi;
  public String code;
  public String tier;
  public String tierFrom;
  public String tierTo;
  public String assetType;
  public String symbolFrom;
  public String symbolTo;
  public String busbarShape;
  public String capacity;
  public String ibtNumber;
  public String from;
  public String to;
  public String lineName;
  public String voltage;
  public String risk;
  public String riskNumber;
  public String load;
  public String loadC2;
  public String circuits;
  public String circuitNumber;
  public String lengthKm;
  public String corridor;
  public String uit;
  public String condition;
  public String impact;
  public String mitigation;
  public String solution;
  public String bus150;
  public String feeder;
  public String bayKind;
  public String viewKey;
  public String status;
  public String noKerawanan;
  public String connectedTo;
  public String impactedGis;
  public String functLoc;

  public static ColumnMapping empty() {
    ColumnMapping m = new ColumnMapping();
    m.gi = ""; m.code = ""; m.tier = ""; m.tierFrom = ""; m.tierTo = "";
    m.assetType = ""; m.symbolFrom = ""; m.symbolTo = ""; m.busbarShape = "";
    m.capacity = ""; m.ibtNumber = ""; m.from = ""; m.to = ""; m.lineName = "";
    m.voltage = ""; m.risk = ""; m.riskNumber = ""; m.load = ""; m.loadC2 = "";
    m.circuits = ""; m.circuitNumber = ""; m.lengthKm = ""; m.corridor = "";
    m.uit = ""; m.condition = ""; m.impact = ""; m.mitigation = "";
    m.solution = ""; m.bus150 = ""; m.feeder = ""; m.bayKind = "";
    m.viewKey = ""; m.status = ""; m.noKerawanan = ""; m.connectedTo = "";
    m.impactedGis = ""; m.functLoc = "";
    return m;
  }
}