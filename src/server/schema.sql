-- ============================================================
-- DATABASE SCHEMA: DASHBOARD PETA KERAWANAN SISTEM TENAGA LISTRIK
-- Based on: Buku Kerawanan Sistem & Subsistem Jawa, Madura dan Bali Tahun 2026
-- Database: PostgreSQL 14+
-- ============================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SYSTEMS (Peta Nasional)
CREATE TABLE systems (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('Sangat Rawan', 'Rawan', 'Sedang', 'Aman')),
    upb_count INT DEFAULT 0,
    subsystem_count INT DEFAULT 0,
    asset_count INT DEFAULT 0,
    gi_count INT DEFAULT 0,
    ibt_count INT DEFAULT 0,
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. UPBS (Unit Pelaksana Pengatur Beban)
CREATE TABLE upbs (
    id VARCHAR(50) PRIMARY KEY,
    system_id VARCHAR(50) NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    short_name VARCHAR(50) NOT NULL,
    region VARCHAR(100) NOT NULL,
    gi_count INT DEFAULT 0,
    subsystem_count INT DEFAULT 0,
    risk_count INT DEFAULT 0,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('Sangat Rawan', 'Rawan', 'Sedang', 'Aman')),
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. SUBSYSTEMS
CREATE TABLE subsystems (
    id VARCHAR(50) PRIMARY KEY,
    upb_id VARCHAR(50) NOT NULL REFERENCES upbs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    gi_count INT DEFAULT 0,
    transformer_count INT DEFAULT 0,
    peak_load_mw NUMERIC(10,2) DEFAULT 0,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('Sangat Rawan', 'Rawan', 'Sedang', 'Aman')),
    risk_count INT DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. RISKS (Kerawanan Sistem)
CREATE TABLE risks (
    id SERIAL PRIMARY KEY,
    number INT UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('SUTET', 'SUTT', 'IBT', 'GI', 'GITET', 'Pembangkit', 'Peralatan')),
    voltage VARCHAR(20) NOT NULL,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('Sangat Rawan', 'Rawan', 'Sedang', 'Aman')),
    operating_status VARCHAR(50) DEFAULT 'Beroperasi',
    condition TEXT NOT NULL,
    impact TEXT NOT NULL,
    mitigation TEXT NOT NULL,
    solution_short_term TEXT[],
    solution_medium_term TEXT[],
    location VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. NODES (GI, GITET, IBT, Pembangkit, Busbar, Bay)
CREATE TABLE nodes (
    id VARCHAR(50) PRIMARY KEY,
    subsystem_id VARCHAR(50) REFERENCES subsystems(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('gitet', 'gi', 'generator', 'ibt', 'busbar', 'bay')),
    voltage VARCHAR(20) NOT NULL,
    tier INT NOT NULL CHECK (tier BETWEEN 1 AND 6),
    capacity_mw NUMERIC(10,2),
    capacity_mva NUMERIC(10,2),
    status VARCHAR(50) DEFAULT 'Beroperasi',
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    x_pos NUMERIC(10,2) NOT NULL DEFAULT 0,
    y_pos NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. EDGES (Saluran Transmisi & Koppel Penghubung)
-- PENTING: Menggunakan ID relasional, bukan string nama!
CREATE TABLE edges (
    id VARCHAR(50) PRIMARY KEY,
    source_node_id VARCHAR(50) NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    target_node_id VARCHAR(50) NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('transmission', 'transformer_link', 'koppel')),
    voltage VARCHAR(20) NOT NULL,
    circuit_count INT NOT NULL DEFAULT 2,
    length_km NUMERIC(8,2),
    loading_circuit_1 NUMERIC(5,2) DEFAULT 0,
    loading_circuit_2 NUMERIC(5,2) DEFAULT 0,
    loading_circuit_3 NUMERIC(5,2),
    loading_circuit_4 NUMERIC(5,2),
    operating_status VARCHAR(50) DEFAULT 'Beroperasi',
    status VARCHAR(50) DEFAULT 'normal' CHECK (status IN ('normal', 'warning', 'critical', 'planned')),
    risk_id INT REFERENCES risks(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. RISK_ASSETS (M2M Relationship Kerawanan ke Aset)
CREATE TABLE risk_assets (
    id SERIAL PRIMARY KEY,
    risk_id INT NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
    node_id VARCHAR(50) REFERENCES nodes(id) ON DELETE CASCADE,
    edge_id VARCHAR(50) REFERENCES edges(id) ON DELETE CASCADE,
    relationship_role VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_asset_target CHECK (node_id IS NOT NULL OR edge_id IS NOT NULL)
);

-- INDEXES for Ultra-Fast Graph Queries
CREATE INDEX idx_edges_source ON edges(source_node_id);
CREATE INDEX idx_edges_target ON edges(target_node_id);
CREATE INDEX idx_edges_risk ON edges(risk_id);
CREATE INDEX idx_nodes_subsystem ON nodes(subsystem_id);
CREATE INDEX idx_nodes_tier ON nodes(tier);
CREATE INDEX idx_risk_assets_risk ON risk_assets(risk_id);
CREATE INDEX idx_subsystems_upb ON subsystems(upb_id);
