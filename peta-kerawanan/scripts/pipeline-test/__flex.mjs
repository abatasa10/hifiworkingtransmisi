import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";
//#region src/lib/sld/mapping.ts
var emptyColumnMapping = () => ({
	gi: "",
	code: "",
	tier: "",
	tierFrom: "",
	tierTo: "",
	assetType: "",
	symbolFrom: "",
	symbolTo: "",
	busbarShape: "",
	capacity: "",
	ibtNumber: "",
	from: "",
	to: "",
	lineName: "",
	voltage: "",
	risk: "",
	riskNumber: "",
	load: "",
	loadC2: "",
	circuits: "",
	circuitNumber: "",
	lengthKm: "",
	corridor: "",
	uit: "",
	condition: "",
	impact: "",
	mitigation: "",
	solution: "",
	bus150: "",
	feeder: "",
	bayKind: "",
	viewKey: "",
	status: "",
	noKerawanan: "",
	connectedTo: "",
	impactedGis: "",
	functLoc: ""
});
var cleanKey = (str) => {
	return String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
};
var autoDetectMapping = (headers) => {
	const colMap = {};
	headers.forEach((h) => {
		colMap[cleanKey(h)] = h;
	});
	const findHeader = (patterns, exclude = []) => {
		for (const p of patterns) for (const k of Object.keys(colMap)) {
			const originalHeader = colMap[k];
			if (exclude.includes(originalHeader)) continue;
			if (k === p || k.includes(p)) return originalHeader;
		}
		return "";
	};
	const headerKeys = headers.map(cleanKey);
	const fromRaw = headerKeys.find((k) => /^(darigi|bus1|source|pangkal|dari|from|asal)$/.test(k)) || headerKeys.find((k) => k.includes("darigi"));
	const toRaw = headerKeys.find((k) => /^(kegi|bus2|target|ujung|ke|to|tujuan)$/.test(k)) || headerKeys.find((k) => k.includes("kegi"));
	const fromCol = fromRaw ? colMap[fromRaw] || "" : "";
	const toCol = toRaw ? colMap[toRaw] || "" : "";
	const lineNameCol = findHeader([
		"namapenghantar",
		"penghantar",
		"namaline",
		"line",
		"jalur",
		"transmisi",
		"bay"
	], [fromCol, toCol]);
	const isLineSheet = Boolean(fromCol && toCol);
	const giCol = findHeader([
		"namaasset",
		"namagarduinduk",
		"namagi",
		"garduinduk",
		"namagardu",
		"functlocgarduinduk",
		"substation",
		"functloc"
	], [
		fromCol,
		toCol,
		lineNameCol
	]) || (isLineSheet ? "" : findHeader([
		"gi",
		"gardu",
		"nama"
	], [
		fromCol,
		toCol,
		lineNameCol
	]));
	const codeCol = findHeader([
		"kodesingkatan",
		"kodesingkat",
		"kode",
		"code",
		"singkatan"
	]);
	const tierCol = findHeader([
		"tiermulai0",
		"tier",
		"leveltier",
		"hirarki",
		"hierarchy",
		"level"
	]);
	const tierFromCol = findHeader([
		"tierdarigi",
		"tierdari",
		"tierfrom",
		"tiersumber",
		"tierasal"
	]);
	const tierToCol = findHeader([
		"tierkegi",
		"tierke",
		"tierto",
		"tiertujuan",
		"tierujung"
	]);
	const assetTypeCol = findHeader([
		"tipesimbolsld",
		"tipesimbol",
		"jenissimbol",
		"tipeasset",
		"tipe",
		"jenisasi",
		"jenis",
		"type"
	]);
	const symbolFromCol = findHeader([
		"tipesimboldarigi",
		"tipesimboldari",
		"simboldarigi",
		"simboldari",
		"tipedarigi",
		"tipedari"
	]);
	const symbolToCol = findHeader([
		"tipesimbolkegi",
		"tipesimbolke",
		"simbolkegi",
		"simbolke",
		"tipekegi",
		"tipeke"
	]);
	const busbarShapeCol = findHeader([
		"bentukbusbar",
		"bentukrel",
		"busbarshape",
		"tipebusbar"
	]);
	const capacityCol = findHeader([
		"kapasitasmva",
		"kapasitasmw",
		"kapasitas",
		"capacity",
		"mva",
		"mw"
	]);
	const ibtNumCol = findHeader([
		"noibt",
		"nomoribt",
		"nomeribt",
		"ibt",
		"unitibt"
	]);
	const voltageCol = findHeader([
		"tegangan",
		"kv",
		"voltage",
		"level"
	]);
	const riskCol = findHeader([
		"tingkatkerawanan",
		"statuskerawanan",
		"kerawanan",
		"statusasset",
		"status",
		"kategori",
		"risk"
	]);
	return {
		gi: giCol,
		code: codeCol,
		tier: tierCol,
		tierFrom: tierFromCol,
		tierTo: tierToCol,
		assetType: assetTypeCol,
		symbolFrom: symbolFromCol,
		symbolTo: symbolToCol,
		busbarShape: busbarShapeCol,
		capacity: capacityCol,
		ibtNumber: ibtNumCol,
		from: fromCol,
		to: toCol,
		lineName: lineNameCol,
		voltage: voltageCol,
		risk: riskCol,
		riskNumber: findHeader([
			"nokerawanan",
			"nomorkerawanan",
			"nomerkerawanan",
			"idkerawanan",
			"norisk"
		]),
		load: findHeader([
			"pembebanansirkit1",
			"pembebanan",
			"loading",
			"bebanmw",
			"load",
			"beban",
			"mw",
			"mva",
			"arus",
			"ampere"
		], [capacityCol || ""]),
		loadC2: findHeader([
			"pembebanansirkit2",
			"beban2",
			"load2",
			"loading2"
		]),
		circuits: findHeader([
			"jumlahsirkit",
			"sirkit",
			"circuits",
			"jmlsirkit"
		]),
		circuitNumber: findHeader([
			"nosirkit",
			"nomorsirkit",
			"sirkitke",
			"circuitno",
			"circuitnum",
			"linesirkit"
		]),
		lengthKm: findHeader([
			"panjangsaluran",
			"panjangkm",
			"panjang",
			"length",
			"km"
		]),
		corridor: findHeader([
			"koridor",
			"wilayah",
			"region",
			"lokasi",
			"provinsi"
		]),
		uit: findHeader([
			"uit",
			"unitinduktransmisi",
			"unitinduk",
			"unit"
		]),
		condition: findHeader([
			"kondisipermasalahan",
			"permasalahan",
			"kondisi",
			"kendala",
			"isu"
		]),
		impact: findHeader([
			"dampak",
			"impact",
			"akibat",
			"risiko"
		]),
		mitigation: findHeader([
			"mitigasi",
			"mitigation",
			"pencegahan",
			"penanganan"
		]),
		solution: findHeader([
			"usulansolusi",
			"usulan",
			"solusi",
			"solution",
			"rekomendasi",
			"jangkapendek"
		]),
		bus150: findHeader([
			"bus150kv",
			"bus150",
			"buslv",
			"kebus",
			"outlet",
			"terhubungkebus"
		]),
		feeder: findHeader([
			"feeder",
			"feedergiinduk",
			"giinduk",
			"induk",
			"feeder"
		]),
		bayKind: findHeader([
			"jenisbay",
			"jenis",
			"tipebay"
		], [assetTypeCol]),
		viewKey: findHeader([
			"sudutpandang",
			"viewkey",
			"kunciview",
			"view",
			"kodesudutpandang"
		]),
		status: findHeader(["statusoperasi", "status"], riskCol && riskCol === "status" ? [riskCol] : []),
		noKerawanan: findHeader([
			"nokerawanan",
			"nomorkerawanan",
			"norisik",
			"norisk"
		]),
		connectedTo: findHeader([
			"terhubungke",
			"terhubung",
			"koneksi",
			"connectedto",
			"connected"
		]),
		impactedGis: findHeader([
			"giterdampak",
			"dampakgi",
			"zonaterdampak",
			"affectedgis"
		]),
		functLoc: findHeader([
			"idfunctloc",
			"functlocid",
			"idfuntloc",
			"funtlocid",
			"functionallocation",
			"functloc",
			"funtloc"
		])
	};
};
//#endregion
//#region src/lib/sld/parser.ts
var norm = (s) => String(s ?? "").trim().toLowerCase();
var str = (v) => String(v ?? "").trim();
var numOr = (v) => {
	if (v === null || v === void 0 || str(v) === "") return null;
	const n = Number(String(v).replace(/,/g, "."));
	return Number.isFinite(n) ? n : null;
};
var pcOr = (v) => {
	const n = numOr(v);
	if (n === null) return null;
	return n > 1 && n <= 1.5 ? n * 100 : n;
};
var kvNum = (v) => {
	if (v === null || v === void 0) return null;
	const s = norm(v).replace(/kv/g, "").split("/")[0].trim().replace(/,/g, ".").replace(/[^0-9.]/g, "");
	const n = Number(s);
	return Number.isFinite(n) && n > 0 ? n : null;
};
var intOr = (v) => {
	const n = numOr(v);
	return n === null ? null : Math.trunc(n);
};
var boolOr = (v) => {
	return [
		"1",
		"true",
		"yes",
		"ya",
		"ada",
		"single",
		"satu fasa"
	].includes(norm(v));
};
var firstLine = (v) => {
	const s = str(v);
	for (const sep of [
		"\n",
		". ",
		";"
	]) {
		const i = s.indexOf(sep);
		if (i > 0) return s.slice(0, i).replace(/^[\d.\s]+/, "").slice(0, 180);
	}
	return s.slice(0, 180);
};
var tokens = (v) => {
	return str(v).replace(/,/g, ";").replace(/&/g, ";").split(";").map((s) => s.trim().toUpperCase()).filter(Boolean);
};
var riskNumbers = (v) => {
	const out = [];
	for (const t of tokens(v)) {
		const n = Number(t);
		if (Number.isFinite(n)) out.push(n);
	}
	return out;
};
/** Split a `Terhubung ke` / `GI Terdampak` cell into deduped clean keys. */
var keyList = (v) => {
	const out = [];
	for (const t of tokens(v)) {
		const k = cleanKey(t);
		if (k && !out.includes(k)) out.push(k);
	}
	return out;
};
var isRawan = (score) => score !== "Normal";
var normalizeRiskLevel = (v) => {
	const s = str(v);
	if (!s) return "Normal";
	const u = s.toUpperCase();
	if (u.includes("N-1-2") || u.includes("N12") || u.includes("N-1-1")) return "N-1-2";
	if (u.includes("N-2") || u.includes("N2")) return "N-2";
	if (u.includes("N-1") || u.includes("N1")) return "N-1";
	if (u.includes("SANGAT RAWAN") || u.includes("SANGAT RAWAN") || u.includes("KRITIS")) return "Sangat Rawan";
	if (u.includes("SEDANG")) return "Sedang";
	if (u.includes("WASPADA") || u.includes("RAWAN")) return "Rawan";
	return "Normal";
};
var statusMap = (v) => {
	const s = norm(v);
	if (!s) return "ENERGIZED";
	if (s.includes("belum")) return "NEW_NOT_ENERGIZED";
	if (s.includes("rencana") || s.includes("planned")) return "PLANNED";
	if (s.includes("padam") || s.includes("de-energ")) return "DE_ENERGIZED";
	if (s.includes("pelanggan") || s.includes("ktt")) return "OWNED_BY_CUSTOMER";
	return "ENERGIZED";
};
var lineTypeHint = (name) => {
	const s = norm(name);
	if (s.includes("sktt") || s.includes("kabel") || s.includes("sku")) return "SKTT";
	return "SUTT";
};
function resolveObjectType(sym, name, volt, bus150) {
	const sL = norm(sym);
	const nL = norm(name);
	const vL = norm(volt);
	const bL = norm(bus150);
	if (!sL && !nL) return {
		object_type: "GI",
		is_bay: false,
		bay_kind: null
	};
	if (sL.includes("bay") || sL.includes("spur") || bL && (nL.includes("bay") || nL.includes("feeder"))) return {
		object_type: "BAY",
		is_bay: true,
		bay_kind: sL.includes("sktt") || sL.includes("kabel") ? "SKTT" : "SUTT"
	};
	if (sL.includes("pembangkit") || sL.includes("generator") || sL.includes("genset") || sL.includes("plt")) return {
		object_type: "GENERATING_UNIT",
		is_bay: false,
		bay_kind: null
	};
	if (sL.includes("trafo") && !sL.includes("ibt")) return {
		object_type: "TRAFO",
		is_bay: false,
		bay_kind: null
	};
	if (sL.includes("kapasitor") || sL.includes("compensator") || sL.includes("reaktor") || sL.includes("shunt")) return {
		object_type: "KAPASITOR",
		is_bay: false,
		bay_kind: null
	};
	if (sL.includes("ibt") || nL.startsWith("ibt ")) return {
		object_type: "IBT",
		is_bay: false,
		bay_kind: null
	};
	if (sL.includes("gitet") || sL.includes("gistet")) return {
		object_type: "GITET",
		is_bay: false,
		bay_kind: null
	};
	if (sL.includes("gis")) return {
		object_type: "GIS",
		is_bay: false,
		bay_kind: null
	};
	if (sL.includes("beban") || sL.includes("ktt") || nL.includes("ktt") || nL.includes("konsumen")) return {
		object_type: "BEBAN",
		is_bay: false,
		bay_kind: null
	};
	if (sL.includes("busbar") || sL.includes("rel")) return {
		object_type: "GI",
		is_bay: false,
		bay_kind: null
	};
	if (nL.includes("busbar") || nL.includes("rel")) return {
		object_type: "GI",
		is_bay: false,
		bay_kind: null
	};
	if (sL.includes("gi") || sL === "gi") return {
		object_type: "GI",
		is_bay: false,
		bay_kind: null
	};
	if (vL.includes("500") || vL.includes("275")) return {
		object_type: "GITET",
		is_bay: false,
		bay_kind: null
	};
	return {
		object_type: "GI",
		is_bay: false,
		bay_kind: null
	};
}
function isSourceObject(o) {
	if (o.object_type === "GENERATING_UNIT") return true;
	if (o.object_type === "GITET") return true;
	return (o.voltage_hv_kv ?? o.voltage_lv_kv ?? 0) >= 275 || norm(o.role_hint) === "SOURCE";
}
/**
* Expose the same header-row detection and a few preview rows so the Upload
* UI can render the mapping table from the engine parser's perspective.
*/
function readSheetPreview(sheet) {
	const { headers, rows } = sheet ? readHeaderRows(sheet) : {
		headers: [],
		rows: []
	};
	return {
		headers,
		previewRows: rows.slice(0, 5).map((r) => headers.map((h) => r[h]))
	};
}
function hasEngineSheets(wb) {
	const names = wb.SheetNames.map(norm);
	return names.includes("gardu_induk_dan_aset") && names.includes("jalur_transmisi");
}
function pickSheet(wb, names) {
	const wanted = names.map(norm);
	for (const sn of wb.SheetNames) if (wanted.includes(norm(sn))) return wb.Sheets[sn];
}
function readHeaderRows(sheet) {
	const grid = XLSX.utils.sheet_to_json(sheet, { header: 1 });
	let headerIdx = -1;
	let headers = [];
	for (let r = 0; r < Math.min(25, grid.length); r++) {
		const row = grid[r];
		if (!Array.isArray(row) || !row.length) continue;
		const h = row.map((c) => str(c)).filter(Boolean);
		if (h.some((c) => c.length > 60)) continue;
		const key = cleanKey(h.join(" "));
		if (key.includes("gi") || key.includes("gardu") || key.includes("asset") || key.includes("nama") || key.includes("darigi") || key.includes("penghantar") || key.includes("tier") || key.includes("kode") || key.includes("ibt") || key.includes("bus") || key.includes("trafo") || key.includes("kerawanan")) {
			headerIdx = r;
			headers = h;
			break;
		}
	}
	if (headerIdx < 0) return {
		headers: [],
		rows: []
	};
	const rows = grid.slice(headerIdx + 1).filter((r) => Array.isArray(r) && r.some((c) => c !== null && c !== void 0 && str(c) !== "")).map((raw) => {
		const o = {};
		headers.forEach((h, i) => {
			o[h] = raw[i];
		});
		return o;
	});
	return {
		headers,
		rows
	};
}
function get(row, ...keys) {
	const wanted = keys.map(norm);
	for (const [hk, v] of Object.entries(row)) if (wanted.includes(norm(hk))) return v;
}
function guessSubsystemName(filename) {
	let base = (filename || "subsistem").replace(/\.[^.]+$/, "");
	base = base.replace(/template_sld_subsistem_pln_/, "").replace(/template_/, "").replace(/_/g, " ").replace(/-/g, " ");
	return base.trim() || "Subsistem";
}
/**
* Derive the risk registry entries from the objects/connections that already
* carry `risk_seq` Pins (substation vs circuit), so multi-sheet merges can
* rebuild a consistent risk list from unioned state.
*/
function buildRisksFromState(objList, connections) {
	const pinBySeq = /* @__PURE__ */ new Map();
	for (const o of objList) for (const rn of o.risk_seq) pinBySeq.set(rn, {
		pin_kind: "SUBSTATION",
		pin_key: o.external_key
	});
	for (const c of connections) for (const rn of c.risk_seq) pinBySeq.set(rn, {
		pin_kind: "CIRCUIT",
		pin_key: `${c.from_external_key}-${c.to_external_key}`
	});
	const risks = [];
	for (const [seq, pin] of pinBySeq) {
		const conn = connections.find((c) => c.risk_seq.includes(seq));
		const obj = objList.find((o) => o.risk_seq.includes(seq));
		risks.push({
			seq_no: seq,
			uit: conn?.uit || (objList.length ? "" : "") || "",
			category: conn?.risk_level || obj?.risk_level || "Normal",
			title: conn?.line_name || obj?.raw_label || `Kerawanan #${seq}`,
			condition: conn?.note || obj?.raw_label || "",
			impact: conn?.corridor || "",
			mitigation: "",
			follow_up: "",
			pin_kind: pin.pin_kind,
			pin_key: pin.pin_key
		});
	}
	return risks;
}
function parseFlexibleSheet(sheet, mapping, ctx) {
	const issues = [];
	const { headers, rows } = sheet ? readHeaderRows(sheet) : {
		headers: [],
		rows: []
	};
	if (!headers.length || !rows.length) {
		issues.push({
			level: "error",
			message: "Tidak ada baris data yang terbaca di sheet ini."
		});
		return {
			payload: emptyPayload(ctx.filename),
			issues
		};
	}
	const colIdx = (h) => h ? headers.indexOf(h) : -1;
	const col = {
		gi: colIdx(mapping.gi),
		code: colIdx(mapping.code),
		tier: colIdx(mapping.tier),
		tierFrom: colIdx(mapping.tierFrom),
		tierTo: colIdx(mapping.tierTo),
		assetType: colIdx(mapping.assetType),
		symbolFrom: colIdx(mapping.symbolFrom),
		symbolTo: colIdx(mapping.symbolTo),
		busbarShape: colIdx(mapping.busbarShape),
		capacity: colIdx(mapping.capacity),
		ibtNumber: colIdx(mapping.ibtNumber),
		from: colIdx(mapping.from),
		to: colIdx(mapping.to),
		lineName: colIdx(mapping.lineName),
		voltage: colIdx(mapping.voltage),
		risk: colIdx(mapping.risk),
		riskNumber: colIdx(mapping.riskNumber),
		load: colIdx(mapping.load),
		loadC2: colIdx(mapping.loadC2),
		circuits: colIdx(mapping.circuits),
		circuitNumber: colIdx(mapping.circuitNumber),
		lengthKm: colIdx(mapping.lengthKm),
		corridor: colIdx(mapping.corridor),
		uit: colIdx(mapping.uit),
		condition: colIdx(mapping.condition),
		impact: colIdx(mapping.impact),
		mitigation: colIdx(mapping.mitigation),
		solution: colIdx(mapping.solution),
		bus150: colIdx(mapping.bus150),
		feeder: colIdx(mapping.feeder),
		bayKind: colIdx(mapping.bayKind),
		viewKey: colIdx(mapping.viewKey),
		status: colIdx(mapping.status),
		noKerawanan: colIdx(mapping.noKerawanan),
		connectedTo: colIdx(mapping.connectedTo),
		impactedGis: colIdx(mapping.impactedGis),
		functLoc: colIdx(mapping.functLoc)
	};
	const defaultVoltage = ctx.defaultVoltage || "150 kV";
	const isLineRow = (r) => col.from >= 0 && str(r[headers[col.from]]) !== "" && col.to >= 0 && str(r[headers[col.to]]) !== "";
	const objects = /* @__PURE__ */ new Map();
	const connections = [];
	const viewKeys = /* @__PURE__ */ new Set();
	const riskByView = {};
	let regionHint = ctx.region || "";
	const ensureObject = (name, codeValue, symbol, voltageRaw, tierHint, bus150Raw, extra = {}) => {
		const key = cleanKey(codeValue) || cleanKey(name) || `GI_${cleanKey(name)}`;
		const existing = objects.get(key);
		if (existing) {
			if (tierHint !== null && existing.tier_hint === null) existing.tier_hint = tierHint;
			if (existing.risk_level === "Normal" && isRawan(extra.risk_level || "Normal")) existing.risk_level = extra.risk_level || "Normal";
			for (const rn of extra.risk_seq || []) if (!existing.risk_seq.includes(rn)) existing.risk_seq.push(rn);
			for (const k of extra.connected_keys || []) if (!existing.connected_keys.includes(k)) existing.connected_keys.push(k);
			for (const k of extra.impacted_keys || []) if (!existing.impacted_keys.includes(k)) existing.impacted_keys.push(k);
			if (!existing.funct_loc && extra.funct_loc) existing.funct_loc = extra.funct_loc;
			return existing;
		}
		const { object_type, is_bay, bay_kind } = resolveObjectType(symbol, name, voltageRaw, bus150Raw);
		const hv = kvNum(voltageRaw);
		const obj = {
			external_key: key,
			object_type,
			raw_label: name,
			site_name: name,
			voltage_hv_kv: hv,
			voltage_lv_kv: hv !== null && str(voltageRaw).includes("/") ? kvNum(str(voltageRaw).split("/")[1]) : null,
			unit_no: extra.unit_no ?? null,
			tier_hint: tierHint,
			status_hint: "ENERGIZED",
			confidence: object_type === "GITET" || object_type === "GENERATING_UNIT" ? .9 : .8,
			is_bay,
			bay_feeder_key: null,
			bay_kind: is_bay ? bay_kind : null,
			has_transformer: false,
			has_capacitor: false,
			transformer_count: null,
			capacitor_count: null,
			symbol_note: null,
			view_keys: [],
			outlet_key: bus150Raw ? str(bus150Raw) : null,
			role_hint: object_type === "GENERATING_UNIT" ? "SOURCE" : null,
			bay_circuit_count: null,
			risk_seq: [],
			risk_level: "Normal",
			connected_keys: [],
			impacted_keys: [],
			funct_loc: null,
			...extra
		};
		objects.set(key, obj);
		return obj;
	};
	for (const r of rows) {
		if (isLineRow(r)) continue;
		const giVal = col.gi >= 0 ? str(r[headers[col.gi]]) : "";
		const codeVal = col.code >= 0 ? r[headers[col.code]] : void 0;
		const assetTypeVal = col.assetType >= 0 ? str(r[headers[col.assetType]]) : "";
		const nameVal = giVal || str(codeVal);
		const voltRaw = col.voltage >= 0 ? r[headers[col.voltage]] : defaultVoltage;
		const bus150Raw = col.bus150 >= 0 ? r[headers[col.bus150]] : void 0;
		const tierVal = col.tier >= 0 ? intOr(r[headers[col.tier]]) : null;
		const riskVal = col.risk >= 0 ? normalizeRiskLevel(r[headers[col.risk]]) : "Normal";
		const riskNo = col.riskNumber >= 0 ? riskNumbers(r[headers[col.riskNumber]]) : [];
		const ibtNo = col.ibtNumber >= 0 ? str(r[headers[col.ibtNumber]]) : null;
		const shapeVal = col.busbarShape >= 0 ? str(r[headers[col.busbarShape]]) : "";
		col.capacity >= 0 && numOr(r[headers[col.capacity]]);
		if (!nameVal) continue;
		const obj = ensureObject(nameVal, codeVal, assetTypeVal, voltRaw, tierVal, bus150Raw, {
			unit_no: ibtNo,
			outlet_key: bus150Raw ? str(bus150Raw) : null,
			role_hint: isRawan(riskVal) ? "RISK" : void 0,
			risk_seq: riskNo,
			risk_level: riskVal,
			connected_keys: keyList(col.connectedTo >= 0 ? r[headers[col.connectedTo]] : void 0),
			impacted_keys: keyList(col.impactedGis >= 0 ? r[headers[col.impactedGis]] : void 0),
			funct_loc: col.functLoc >= 0 ? str(r[headers[col.functLoc]]) || null : null
		});
		if (norm(shapeVal).includes("panjang") || norm(shapeVal).includes("wide")) obj.has_transformer = true;
		if (riskNo.length) for (const n of riskNo) (riskByView["flex"] ??= /* @__PURE__ */ new Set()).add(n);
		if (col.viewKey >= 0) {
			const vk = str(r[headers[col.viewKey]]).trim().toUpperCase();
			if (vk) {
				viewKeys.add(vk);
				if (!obj.view_keys.includes(vk)) obj.view_keys.push(vk);
			}
		}
	}
	for (const r of rows) {
		if (!isLineRow(r)) continue;
		const dariVal = col.from >= 0 ? str(r[headers[col.from]]) : "";
		const keVal = col.to >= 0 ? str(r[headers[col.to]]) : "";
		if (!dariVal || !keVal) continue;
		const lineNameVal = col.lineName >= 0 && str(r[headers[col.lineName]]) !== "" ? str(r[headers[col.lineName]]) : `${dariVal} - ${keVal}`;
		const voltStr = str(col.voltage >= 0 ? r[headers[col.voltage]] : defaultVoltage) || defaultVoltage;
		const isIbt = norm(col.assetType >= 0 ? str(r[headers[col.assetType]]) : "").includes("ibt") || norm(lineNameVal).includes("ibt");
		let srcVolt = voltStr;
		let dstVolt = voltStr;
		if (isIbt && voltStr.includes("/")) {
			const parts = voltStr.split("/");
			srcVolt = `${parts[0].trim()} kV`;
			const lv = parts[1].trim();
			dstVolt = /\d/.test(lv) ? norm(lv).includes("kv") ? lv : `${lv} kV` : voltStr;
		}
		const riskLevelVal = col.risk >= 0 ? normalizeRiskLevel(r[headers[col.risk]]) : "Normal";
		const riskNo = col.riskNumber >= 0 ? riskNumbers(r[headers[col.riskNumber]]) : [];
		const tierFromVal = col.tierFrom >= 0 ? intOr(r[headers[col.tierFrom]]) : null;
		const tierToVal = col.tierTo >= 0 ? intOr(r[headers[col.tierTo]]) : null;
		const symbolFromVal = col.symbolFrom >= 0 ? str(r[headers[col.symbolFrom]]) : "";
		const symbolToVal = col.symbolTo >= 0 ? str(r[headers[col.symbolTo]]) : "";
		const bus150Raw = col.bus150 >= 0 ? r[headers[col.bus150]] : void 0;
		const endpointRisk = isIbt ? {
			risk_seq: [],
			risk_level: "Normal"
		} : {
			risk_seq: riskNo,
			risk_level: riskLevelVal
		};
		const src = ensureObject(dariVal, void 0, symbolFromVal, srcVolt, tierFromVal, bus150Raw, endpointRisk);
		const dst = ensureObject(keVal, void 0, symbolToVal, dstVolt, tierToVal, void 0, endpointRisk);
		const lenVal = col.lengthKm >= 0 ? numOr(r[headers[col.lengthKm]]) : null;
		const loadVal = col.load >= 0 ? pcOr(r[headers[col.load]]) : null;
		const loadC2Val = col.loadC2 >= 0 ? pcOr(r[headers[col.loadC2]]) : null;
		const circuitsVal = col.circuits >= 0 ? intOr(r[headers[col.circuits]]) ?? 2 : 2;
		const corridorVal = col.corridor >= 0 ? str(r[headers[col.corridor]]) : null;
		const uitVal = col.uit >= 0 ? str(r[headers[col.uit]]) : null;
		if (corridorVal && !regionHint) regionHint = corridorVal;
		const statusVal = col.status >= 0 ? statusMap(r[headers[col.status]]) : "ENERGIZED";
		if (riskLevelVal !== "Normal") for (const n of riskNo) (riskByView["flex"] ??= /* @__PURE__ */ new Set()).add(n);
		if (isIbt) {
			const unitNo = lineNameVal.match(/ibt\s*(\d+)/i)?.[1] ?? null;
			connections.push({
				from_external_key: src.external_key,
				to_external_key: dst.external_key,
				relation_type: "IBT_LINK",
				circuit_type_hint: "IBT_LINK",
				status_hint: statusVal,
				circuit_count: 1,
				circuit_number: col.circuitNumber >= 0 ? intOr(r[headers[col.circuitNumber]]) : null,
				unit_no: unitNo,
				single_phi: false,
				confidence: 1,
				note: lineNameVal,
				view_keys: [],
				line_name: lineNameVal,
				voltage_kv: kvNum(dstVolt) ?? kvNum(voltStr),
				length_km: lenVal,
				loading_c1: loadVal,
				loading_c2: loadC2Val,
				corridor: corridorVal || null,
				uit: uitVal,
				tier_from_hint: tierFromVal,
				tier_to_hint: tierToVal,
				risk_seq: riskNo,
				risk_level: riskLevelVal
			});
			continue;
		}
		connections.push({
			from_external_key: src.external_key,
			to_external_key: dst.external_key,
			relation_type: "CONNECTED_TO",
			circuit_type_hint: lineTypeHint(lineNameVal),
			status_hint: statusVal,
			circuit_count: circuitsVal,
			circuit_number: col.circuitNumber >= 0 ? intOr(r[headers[col.circuitNumber]]) : null,
			unit_no: null,
			single_phi: false,
			confidence: riskLevelVal === "Normal" ? .85 : .8,
			note: lineNameVal,
			view_keys: [],
			line_name: lineNameVal,
			voltage_kv: kvNum(voltStr),
			length_km: lenVal,
			loading_c1: loadVal,
			loading_c2: loadC2Val,
			corridor: corridorVal || null,
			uit: uitVal,
			tier_from_hint: tierFromVal,
			tier_to_hint: tierToVal,
			risk_seq: riskNo,
			risk_level: riskLevelVal
		});
	}
	const objList = [...objects.values()];
	for (const o of objList) {
		if (o.object_type !== "IBT") continue;
		const lv = o.outlet_key ? cleanKey(o.outlet_key) : null;
		if (!lv) continue;
		const target = objects.get(lv);
		if (!target) {
			issues.push({
				level: "warning",
				message: `Bus 150 kV "${o.outlet_key}" untuk IBT ${o.external_key} tidak ditemukan.`
			});
			continue;
		}
		if (!connections.some((c) => c.from_external_key === o.external_key && c.to_external_key === target.external_key && c.relation_type === "IBT_LINK")) {
			connections.push({
				from_external_key: o.external_key,
				to_external_key: target.external_key,
				relation_type: "IBT_LINK",
				circuit_type_hint: "IBT_LINK",
				status_hint: o.status_hint,
				circuit_count: 1,
				unit_no: o.unit_no,
				single_phi: false,
				confidence: 1,
				note: `IBT${o.unit_no ? " " + o.unit_no : ""} ${o.external_key}`,
				view_keys: [...o.view_keys],
				line_name: `IBT${o.unit_no ? " " + o.unit_no : ""} ${o.external_key}`,
				voltage_kv: o.voltage_lv_kv ?? kvNum(`${o.voltage_hv_kv}/${o.voltage_lv_kv}`),
				length_km: null,
				loading_c1: null,
				loading_c2: null,
				corridor: regionHint || null,
				uit: null,
				tier_from_hint: o.tier_hint,
				tier_to_hint: null,
				risk_seq: [...o.risk_seq],
				risk_level: o.risk_level
			});
			o.risk_seq = [];
			o.risk_level = "Normal";
		}
	}
	const risks = buildRisksFromState(objList, connections);
	const subsystemName = ctx.subsystem || regionHint || guessSubsystemName(ctx.filename);
	return {
		payload: {
			meta: {
				filename: ctx.filename,
				document_type: "SLD_SHEET_XLSX",
				analytical_hint: "SUBSYSTEM_500_150",
				source_ref: `Template fleksibel (${ctx.filename})`,
				effective_date: null
			},
			subsystem: {
				code: `SS_${cleanKey(subsystemName).slice(0, 8).toUpperCase() || "NEW"}`,
				name: subsystemName,
				apb: regionHint || "UP2B",
				views: viewKeys.size > 0 ? [...viewKeys].map((vk) => ({
					view_key: vk,
					name: vk,
					source_keys: ["flex"]
				})) : [{
					view_key: "FLEX",
					name: "Sudut Pandang Utama",
					source_keys: ["flex"]
				}]
			},
			objects: objList,
			connections,
			risks
		},
		issues
	};
}
/**
* Multi-sheet flexible workbook parser: classifies every worksheet on the fly
* (object sheet = GI rows, line sheet = Dari/Ke rows, risk sheet = No
* Kerawanan + Kondisi/Dampak/Mitigasi rows), parses object sheets first so
* their richer node data wins, merges the line-sheet connections on top, and
* finally rebuilds the risk registry from the unioned state (or from a
* dedicated risk sheet pinned by seq).
*/
function parseFlexibleWorkbook(wb, ctx, override) {
	const issues = [];
	const objectSheets = [];
	const lineSheets = [];
	const riskSheets = [];
	const classify = (headers) => {
		const m = autoDetectMapping(headers);
		const isLine = Boolean(m.from && m.to);
		const shortColumn = (h) => h ? h.length > 0 && h.length <= 40 : false;
		return {
			isLine,
			isObject: shortColumn(m.gi) && Boolean(m.assetType || m.code || m.tier || m.capacity || m.ibtNumber || m.busbarShape),
			isRisk: Boolean(m.noKerawanan && (m.condition || m.impact || m.mitigation || m.solution)),
			m
		};
	};
	for (const sn of wb.SheetNames) {
		const { headers } = readHeaderRows(wb.Sheets[sn]);
		if (!headers.length) continue;
		const { isLine, isObject, isRisk, m } = classify(headers);
		const mapping = override && override.sheetName === sn && override.mapping ? {
			...emptyColumnMapping(),
			...override.mapping
		} : m;
		if (isLine) lineSheets.push({
			name: sn,
			sheet: wb.Sheets[sn],
			mapping
		});
		else if (isObject) objectSheets.push({
			name: sn,
			sheet: wb.Sheets[sn],
			mapping
		});
		else if (isRisk) riskSheets.push({
			name: sn,
			sheet: wb.Sheets[sn]
		});
	}
	if (!objectSheets.length && !lineSheets.length) {
		issues.push({
			level: "error",
			message: "Tidak ada sheet Objek (GI) atau sheet Jalur Transmisi (kolom Dari-Ke GI) yang dikenali di workbook ini."
		});
		return {
			payload: emptyPayload(ctx.filename),
			issues
		};
	}
	const objects = /* @__PURE__ */ new Map();
	const connections = [];
	const viewKeys = /* @__PURE__ */ new Set();
	let regionHint = ctx.region || "";
	const mergePayload = (p) => {
		for (const o of p.objects) {
			const ex = objects.get(o.external_key);
			if (!ex) objects.set(o.external_key, o);
			else {
				if (ex.tier_hint === null && o.tier_hint !== null) ex.tier_hint = o.tier_hint;
				if (!ex.raw_label) ex.raw_label = o.raw_label;
				for (const rn of o.risk_seq) if (!ex.risk_seq.includes(rn)) ex.risk_seq.push(rn);
				if (ex.risk_level === "Normal" && isRawan(o.risk_level)) ex.risk_level = o.risk_level;
			}
			for (const vk of o.view_keys) viewKeys.add(vk);
		}
		for (const c of p.connections) {
			if (!connections.some((x) => x.from_external_key === c.from_external_key && x.to_external_key === c.to_external_key && x.relation_type === c.relation_type && (x.circuit_number ?? null) === (c.circuit_number ?? null) && (x.unit_no ?? null) === (c.unit_no ?? null))) connections.push(c);
			if (c.corridor && !regionHint) regionHint = c.corridor;
			for (const vk of c.view_keys) viewKeys.add(vk);
		}
	};
	for (const s of [...objectSheets, ...lineSheets]) {
		const { payload, issues: sheetIssues } = parseFlexibleSheet(s.sheet, s.mapping, ctx);
		issues.push(...sheetIssues);
		mergePayload(payload);
	}
	const objList = [...objects.values()];
	const subsystemName = ctx.subsystem || regionHint || guessSubsystemName(ctx.filename);
	let risks = [];
	if (riskSheets.length) {
		const pinBySeq = /* @__PURE__ */ new Map();
		for (const o of objList) for (const rn of o.risk_seq) pinBySeq.set(rn, {
			pin_kind: "SUBSTATION",
			pin_key: o.external_key
		});
		for (const c of connections) for (const rn of c.risk_seq) pinBySeq.set(rn, {
			pin_kind: "CIRCUIT",
			pin_key: `${c.from_external_key}-${c.to_external_key}`
		});
		const bySeq = /* @__PURE__ */ new Map();
		for (const rs of riskSheets) {
			const { headers, rows } = readHeaderRows(rs.sheet);
			const m = autoDetectMapping(headers);
			const i = (h) => h ? headers.indexOf(h) : -1;
			const colSeq = i(m.noKerawanan);
			const colUit = i(m.uit);
			const colCond = i(m.condition);
			const colImpact = i(m.impact);
			const colMitig = i(m.mitigation);
			const colSol = i(m.solution);
			for (const r of rows) {
				const seqs = colSeq >= 0 ? riskNumbers(r[headers[colSeq]]) : [];
				if (!seqs.length) continue;
				const cond = colCond >= 0 ? str(r[headers[colCond]]) : "";
				for (const seq of seqs) {
					if (bySeq.has(seq)) continue;
					const pin = pinBySeq.get(seq);
					const conn = connections.find((c) => c.risk_seq.includes(seq));
					bySeq.set(seq, {
						seq_no: seq,
						uit: colUit >= 0 ? str(r[headers[colUit]]) : "",
						category: conn?.risk_level || "Normal",
						title: firstLine(cond) || conn?.line_name || `Kerawanan #${seq}`,
						condition: cond,
						impact: colImpact >= 0 ? str(r[headers[colImpact]]) : "",
						mitigation: colMitig >= 0 ? str(r[headers[colMitig]]) : "",
						follow_up: colSol >= 0 ? str(r[headers[colSol]]) : "",
						pin_kind: pin?.pin_kind ?? null,
						pin_key: pin?.pin_key ?? null
					});
				}
			}
		}
		risks = [...bySeq.values()];
	} else risks = buildRisksFromState(objList, connections);
	return {
		payload: {
			meta: {
				filename: ctx.filename,
				document_type: "SLD_WORKBOOK_XLSX",
				analytical_hint: "SUBSYSTEM_500_150",
				source_ref: `Template fleksibel multi-sheet (${ctx.filename})`,
				effective_date: null
			},
			subsystem: {
				code: `SS_${cleanKey(subsystemName).slice(0, 8).toUpperCase() || "NEW"}`,
				name: subsystemName,
				apb: regionHint || "UP2B",
				views: viewKeys.size > 0 ? [...viewKeys].map((vk) => ({
					view_key: vk,
					name: vk,
					source_keys: ["flex"]
				})) : [{
					view_key: "FLEX",
					name: "Sudut Pandang Utama",
					source_keys: ["flex"]
				}]
			},
			objects: objList,
			connections,
			risks
		},
		issues
	};
}
function emptyPayload(filename) {
	return {
		meta: {
			filename,
			document_type: "SLD_SHEET_XLSX",
			analytical_hint: "SUBSYSTEM_500_150",
			source_ref: null,
			effective_date: null
		},
		subsystem: {
			code: "SS_NEW",
			name: guessSubsystemName(filename),
			apb: "",
			views: []
		},
		objects: [],
		connections: [],
		risks: []
	};
}
function parseEngineWorkbook(wb, filename) {
	const issues = [];
	const wsAsset = pickSheet(wb, [
		"Gardu_Induk_dan_Aset",
		"Gardu Induk dan Aset",
		"Aset",
		"Asset"
	]);
	const wsLine = pickSheet(wb, [
		"Jalur_Transmisi",
		"Jalur Transmisi",
		"Penghantar"
	]);
	const wsRisk = pickSheet(wb, [
		"Data_Kerawanan_Detail",
		"Data Kerawanan Detail",
		"Kerawanan"
	]);
	const wsInfo = pickSheet(wb, [
		"Info",
		"Informasi",
		"Subsistem",
		"Header"
	]);
	const wsBay = pickSheet(wb, ["Bay", "Bays"]);
	const wsViews = pickSheet(wb, [
		"Views",
		"Sudut Pandang",
		"SLD Views"
	]);
	if (!hasEngineSheets(wb)) return parseFlexibleWorkbook(wb, {
		filename,
		defaultVoltage: "150 kV"
	});
	const info = {};
	if (wsInfo) {
		const grid = XLSX.utils.sheet_to_json(wsInfo, { header: 1 });
		for (const row of grid) if (Array.isArray(row) && row[0] !== null && row[0] !== void 0) info[norm(row[0])] = row[1];
	}
	const ssCode = str(info["kode subsistem"] || info["kode"] || "").trim().toUpperCase() || `SS_${cleanKey(filename).slice(0, 6)}`;
	const ssName = str(info["nama subsistem"] || info["nama"] || guessSubsystemName(filename)).trim();
	const objRaw = [];
	if (wsAsset) for (const row of readHeaderRows(wsAsset).rows) {
		const code = get(row, "Kode Singkatan", "Kode", "Code");
		const atype = norm(get(row, "Tipe Asset", "Tipe", "Type"));
		if (!code || atype.includes("ibt") || atype.includes("winding")) continue;
		objRaw.push({
			code: str(code).trim(),
			row
		});
	}
	const objects = /* @__PURE__ */ new Map();
	for (const { code, row } of objRaw) {
		const name = str(get(row, "Nama Asset / GI", "Nama Asset", "Nama GI", "Name"));
		const { object_type, is_bay, bay_kind } = resolveObjectType(get(row, "Tipe Asset", "Tipe", "Type"), name, get(row, "Tegangan", "Voltage"), "");
		const tierTmp = get(row, "Tier (Mulai 0)", "Tier", "Tier (Mulai 1)");
		const useZeroBased = Object.keys(row).some((k) => norm(k) === "tier (mulai 0)");
		const tierRaw = intOr(tierTmp);
		const tier = tierRaw === null ? null : useZeroBased ? tierRaw + 1 : tierRaw;
		const status = statusMap(get(row, "Status Operasi", "Status"));
		const riskLevel = normalizeRiskLevel(get(row, "Status Kerawanan", "Tingkat Kerawanan", "Kerawanan"));
		const riskNo = riskNumbers(get(row, "No Kerawanan", "No. Kerawanan"));
		objects.set(code, {
			external_key: code,
			object_type,
			raw_label: name || code,
			site_name: name || code,
			voltage_hv_kv: kvNum(get(row, "Tegangan", "Voltage")),
			voltage_lv_kv: null,
			unit_no: null,
			tier_hint: tier,
			status_hint: status,
			confidence: object_type === "GITET" || object_type === "GISTET" ? .9 : .8,
			is_bay,
			bay_feeder_key: str(get(row, "Feeder (GI Induk)", "Feeder", "GI Induk", "Induk") || null) || null,
			bay_kind: is_bay ? bay_kind : null,
			has_transformer: boolOr(get(row, "Ada Trafo", "Has Transformer")),
			has_capacitor: boolOr(get(row, "Ada Kapasitor", "Has Capacitor")),
			transformer_count: intOr(get(row, "Jumlah Trafo", "Transformer Count")),
			capacitor_count: intOr(get(row, "Jumlah Kapasitor", "Capacitor Count")),
			symbol_note: str(get(row, "Catatan Simbol", "Symbol Note")).trim() || null,
			view_keys: tokens(get(row, "Sudut Pandang", "View", "View Key")),
			outlet_key: str(get(row, "Bus Terhubung", "Outlet Bus", "Terhubung ke Bus") || null) || null,
			role_hint: str(get(row, "Role", "Peran", "Peran SLD")).trim().toUpperCase() || null,
			bay_circuit_count: intOr(get(row, "Jumlah Sirkit Bay", "Jumlah Sirkit", "Sirkit", "Circuit Count")),
			risk_seq: riskNo,
			risk_level: riskLevel,
			connected_keys: [],
			impacted_keys: [],
			funct_loc: null
		});
	}
	const pendingIbt = [];
	if (wsAsset) for (const row of readHeaderRows(wsAsset).rows) {
		const atype = norm(get(row, "Tipe Asset", "Tipe", "Type"));
		if (!atype.includes("ibt") && !atype.includes("winding")) continue;
		const unit = str(get(row, "No IBT", "Unit", "No Unit") || "1").trim();
		const rawCode = str(get(row, "Kode Singkatan", "Kode", "Code"));
		const hvRaw = get(row, "Bus HV", "Bus Primer", "GITET Induk");
		const hv = hvRaw ? str(hvRaw).trim().toUpperCase() : rawCode.split(/\s+/).pop()?.toUpperCase() ?? "";
		const lvRaw = get(row, "Bus 150 kV", "Bus 150kV", "Bus LV", "Ke Bus", "Bus");
		const lv = lvRaw ? str(lvRaw).trim().toUpperCase() : null;
		if (!hv || !lv) continue;
		if (!objects.has(hv) || !objects.has(lv)) {
			issues.push({
				level: "warning",
				message: `IBT ${unit} ${rawCode}: endpooint tidak dikenal ${hv} -> ${lv}`
			});
			continue;
		}
		const gk = objects.get(hv);
		const ok = objects.get(lv);
		const gitetKey = objects.has(hv) ? hv : hv;
		const riskNo = riskNumbers(get(row, "No Kerawanan", "No. Kerawanan"));
		gk.tier_hint = gk.tier_hint ?? 0;
		ok.tier_hint = ok.tier_hint ?? 1;
		pendingIbt.push({
			from_external_key: gitetKey,
			to_external_key: ok.external_key,
			relation_type: "IBT_LINK",
			circuit_type_hint: "IBT_LINK",
			status_hint: statusMap(get(row, "Status Operasi", "Status")),
			circuit_count: 1,
			unit_no: unit,
			single_phi: false,
			confidence: 1,
			note: rawCode,
			view_keys: tokens(get(row, "Sudut Pandang", "View", "View Key")),
			line_name: `IBT ${unit} ${hv}`,
			voltage_kv: 500,
			length_km: null,
			loading_c1: null,
			loading_c2: null,
			corridor: null,
			uit: null,
			tier_from_hint: 0,
			tier_to_hint: 1,
			risk_seq: riskNo,
			risk_level: normalizeRiskLevel(get(row, "Status Kerawanan", "Tingkat Kerawanan"))
		});
	}
	const bayLinks = [];
	if (wsBay) {
		const { rows } = readHeaderRows(wsBay);
		for (const row of rows) {
			const code = str(get(row, "Kode GI", "Kode", "Code")).trim();
			const feeder = str(get(row, "Feeder (GI Induk)", "Feeder", "GI Induk", "Induk")).trim();
			if (!code || !feeder) continue;
			const existing = objects.get(code);
			const bayKindRaw = str(get(row, "Jenis", "Jenis Bay", "Tipe") || "SUTT").trim().toUpperCase() || "SUTT";
			if (existing) {
				existing.is_bay = true;
				existing.bay_feeder_key = feeder;
				existing.bay_circuit_count = intOr(get(row, "Jumlah Sirkit", "Sirkit", "Circuit Count"));
				existing.view_keys = tokens(get(row, "Sudut Pandang", "View", "View Key"));
				existing.risk_seq = [...riskNumbers(get(row, "No Kerawanan", "No. Kerawanan"))];
			} else objects.set(code, {
				external_key: code,
				object_type: "BAY",
				raw_label: str(get(row, "Nama GI", "Nama") || code),
				site_name: str(get(row, "Nama GI", "Nama") || code),
				voltage_hv_kv: kvNum(get(row, "Tegangan")),
				voltage_lv_kv: null,
				unit_no: null,
				tier_hint: null,
				status_hint: statusMap(get(row, "Status Operasi", "Status")),
				confidence: .7,
				is_bay: true,
				bay_feeder_key: feeder,
				bay_kind: bayKindRaw,
				has_transformer: false,
				has_capacitor: false,
				transformer_count: null,
				capacitor_count: null,
				symbol_note: null,
				view_keys: tokens(get(row, "Sudut Pandang", "View", "View Key")),
				outlet_key: null,
				role_hint: null,
				bay_circuit_count: intOr(get(row, "Jumlah Sirkit", "Sirkit", "Circuit Count")),
				risk_seq: riskNumbers(get(row, "No Kerawanan", "No. Kerawanan")),
				risk_level: "Normal",
				connected_keys: [],
				impacted_keys: [],
				funct_loc: null
			});
			if (objects.has(feeder)) bayLinks.push({
				from_external_key: code,
				to_external_key: feeder,
				relation_type: "CONNECTED_TO",
				circuit_type_hint: "SUTT",
				status_hint: "ENERGIZED",
				circuit_count: 1,
				circuit_number: null,
				unit_no: null,
				single_phi: false,
				confidence: .7,
				note: null,
				view_keys: [],
				line_name: null,
				voltage_kv: null,
				length_km: null,
				loading_c1: null,
				loading_c2: null,
				corridor: null,
				uit: null,
				tier_from_hint: null,
				tier_to_hint: null,
				risk_seq: [],
				risk_level: "Normal"
			});
		}
	}
	const connections = [...pendingIbt, ...bayLinks];
	if (wsLine) for (const row of readHeaderRows(wsLine).rows) {
		const fr = str(get(row, "Dari GI", "Dari", "From")).trim();
		const to = str(get(row, "Ke GI", "Ke", "To")).trim();
		if (!fr || !to) continue;
		const fk = objects.has(fr) ? fr : fr;
		const tk = objects.has(to) ? to : to;
		if (!objects.has(fk)) {
			issues.push({
				level: "warning",
				message: `Endpoint at Jalur_Transmisi tidak dikenal: ${fr}`
			});
			continue;
		}
		if (!objects.has(tk)) {
			issues.push({
				level: "warning",
				message: `Endpoint at Jalur_Transmisi tidak dikenal: ${to}`
			});
			continue;
		}
		const lineNameVal = str(get(row, "Nama Penghantar", "Nama", "Name"));
		const riskLevel = normalizeRiskLevel(get(row, "Tingkat Kerawanan", "Kerawanan"));
		const riskNo = riskNumbers(get(row, "No Kerawanan", "No. Kerawanan"));
		connections.push({
			from_external_key: fk,
			to_external_key: tk,
			relation_type: "CONNECTED_TO",
			circuit_type_hint: lineTypeHint(get(row, "Nama Penghantar", "Nama", "Name")),
			status_hint: statusMap(get(row, "Status Operasi", "Status")),
			circuit_count: intOr(get(row, "Jumlah Sirkit", "Sirkit")) ?? 2,
			circuit_number: intOr(get(row, "No Sirkit", "Nomor Sirkit", "Circuit Number", "Circuit No")),
			unit_no: null,
			single_phi: boolOr(get(row, "Single Phi", "Single-phi", "Single Phase")),
			confidence: .85,
			note: lineNameVal || null,
			view_keys: tokens(get(row, "Sudut Pandang", "View", "View Key")),
			line_name: lineNameVal || null,
			voltage_kv: kvNum(get(row, "Tegangan")),
			length_km: numOr(get(row, "Panjang Saluran (km)", "Panjang")),
			loading_c1: pcOr(get(row, "Pembebanan Sirkit 1 (%)", "Pembebanan 1", "Pembebanan Sirkit 1")),
			loading_c2: pcOr(get(row, "Pembebanan Sirkit 2 (%)", "Pembebanan 2", "Pembebanan Sirkit 2")),
			corridor: str(get(row, "Koridor / Wilayah", "Koridor", "Wilayah")).trim() || null,
			uit: str(get(row, "UIT")).trim() || null,
			tier_from_hint: intOr(get(row, "Tier Dari", "Tier Dari GI")),
			tier_to_hint: intOr(get(row, "Tier Ke", "Tier Ke GI")),
			risk_seq: riskNo,
			risk_level: riskLevel
		});
	}
	const seenConn = /* @__PURE__ */ new Set();
	for (let i = 0; i < connections.length; i++) {
		const c = connections[i];
		const k = `${c.from_external_key}\u0000${c.to_external_key}\u0000${c.relation_type}\u0000${c.relation_type === "IBT_LINK" ? c.unit_no ?? "1" : c.circuit_number ?? ""}`;
		if (seenConn.has(k)) {
			connections.splice(i, 1);
			i--;
		} else seenConn.add(k);
	}
	const risks = [];
	const pinBySeq = /* @__PURE__ */ new Map();
	for (const o of objects.values()) for (const rn of o.risk_seq) pinBySeq.set(rn, {
		pin_kind: "SUBSTATION",
		pin_key: o.external_key
	});
	for (const c of connections) for (const rn of c.risk_seq) pinBySeq.set(rn, {
		pin_kind: "CIRCUIT",
		pin_key: `${c.from_external_key}-${c.to_external_key}`
	});
	if (wsRisk) for (const row of readHeaderRows(wsRisk).rows) {
		const seq = intOr(get(row, "No", "Seq"));
		const pin = seq !== null ? pinBySeq.get(seq) : null;
		risks.push({
			seq_no: seq,
			uit: str(get(row, "UIT") || "JBB").trim(),
			category: normalizeRiskLevel(get(row, "Kategori Kontingensi", "Kategori", "Category")),
			title: firstLine(get(row, "Kondisi / Permasalahan", "Kondisi")),
			condition: str(get(row, "Kondisi / Permasalahan", "Kondisi")),
			impact: str(get(row, "Dampak")),
			mitigation: str(get(row, "Mitigasi")),
			follow_up: str(get(row, "Usulan / Solusi", "Usulan", "Solusi")),
			pin_kind: pin?.pin_kind ?? null,
			pin_key: pin?.pin_key ?? null
		});
	}
	const viewRows = [];
	if (wsViews) for (const row of readHeaderRows(wsViews).rows) {
		const vk = str(get(row, "View Key", "Kunci View", "Kode View", "Sudut Pandang")).trim().toUpperCase();
		if (vk) viewRows.push({
			view_key: vk,
			name: str(get(row, "Nama View", "Nama SLD", "Name") || vk),
			source_keys: tokens(get(row, "Sumber Tier-1 (kode GI, pisah ;)", "Sumber Tier-1", "Source Keys"))
		});
	}
	return {
		payload: {
			meta: {
				filename,
				document_type: "SLD_TEMPLATE_XLSX",
				analytical_hint: "SUBSYSTEM_500_150",
				source_ref: `Template subsistem PLN (${filename})`,
				effective_date: null
			},
			subsystem: {
				code: ssCode,
				name: ssName,
				apb: str(info["apb"] || info["up2b"] || null) || "UP2B",
				views: viewRows
			},
			objects: [...objects.values()],
			connections,
			risks
		},
		issues
	};
}
function parseWorkbookToPayload(wb, filename) {
	return parseEngineWorkbook(wb, filename);
}
//#endregion
//#region src/lib/sld/tier.ts
/**
* TierEngine (port of app/services/topology.py from the SLD engine).
*
* A tier is a 1-based hop band toward a supply source. When the workbook does
* not carry an explicit `Tier` column the band is computed by a multi-source
* BFS starting from the sources:
*   - GeneratingUnits and GITET-class busbars (500 / 275 kV) are the default
*     Tier-1 sources,
*   - any object that already carries an explicit workbook tier is seeded at
*     that band and treated as reachable,
*   - everything else is 1 + the smallest tier it can be reached from.
*
* The result is re-indexed so the minimum band is 1, matching how a drawn
* SLD is normally labelled (Tier 1 = sumber).
*/
function computeTiers(payload) {
	const tiers = /* @__PURE__ */ new Map();
	const adj = /* @__PURE__ */ new Map();
	for (const o of payload.objects) adj.set(o.external_key, /* @__PURE__ */ new Set());
	for (const c of payload.connections) {
		adj.get(c.from_external_key)?.add(c.to_external_key);
		adj.get(c.to_external_key)?.add(c.from_external_key);
	}
	const zeroBased = payload.objects.some((o) => typeof o.tier_hint === "number" && o.tier_hint === 0);
	const hintOf = (o) => {
		if (typeof o.tier_hint !== "number" || !Number.isFinite(o.tier_hint)) return null;
		return zeroBased ? o.tier_hint + 1 : o.tier_hint;
	};
	for (const o of payload.objects) {
		const h = hintOf(o);
		if (h !== null && h > 0) tiers.set(o.external_key, h);
	}
	for (const o of payload.objects) if (!tiers.has(o.external_key) && isSourceObject(o)) tiers.set(o.external_key, 1);
	const queue = [...tiers.entries()].map(([key, band]) => ({
		key,
		band
	}));
	queue.sort((a, b) => a.band - b.band);
	let head = 0;
	while (head < queue.length) {
		const { key, band } = queue[head++];
		const next = band + 1;
		for (const nb of adj.get(key) ?? []) {
			if (tiers.has(nb)) continue;
			tiers.set(nb, next);
			queue.push({
				key: nb,
				band: next
			});
		}
	}
	for (const o of payload.objects) if (!tiers.has(o.external_key)) {
		const down = [...adj.get(o.external_key) ?? []].reduce((acc, nb) => {
			const t = tiers.get(nb);
			if (typeof t === "number") acc.push(t);
			return acc;
		}, []);
		tiers.set(o.external_key, down.length ? 1 + Math.min(...down) : 1);
	}
	const min = tiers.size ? Math.min(...tiers.values()) : 1;
	if (min > 1) {
		const shift = min - 1;
		for (const [k, v] of [...tiers.entries()]) tiers.set(k, v - shift);
	}
	return tiers;
}
//#endregion
//#region src/lib/sld/adapter.ts
var riskStatusOf = (level) => {
	const l = level.toUpperCase();
	if (l.includes("N-1-2") || l.includes("N-1-1") || l.includes("N12")) return "N-1-2";
	if (l.includes("N-2") || l.includes("N2")) return "N-2";
	if (l.includes("SANGAT RAWAN") || l.includes("KRITIS")) return "Sangat Rawan";
	if (l.includes("SEDANG")) return "Sedang";
	if (l.includes("RAWAN") || l.includes("N-1") || l.includes("N1")) return "N-1";
	return "Normal";
};
var voltageLabel = (hv, lv, fallback) => {
	if (hv && lv) return `${Math.round(hv)}/${Math.round(lv)} kV`;
	if (hv) return `${Math.round(hv)} kV`;
	if (lv) return `${Math.round(lv)} kV`;
	return fallback;
};
var assetTypeOf = (o) => {
	switch (o.object_type) {
		case "GITET":
		case "GISTET": return "gitet";
		case "GENERATING_UNIT": return "pembangkit";
		case "IBT": return "ibt";
		case "TRAFO": return "trafo";
		case "BEBAN": return "beban";
		case "GI":
		case "GIS":
		case "BAY": return o.is_bay ? "gi" : "gi";
		default: return "busbar";
	}
};
/**
* Convert the normalised engine payload into the flat node/line view model
* the React Flow renderers consume. IBT_LINK connections are produced as
* dedicated `transformer_link` lines so the 3-winding symbol renders on the
* edge, exactly like the engine draws the IBT between a GITET and its 150 kV
* bus.
*/
function toViewModel(payload, tierMap, subsystemName) {
	const giList = [];
	const lineList = [];
	const ibrLinks = [];
	const endpointKeys = /* @__PURE__ */ new Set();
	for (const c of payload.connections) {
		endpointKeys.add(c.from_external_key);
		endpointKeys.add(c.to_external_key);
	}
	const droppedIbt = new Set(payload.objects.filter((o) => o.object_type === "IBT" && !endpointKeys.has(o.external_key)).map((o) => o.external_key));
	const objByKey = new Map(payload.objects.map((o) => [o.external_key, o]));
	const prettyKey = (k) => k.toUpperCase();
	const adj = /* @__PURE__ */ new Map();
	for (const o of payload.objects) adj.set(o.external_key, /* @__PURE__ */ new Set());
	for (const c of payload.connections) {
		if (droppedIbt.has(c.from_external_key) || droppedIbt.has(c.to_external_key)) continue;
		adj.get(c.from_external_key)?.add(c.to_external_key);
		adj.get(c.to_external_key)?.add(c.from_external_key);
	}
	const tierOfKey = (key) => tierMap.get(key) ?? 99;
	/** Nodes fed downstream: walk only to strictly higher tiers (no loops). */
	const downstreamFrom = (start) => {
		const seen = /* @__PURE__ */ new Set([start]);
		const out = [];
		const queue = [start];
		while (queue.length) {
			const cur = queue.shift();
			const ct = tierOfKey(cur);
			for (const nb of adj.get(cur) ?? []) {
				if (seen.has(nb) || tierOfKey(nb) <= ct) continue;
				seen.add(nb);
				out.push(nb);
				queue.push(nb);
			}
		}
		return out;
	};
	const displayNameOf = (key) => objByKey.get(key)?.raw_label || objByKey.get(key)?.site_name || prettyKey(key);
	const nodeByKey = /* @__PURE__ */ new Map();
	for (const o of payload.objects) {
		if (droppedIbt.has(o.external_key)) continue;
		const tier = tierMap.get(o.external_key);
		const riskStatus = riskStatusOf(o.risk_level);
		const volt = voltageLabel(o.voltage_hv_kv, o.voltage_lv_kv, o.object_type === "IBT" ? "500/150 kV" : "150 kV");
		const region = payload.subsystem.apb || payload.subsystem.name || "UP2B";
		if (o.object_type === "GITET" || o.object_type === "GISTET") o.voltage_hv_kv = o.voltage_hv_kv ?? 500;
		const node = {
			id: o.external_key,
			name: o.raw_label || o.external_key,
			code: o.external_key,
			assetType: assetTypeOf(o),
			voltage: volt,
			tier,
			ibtNumber: o.unit_no ?? (o.object_type === "IBT" ? "1" : void 0),
			primaryVoltage: o.voltage_hv_kv ? `${Math.round(o.voltage_hv_kv)} kV` : void 0,
			secondaryVoltage: o.voltage_lv_kv ? `${Math.round(o.voltage_lv_kv)} kV` : void 0,
			capacityMVA: o.transformer_count ?? void 0,
			region,
			riskStatus,
			riskNumber: o.risk_seq[0],
			subsystem: subsystemName,
			uit: void 0,
			condition: void 0,
			isBay: o.is_bay,
			feederKey: o.bay_feeder_key ?? void 0,
			objectType: o.object_type,
			unitNo: o.unit_no ?? void 0,
			busLvKey: o.outlet_key ?? void 0,
			functLoc: o.funct_loc ?? void 0
		};
		const connKeys = o.connected_keys.filter((k) => k !== o.external_key);
		for (const k of adj.get(o.external_key) ?? []) if (k !== o.external_key && !connKeys.includes(k)) connKeys.push(k);
		const impKeys = o.impacted_keys.filter((k) => k !== o.external_key);
		for (const k of downstreamFrom(o.external_key)) if (!impKeys.includes(k)) impKeys.push(k);
		node.connectedKeys = connKeys;
		node.connectedNames = connKeys.map(displayNameOf);
		node.impactedKeys = impKeys;
		node.impactedNames = impKeys.map(displayNameOf);
		nodeByKey.set(o.external_key, node);
		giList.push(node);
	}
	const lineFrom = (c) => {
		const riskStatus = riskStatusOf(c.risk_level);
		const volt = c.voltage_kv ? `${Math.round(c.voltage_kv)} kV` : "150 kV";
		return {
			id: c.relation_type === "IBT_LINK" ? `INTERNAL_IBT_${c.unit_no ?? 1}_${c.from_external_key}-${c.to_external_key}` : `LINE_${c.from_external_key}-${c.to_external_key}${c.unit_no ? "_" + c.unit_no : ""}`,
			sourceId: c.from_external_key,
			targetId: c.to_external_key,
			lineName: c.line_name || c.note || `${c.from_external_key} - ${c.to_external_key}`,
			circuit: `${c.circuit_count} Sirkit`,
			circuitCount: c.circuit_number ? 1 : c.circuit_count,
			circuitNumber: c.circuit_number ?? void 0,
			lengthKm: c.length_km ?? 0,
			loadingPct: c.loading_c1 ?? 0,
			loadingCircuit1: c.loading_c1 ?? 0,
			loadingCircuit2: c.loading_c2 ?? 0,
			voltage: volt,
			operatingStatus: c.status_hint === "ENERGIZED" ? "Beroperasi" : c.status_hint === "PLANNED" ? "Rencana" : "Dalam Perbaikan",
			riskStatus,
			riskNumber: c.risk_seq[0],
			region: c.corridor || payload.subsystem.name,
			corridor: c.corridor ?? void 0,
			uit: c.uit ?? void 0
		};
	};
	for (const c of payload.connections) {
		if (droppedIbt.has(c.from_external_key) || droppedIbt.has(c.to_external_key)) continue;
		const line = lineFrom(c);
		line.sourceName = nodeByKey.get(c.from_external_key)?.name || prettyKey(c.from_external_key);
		line.targetName = nodeByKey.get(c.to_external_key)?.name || prettyKey(c.to_external_key);
		const sT = tierOfKey(c.from_external_key);
		const tT = tierOfKey(c.to_external_key);
		let affected;
		if (sT === tT) affected = [...downstreamFrom(c.from_external_key), ...downstreamFrom(c.to_external_key)].filter((k) => k !== c.from_external_key && k !== c.to_external_key);
		else {
			const fed = sT > tT ? c.from_external_key : c.to_external_key;
			affected = [fed, ...downstreamFrom(fed)];
		}
		line.impactedNames = [...new Set(affected)].map((k) => nodeByKey.get(k)?.name || prettyKey(k));
		if (c.relation_type === "IBT_LINK") ibrLinks.push(line);
		else lineList.push(line);
	}
	return {
		giList,
		lineList,
		ibrLinks
	};
}
//#endregion
//#region src/lib/sld/layout.ts
var ROW_GUTTER = 110;
var TIER_Y_BASE = 90;
var TIER_Y_STEP = 200;
var IBT_Y_OFFSET = 95;
function isSideBusbar(n) {
	const a = String(n.assetType || "");
	const nm = (n.name || "").toLowerCase();
	return a !== "ibt" && a !== "trafo" && a !== "pembangkit" && a !== "beban" && !nm.includes("plt") && !nm.includes("unit") && !nm.includes("trafo") && !nm.includes("ktt");
}
function fallbackTier(node, tierMap) {
	const explicit = tierMap?.get(node.id);
	if (typeof explicit === "number" && explicit >= 0) return explicit;
	if (typeof node.tier === "number" && node.tier >= 0) return node.tier;
	const a = String(node.assetType || "");
	const n = (node.name || "").toLowerCase();
	const v = String(node.voltage || "");
	if (a === "pembangkit" || n.includes("plt") || n.includes("pembangkit") || n.includes("unit")) return 1;
	if (a === "ibt" || a === "trafo" || v.includes("/")) return 2;
	if (a === "beban" || n.includes("ktt") || n.includes("konsumen")) return 4;
	if (v.includes("500") || v.includes("275")) return 1;
	return 3;
}
/**
* Generic engine-style SLD layout.
*
* Mirrors the SLD engine rendering rules without any hardcoded subsystem
* landmarks:
*   * objects are grouped into 1-based Tier bands from the tier engine,
*   * IBTs sit half a band below their HV busbar (between Tier t and t+1),
*   * busbars (3+ connections, non-generator) are drawn as a wide horizontal
*     bar spanning their attached terminals with per-bay taps,
*   * X positions follow a parent barycenter then a left-to-right
*     collision-avoidance sweep (min gap) so nothing overlaps.
*/
function computeEngineLayout(nodes, lines, tierMap) {
	const positions = {};
	if (!nodes || nodes.length === 0) return positions;
	const parentsOf = /* @__PURE__ */ new Map();
	const childrenOf = /* @__PURE__ */ new Map();
	nodes.forEach((n) => {
		parentsOf.set(n.id, []);
		childrenOf.set(n.id, []);
	});
	const physicalLines = [...new Map(lines.map((line) => [[line.sourceId, line.targetId].sort().join("___"), line])).values()];
	const nodeById = new Map(nodes.map((node) => [node.id, node]));
	const neighbors = new Map(nodes.map((node) => [node.id, /* @__PURE__ */ new Set()]));
	physicalLines.forEach((l) => {
		if (!parentsOf.has(l.sourceId) || !parentsOf.has(l.targetId)) return;
		const sT = fallbackTier(nodeById.get(l.sourceId), tierMap);
		const tT = fallbackTier(nodeById.get(l.targetId), tierMap);
		neighbors.get(l.sourceId)?.add(l.targetId);
		neighbors.get(l.targetId)?.add(l.sourceId);
		if (sT < tT) {
			parentsOf.get(l.targetId)?.push(l.sourceId);
			childrenOf.get(l.sourceId)?.push(l.targetId);
		} else if (tT < sT) {
			parentsOf.get(l.sourceId)?.push(l.targetId);
			childrenOf.get(l.targetId)?.push(l.sourceId);
		} else {
			parentsOf.get(l.targetId)?.push(l.sourceId);
			childrenOf.get(l.sourceId)?.push(l.targetId);
		}
	});
	const tiers = /* @__PURE__ */ new Map();
	nodes.forEach((n) => {
		const t = fallbackTier(n, tierMap);
		if (!tiers.has(t)) tiers.set(t, []);
		tiers.get(t).push(n);
	});
	const tierKeys = [...tiers.keys()].sort((a, b) => a - b);
	const minTier = tierKeys[0] ?? 1;
	const tierY = (t) => TIER_Y_BASE + (t - minTier) * TIER_Y_STEP;
	const halfWidth = /* @__PURE__ */ new Map();
	nodes.forEach((node) => {
		const degree = neighbors.get(node.id)?.size || 0;
		const wide = isSideBusbar(node) && degree >= 3;
		halfWidth.set(node.id, wide ? Math.max(120, degree * 23) : 75);
	});
	const xOf = /* @__PURE__ */ new Map();
	const orderedTiers = /* @__PURE__ */ new Map();
	tierKeys.forEach((t) => {
		const ordered = [...tiers.get(t) || []].sort((a, b) => a.name.localeCompare(b.name));
		orderedTiers.set(t, ordered);
		let cursor = -(ordered.reduce((sum, node) => sum + 2 * (halfWidth.get(node.id) || 75), 0) + Math.max(0, ordered.length - 1) * ROW_GUTTER) / 2;
		ordered.forEach((node) => {
			const half = halfWidth.get(node.id) || 75;
			xOf.set(node.id, cursor + half);
			cursor += 2 * half + ROW_GUTTER;
		});
	});
	const repackTier = (tier, center = false) => {
		const row = orderedTiers.get(tier) || [];
		const packedWidth = row.reduce((sum, node) => sum + 2 * (halfWidth.get(node.id) || 75), 0) + Math.max(0, row.length - 1) * ROW_GUTTER;
		let cursor = center ? -packedWidth / 2 : 0;
		row.forEach((node) => {
			const half = halfWidth.get(node.id) || 75;
			xOf.set(node.id, cursor + half);
			cursor += 2 * half + ROW_GUTTER;
		});
	};
	for (let sweep = 0; sweep < 16; sweep++) (sweep % 2 === 0 ? tierKeys : [...tierKeys].reverse()).forEach((tier) => {
		const row = orderedTiers.get(tier) || [];
		const priorIndex = new Map(row.map((n, i) => [n.id, i]));
		row.sort((a, b) => {
			const ax = [...neighbors.get(a.id) || []].map((id) => xOf.get(id)).filter((x) => x !== void 0);
			const bx = [...neighbors.get(b.id) || []].map((id) => xOf.get(id)).filter((x) => x !== void 0);
			return (ax.length ? ax.reduce((sum, x) => sum + x, 0) / ax.length : xOf.get(a.id) ?? 0) - (bx.length ? bx.reduce((sum, x) => sum + x, 0) / bx.length : xOf.get(b.id) ?? 0) || priorIndex.get(a.id) - priorIndex.get(b.id);
		});
		repackTier(tier);
	});
	tierKeys.forEach((tier) => repackTier(tier, true));
	nodes.forEach((n) => {
		const t = fallbackTier(n, tierMap);
		const parents = parentsOf.get(n.id) || [];
		const children = childrenOf.get(n.id) || [];
		const total = parents.length + children.length;
		const isIBT = String(n.assetType || "") === "ibt";
		const centerX = xOf.get(n.id) ?? 120;
		let width = (halfWidth.get(n.id) || 75) * 2;
		let x = centerX - width / 2;
		let isWide = isSideBusbar(n) && total >= 3;
		let taps = void 0;
		if (isWide) {
			taps = [];
			const addTaps = (connectedIds, side) => {
				[...connectedIds].sort((a, b) => (xOf.get(a) ?? 0) - (xOf.get(b) ?? 0)).forEach((connectedNodeId, index, sorted) => {
					const xTap = width * (index + 1) / (sorted.length + 1);
					taps?.push({
						id: `tap-${side}-${connectedNodeId}`,
						connectedNodeId,
						x: xTap,
						position: side,
						label: `Bay ${connectedNodeId}`
					});
				});
			};
			addTaps(parents, "top");
			addTaps(children, "bottom");
		}
		const y = isIBT ? tierY(t) + IBT_Y_OFFSET : isWide ? tierY(t) - 40 : tierY(t);
		positions[n.id] = {
			x: Math.round(x),
			y: Math.round(y),
			tier: t,
			isWideBusbar: isWide,
			busbarWidth: Math.round(width),
			taps
		};
	});
	return positions;
}
//#endregion
//#region scripts/pipeline-test/flex.ts
var wb = XLSX.read(readFileSync("/Users/ridwanalaziz/Kerja/ICON+/PROJECT/POWER INSPECT/DESIGN/peta-kerawanan/peta-kerawanan/public/template_kerawanan_subsistem_suralaya_cilegon.xlsx"));
console.log("SHEETS:", JSON.stringify(wb.SheetNames));
console.log("hasEngineSheets:", hasEngineSheets(wb));
var prev = readSheetPreview(wb.Sheets[wb.SheetNames[0]]);
console.log("headers:", JSON.stringify(prev.headers));
console.log("autoDetect:", JSON.stringify({
	gi: autoDetectMapping(prev.headers).gi,
	from: autoDetectMapping(prev.headers).from,
	to: autoDetectMapping(prev.headers).to,
	assetType: autoDetectMapping(prev.headers).assetType,
	tier: autoDetectMapping(prev.headers).tier
}));
var { payload, issues } = parseWorkbookToPayload(wb, "template_fleksibel.xlsx");
var tierMap = computeTiers(payload);
var vm = toViewModel(payload, tierMap, "Suralaya - Cilegon");
var pos = computeEngineLayout(vm.giList, [...vm.ibrLinks, ...vm.lineList], tierMap);
var tierVals = [...tierMap.values()];
console.log(JSON.stringify({
	objects: vm.giList.length,
	lines: vm.lineList.length,
	ibrLinks: vm.ibrLinks.length,
	tierRange: tierVals.length ? [Math.min(...tierVals), Math.max(...tierVals)] : null,
	issues: issues.map((i) => i.message).slice(0, 6),
	posKeys: Object.keys(pos).length,
	sampleIds: vm.giList.slice(0, 5).map((n) => `${n.id}:${n.assetType}:t${n.tier}`),
	risks: [...new Set(vm.giList.map((n) => n.riskStatus))]
}, null, 2));
//#endregion
export {};
