package com.iconplus.sld.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * View-model SLD — port `ParsedGINode`/`ParsedTransmissionLine`
 * (data/customSLDStore.ts). Hasil `Adapter.toViewModel`; dipakai engine
 * layout (tahap 5) untuk menghitung koordinat node/line.
 */
public class ViewModelDto {

  public static class GiNode {
    public String id;
    public String name;
    public String code;
    public String assetType;
    public String voltage;
    public Integer tier;
    public String ibtNumber;
    public String primaryVoltage;
    public String secondaryVoltage;
    public Double capacityMVA;
    public String region;
    public String riskStatus;
    public Integer riskNumber;
    public String subsystem;
    public String uit;
    public String condition;
    public String impact;
    public String mitigation;
    public String solution;
    public Boolean isBay;
    public String feederKey;
    public String objectType;
    public String unitNo;
    public String busLvKey;
    public String functLoc;
    public List<String> connectedKeys = new ArrayList<>();
    public List<String> connectedNames = new ArrayList<>();
    public List<String> impactedKeys = new ArrayList<>();
    public List<String> impactedNames = new ArrayList<>();
  }

  public static class Line {
    public String id;
    public String sourceId;
    public String targetId;
    public String lineName;
    public String circuit;
    public Integer circuitCount;
    public Integer circuitNumber;
    public Double lengthKm;
    public Double loadingPct;
    public Double loadingCircuit1;
    public Double loadingCircuit2;
    public String voltage;
    public String operatingStatus;
    public String riskStatus;
    public Integer riskNumber;
    public String region;
    public String corridor;
    public String uit;
    public String condition;
    public String impact;
    public String mitigation;
    public String solution;
    public String sourceName;
    public String targetName;
    public List<String> impactedNames = new ArrayList<>();
  }

  /** pembungkus hasil toViewModel + info tier untuk verifikasi parity. */
  public static class Result {
    public List<GiNode> giList = new ArrayList<>();
    public List<Line> lineList = new ArrayList<>();
    public List<Line> ibrLinks = new ArrayList<>();
    public Integer tierMin;
    public Integer tierMax;
  }
}