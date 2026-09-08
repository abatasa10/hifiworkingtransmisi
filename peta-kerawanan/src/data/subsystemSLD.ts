import { Node, Edge } from '@xyflow/react';
import { SLDNodeData, SLDEdgeData } from '../types/graph';

export const subsystemBogorNodes: Node<SLDNodeData>[] = [
  // Incoming Feeder Heads (500 kV)
  {
    id: 'FEED_BOGOR_BKASI',
    type: 'busbar',
    position: { x: 180, y: 50 },
    data: { id: 'FEED_BOGOR_BKASI', name: 'Bay Penghantar Ke GI Bekasi', code: 'Ke GI Bekasi', type: 'bay', voltage: '500 kV', tier: 1, status: 'Beroperasi' }
  },
  {
    id: 'FEED_BOGOR_CIBNG',
    type: 'busbar',
    position: { x: 520, y: 50 },
    data: { id: 'FEED_BOGOR_CIBNG', name: 'Bay Penghantar Ke GI Cibinong', code: 'Ke GI Cibinong', type: 'bay', voltage: '500 kV', tier: 1, status: 'Beroperasi' }
  },

  // Main 500 kV Busbar: GI BOGOR 500 kV
  {
    id: 'BUS_BOGOR_500KV',
    type: 'busbar',
    position: { x: 140, y: 190 },
    data: { id: 'BUS_BOGOR_500KV', name: 'GI BOGOR 500 kV (Busbar Utama A & B)', code: 'GI BOGOR 500 kV', type: 'gitet', voltage: '500 kV', tier: 2, status: 'Beroperasi' }
  },

  // IBT Transformers (500/150 kV)
  {
    id: 'IBT_BOGOR_1',
    type: 'ibt',
    position: { x: 200, y: 310 },
    data: { id: 'IBT_BOGOR_1', name: 'IBT 1 Bogor 500/150 kV (500 MVA)', code: 'IBT 1 (500 MVA)', type: 'ibt', voltage: '500/150 kV', tier: 3, capacityMVA: 500, loading: 68, circuits: 1, status: 'Beroperasi' }
  },
  {
    id: 'IBT_BOGOR_2',
    type: 'ibt',
    position: { x: 500, y: 310 },
    data: { id: 'IBT_BOGOR_2', name: 'IBT 2 Bogor 500/150 kV (500 MVA)', code: 'IBT 2 (500 MVA)', type: 'ibt', voltage: '500/150 kV', tier: 3, capacityMVA: 500, loading: 62, circuits: 1, status: 'Beroperasi' }
  },

  // 150 kV Feeders to distribution GI
  {
    id: 'FEED_BOGOR_CLNGS',
    type: 'busbar',
    position: { x: 160, y: 460 },
    data: { id: 'FEED_BOGOR_CLNGS', name: 'Penyulang 150 kV Ke GI Cileungsi', code: 'Ke GI Cileungsi', type: 'gi', voltage: '150 kV', tier: 4, status: 'Beroperasi' }
  },
  {
    id: 'FEED_BOGOR_PARUNG',
    type: 'busbar',
    position: { x: 480, y: 460 },
    data: { id: 'FEED_BOGOR_PARUNG', name: 'Penyulang 150 kV Ke GI Parung', code: 'Ke GI Parung', type: 'gi', voltage: '150 kV', tier: 4, status: 'Beroperasi' }
  }
];

export const subsystemBogorEdges: Edge<SLDEdgeData>[] = [
  {
    id: 'EDGE_BKASI_BOGOR',
    source: 'FEED_BOGOR_BKASI',
    target: 'BUS_BOGOR_500KV',
    type: 'transmission',
    data: {
      id: 'EDGE_BKASI_BOGOR',
      source: 'FEED_BOGOR_BKASI',
      target: 'BUS_BOGOR_500KV',
      name: 'SUTET Bekasi - Bogor 500 kV',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 34.2,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 58, circuit2: 54 }
    }
  },
  {
    id: 'EDGE_CIBNG_BOGOR',
    source: 'FEED_BOGOR_CIBNG',
    target: 'BUS_BOGOR_500KV',
    type: 'transmission',
    data: {
      id: 'EDGE_CIBNG_BOGOR',
      source: 'FEED_BOGOR_CIBNG',
      target: 'BUS_BOGOR_500KV',
      name: 'SUTET Cibinong - Bogor 500 kV',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 18.6,
      operatingStatus: 'Beroperasi',
      status: 'warning',
      loading: { circuit1: 72, circuit2: 68 },
      riskId: 2,
      riskLevel: 'Rawan'
    }
  },
  {
    id: 'EDGE_BUS_IBT1',
    source: 'BUS_BOGOR_500KV',
    target: 'IBT_BOGOR_1',
    type: 'transformer_link',
    data: {
      id: 'EDGE_BUS_IBT1',
      source: 'BUS_BOGOR_500KV',
      target: 'IBT_BOGOR_1',
      name: 'Bay IBT 1 500 kV',
      type: 'transformer_link',
      voltage: '500 kV',
      circuitCount: 1,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 68 }
    }
  },
  {
    id: 'EDGE_BUS_IBT2',
    source: 'BUS_BOGOR_500KV',
    target: 'IBT_BOGOR_2',
    type: 'transformer_link',
    data: {
      id: 'EDGE_BUS_IBT2',
      source: 'BUS_BOGOR_500KV',
      target: 'IBT_BOGOR_2',
      name: 'Bay IBT 2 500 kV',
      type: 'transformer_link',
      voltage: '500 kV',
      circuitCount: 1,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 62 }
    }
  },
  {
    id: 'EDGE_IBT1_CLNGS',
    source: 'IBT_BOGOR_1',
    target: 'FEED_BOGOR_CLNGS',
    type: 'transmission',
    data: {
      id: 'EDGE_IBT1_CLNGS',
      source: 'IBT_BOGOR_1',
      target: 'FEED_BOGOR_CLNGS',
      name: 'SUTT 150 kV IBT Bogor - Cileungsi',
      type: 'transmission',
      voltage: '150 kV',
      circuitCount: 2,
      lengthKm: 22.4,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 64, circuit2: 60 }
    }
  },
  {
    id: 'EDGE_IBT2_PARUNG',
    source: 'IBT_BOGOR_2',
    target: 'FEED_BOGOR_PARUNG',
    type: 'transmission',
    data: {
      id: 'EDGE_IBT2_PARUNG',
      source: 'IBT_BOGOR_2',
      target: 'FEED_BOGOR_PARUNG',
      name: 'SUTT 150 kV IBT Bogor - Parung',
      type: 'transmission',
      voltage: '150 kV',
      circuitCount: 2,
      lengthKm: 19.8,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 58, circuit2: 52 }
    }
  }
];
