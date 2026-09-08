-- ============================================================
-- SEED DATA: DASHBOARD PETA KERAWANAN SISTEM TENAGA LISTRIK 2026
-- ============================================================

-- Systems
INSERT INTO systems (id, name, region, risk_level, upb_count, subsystem_count, asset_count, gi_count, ibt_count, latitude, longitude, description) VALUES
('jamali', 'Jawa, Madura dan Bali', 'Jawa, Madura & Bali', 'Rawan', 6, 12, 321, 263, 58, -7.2504, 110.0000, 'Sistem interkoneksi backbone 500 kV & 150 kV terbesar di Indonesia dengan beban puncak mencapai 32.500 MW.'),
('sumatera', 'Sumatera', 'Sumatera Bagian Utara, Tengah & Selatan', 'Sedang', 4, 8, 184, 142, 32, 0.5897, 101.3431, 'Sistem interkoneksi tol listrik 275 kV & 150 kV menghubungkan Aceh hingga Lampung.');

-- UPBs
INSERT INTO upbs (id, system_id, name, short_name, region, gi_count, subsystem_count, risk_count, risk_level, latitude, longitude) VALUES
('upb-banten', 'jamali', 'UP2B Banten', 'BANTEN', 'Banten', 38, 2, 4, 'Rawan', -6.1200, 106.1503),
('upb-jakarta', 'jamali', 'UP2B Jakarta dan Banten (P2B DKI)', 'JAKARTA', 'DKI Jakarta', 52, 3, 8, 'Sangat Rawan', -6.2088, 106.8456),
('upb-jabar', 'jamali', 'UP2B Jawa Barat', 'JAWA BARAT', 'Jawa Barat', 58, 3, 6, 'Rawan', -6.9175, 107.6191),
('upb-jateng', 'jamali', 'UP2B Jawa Tengah dan DIY', 'JAWA TENGAH', 'Jawa Tengah & D.I. Yogyakarta', 49, 2, 5, 'Sedang', -7.1509, 110.1402),
('upb-jatim', 'jamali', 'UP2B Jawa Timur', 'JAWA TIMUR', 'Jawa Timur & Madura', 54, 2, 7, 'Rawan', -7.5360, 112.2384),
('upb-bali', 'jamali', 'UP2B Bali', 'BALI', 'Bali', 12, 1, 1, 'Sedang', -8.4095, 115.1889);

-- Subsystems
INSERT INTO subsystems (id, upb_id, name, gi_count, transformer_count, peak_load_mw, risk_level, risk_count, description) VALUES
('sub-durkos-mkrng', 'upb-jakarta', 'Subsistem Duri Kosambi - Muara Karang', 12, 22, 1700, 'Sangat Rawan', 3, 'Mendapat pasokan radial dari SUTET Gandul-Durkos-Kembangan dengan pembebanan tinggi.'),
('sub-bogor', 'upb-jabar', 'Subsistem Bogor', 8, 14, 920, 'Rawan', 2, 'Dipasok dari GITET Bogor 500 kV dengan IBT 500/150 kV melayani beban industri dan pemukiman Bogor Raya.'),
('sub-krian-gresik', 'upb-jatim', 'Subsistem Krian 1,2 - Gresik 1,2', 16, 28, 2250, 'Rawan', 2, 'Pusat beban industri Surabaya dan Gresik yang didukung PLTU/PLTGU Gresik dan GITET Krian.');

-- Risk #7 (Verbatim dari dokumen 2026)
INSERT INTO risks (id, number, name, asset_type, voltage, risk_level, operating_status, condition, impact, mitigation, solution_short_term, location) VALUES
(7, 7, 'SUTET Gandul - Durkos - Kembangan', 'SUTET', '500 kV', 'Sedang', 'Beroperasi',
'SUTET Gandul-Durkos-Kembangan memasok 2 IBT Durkosambi dan 2 IBT Muarakarang secara radial, dengan pembebanan SUTET Gandul-Durkos mencapai 55%, sedangkan SUTET Kembangan-Durkos mencapai 43%.',
'Jika terjadi kondisi N-2 SUTET Gandul-Durkos-Kembangan, terjadi pembebanan Konsumen dikarenakan padam IBT Muarakarang dan Durikosambi sebesar 1.700 MW.',
'Terpasang Defense Scheme N-2 pada SUTET Gandul-Durkos-Kembangan.',
ARRAY[
  '1. Percepatan pembangunan SUTET Muaratawar - Priok. RUPTL 2025-2034, COD Tahun 2025. COD timeline proyek Desember 2026.',
  '2. Percepatan pembangunan SUTET Priok - Muarakarang. RUPTL 2025-2034, COD di Tahun 2027.'
],
'DKI Jakarta & Jawa Barat (Gandul - Duri Kosambi - Kembangan)');

-- Nodes
INSERT INTO nodes (id, subsystem_id, name, code, type, voltage, tier, capacity_mw, capacity_mva, status, x_pos, y_pos) VALUES
('GI_GNDUL', 'sub-durkos-mkrng', 'GITET Gandul', 'GNDUL', 'gitet', '500 kV', 4, NULL, NULL, 'Beroperasi', 60, 550),
('GI_DKSBI', 'sub-durkos-mkrng', 'GITET Duri Kosambi', 'DKSBI', 'gitet', '500 kV', 5, NULL, NULL, 'Beroperasi', 60, 680),
('GI_KMBNG', 'sub-durkos-mkrng', 'GITET Kembangan', 'KMBNG', 'gitet', '500 kV', 3, NULL, NULL, 'Beroperasi', 140, 390),
('GI_MKRNG', 'sub-durkos-mkrng', 'GITET Muara Karang', 'MKRNG', 'gitet', '500 kV', 6, NULL, NULL, 'Beroperasi', 120, 800),
('IBT_DKSBI', 'sub-durkos-mkrng', 'IBT Durkosambi 1 & 2', 'IBT DKSBI', 'ibt', '500/150 kV', 5, NULL, 1000, 'Beroperasi', 150, 680),
('IBT_MKRNG', 'sub-durkos-mkrng', 'IBT Muarakarang 1 & 2', 'IBT MKRNG', 'ibt', '500/150 kV', 6, NULL, 1000, 'Beroperasi', 220, 800);

-- Edges
INSERT INTO edges (id, source_node_id, target_node_id, name, type, voltage, circuit_count, length_km, loading_circuit_1, loading_circuit_2, operating_status, status, risk_id) VALUES
('LINE_GNDUL_DKSBI', 'GI_GNDUL', 'GI_DKSBI', 'SUTET Gandul - Durkos', 'transmission', '500 kV', 2, 36.2, 55, 43, 'Beroperasi', 'warning', 7),
('LINE_DKSBI_KMBNG', 'GI_DKSBI', 'GI_KMBNG', 'SUTET Durkos - Kembangan', 'transmission', '500 kV', 2, 36.3, 43, 40, 'Beroperasi', 'warning', 7),
('LINE_DKSBI_MKRNG', 'GI_DKSBI', 'GI_MKRNG', 'SUTET Duri Kosambi - Muara Karang', 'transmission', '500 kV', 2, 21.0, 48, 45, 'Beroperasi', 'normal', NULL);

-- Risk Assets
INSERT INTO risk_assets (risk_id, node_id, edge_id, relationship_role) VALUES
(7, 'GI_GNDUL', NULL, 'Gardu Induk Pangkal'),
(7, 'GI_DKSBI', NULL, 'Gardu Induk Antara / Pasokan Radial'),
(7, 'GI_KMBNG', NULL, 'Gardu Induk Ujung'),
(7, NULL, 'LINE_GNDUL_DKSBI', 'Saluran Transmisi Utama'),
(7, NULL, 'LINE_DKSBI_KMBNG', 'Saluran Transmisi Terkait');
