import { useEffect, useState } from 'react';
import { Cloud, Cpu, Loader2, RefreshCw, ServerOff, UploadCloud, XCircle } from 'lucide-react';
import { SldSvgCanvas, SldSvgSelection } from '../sld/SldSvgCanvas';
import { SLDLegend } from '../sld/SLDLegend';
import { coerceServerGraph, ServerParseResponse } from '../../lib/sld/fromServer';

interface ServerSLDViewProps {
  apiBase?: string;
  onBack?: () => void;
}

const DEFAULT_API = 'http://localhost:8080';

type HealthState = 'checking' | 'online' | 'offline';
type UploadState = 'idle' | 'uploading' | 'error' | 'success';

export const ServerSLDView: React.FC<ServerSLDViewProps> = ({ apiBase, onBack }) => {
  const base = apiBase || DEFAULT_API;
  const [health, setHealth] = useState<HealthState>('checking');
  const [fileName, setFileName] = useState<string>('');
  const [status, setStatus] = useState<UploadState>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [result, setResult] = useState<ServerParseResponse | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selection, setSelection] = useState<SldSvgSelection>(null);

  const ping = async () => {
    setHealth('checking');
    try {
      const res = await fetch(`${base}/api/health`, { method: 'GET' });
      setHealth(res.ok ? 'online' : 'offline');
    } catch {
      setHealth('offline');
    }
  };

  useEffect(() => {
    ping();
  }, [base]);

  const upload = async (file: File) => {
    setFileName(file.name);
    setStatus('uploading');
    setErrorMsg('');
    setResult(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${base}/api/sld/parse`, { method: 'POST', body: fd });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Server mengembalikan HTTP ${res.status}`);
      }
      const json = await res.json();
      const graph = coerceServerGraph(json.graph);
      setResult({
        graph,
        meta: json.meta ?? { filename: file.name, engine: 'spring-boot', elapsedMs: 0 },
        issues: Array.isArray(json.issues) ? json.issues : []
      });
      setStatus('success');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Gagal terhubung ke server');
      setStatus('error');
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    e.target.value = '';
    upload(f);
  };

  const healthClass =
    health === 'online'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
      : health === 'offline'
        ? 'bg-red-50 border-red-200 text-red-700'
        : 'bg-slate-50 border-slate-200 text-slate-500';
  const healthDot =
    health === 'online' ? 'bg-emerald-500' : health === 'offline' ? 'bg-red-500' : 'bg-slate-400';

  return (
    <div className="flex-1 flex flex-col w-full h-full overflow-hidden relative bg-[#f4f7fa]">
      {/* Page toolbar */}
      <div className="h-14 shrink-0 bg-white border-b border-slate-200 px-5 flex items-center justify-between gap-3 text-xs text-slate-700 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-[11px]">
            <Cloud className="w-3.5 h-3.5" />
            <span>SLD Server Mode</span>
          </div>
          <div className="h-5 w-px bg-slate-200" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-slate-500 font-medium whitespace-nowrap">API:</span>
            <code className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] text-slate-700">
              {base}
            </code>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={ping}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-xs transition-all cursor-pointer ${healthClass}`}
            title="Cek koneksi ke engine Java"
          >
            <span className={`w-2 h-2 rounded-full ${healthDot} ${health === 'checking' ? 'animate-pulse' : ''}`} />
            {health === 'checking'
              ? 'Menghubungi...'
              : health === 'online'
                ? 'Engine Java Online'
                : 'Engine Java Offline'}
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
            >
              Kembali
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {status !== 'success' ? (
        <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
          <div className="w-full max-w-xl flex flex-col gap-4">
            {/* Upload Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5 text-[#00529C]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Upload Excel & proses di Java Engine</h2>
                  <p className="text-[11px] text-slate-500">
                    File diproses di backend Spring Boot — parsing, tiering, layout & geometri dikerjakan server.
                  </p>
                </div>
              </div>

              <label
                className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
                  status === 'uploading'
                    ? 'border-blue-300 bg-blue-50/50'
                    : 'border-slate-300 bg-slate-50 hover:border-[#00529C] hover:bg-blue-50/40'
                } ${status === 'uploading' ? 'pointer-events-none' : ''}`}
                style={{ minHeight: '180px' }}
              >
                <input type="file" className="hidden" accept=".xlsx,.xls" onChange={onFileChange} disabled={status === 'uploading'} />
                {status === 'uploading' ? (
                  <div className="flex flex-col items-center gap-2 py-6">
                    <Loader2 className="w-8 h-8 text-[#00529C] animate-spin" />
                    <span className="text-sm font-semibold text-slate-700">Memproses {fileName} di server...</span>
                    <span className="text-[11px] text-slate-400">parser → mapping → tier → layout → geometri</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-6">
                    <UploadCloud className="w-9 h-9 text-slate-300" />
                    <span className="text-sm font-semibold text-slate-700">Klik untuk memilih file Excel</span>
                    <span className="text-[11px] text-slate-400">Format .xlsx / .xls — template SLD yang sama dengan Upload SLD</span>
                  </div>
                )}
              </label>
            </div>

            {status === 'error' && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-xs">
                <XCircle className="w-5 h-5 shrink-0 text-red-500" />
                <div className="min-w-0">
                  <p className="font-bold">Gagal memproses di server</p>
                  <p className="mt-1 break-words">{errorMsg}</p>
                  <p className="mt-2 text-[10px] text-red-500">
                    Pastikan backend Spring Boot berjalan (jalankan ./mvnw spring-boot:run di folder backend-sld)
                    dan server dapat diakses dari {base}.
                  </p>
                </div>
              </div>
            )}

            {health === 'offline' && status === 'idle' && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-700 text-xs">
                <ServerOff className="w-5 h-5 shrink-0 text-amber-500" />
                <div>
                  <p className="font-bold">Engine Java belum terdeteksi</p>
                  <p className="mt-1">Halaman ini butuh backend Spring Boot. Halaman lain di aplikasi tidak terpengaruh.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Success: render the graph from the server */
        <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
          <div className="h-11 shrink-0 bg-white border-b border-slate-200 px-4 flex items-center justify-between gap-3 z-10">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Cpu className="w-4 h-4 text-[#00529C]" />
              {result?.meta.filename || fileName}
              {typeof result?.meta.elapsedMs === 'number' && (
                <span className="text-[10px] font-medium text-slate-400">
                  {result.meta.elapsedMs} ms · parsed & rendered by Java engine
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {result && result.issues.length > 0 && (
                <span className="text-[10px] font-semibold text-amber-600 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                  {result.issues.length} peringatan
                </span>
              )}
              <button
                onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {theme === 'light' ? 'Blueprint Gelap' : 'Putih'}
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setStatus('idle');
                  setSelection(null);
                }}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Upload lain
              </button>
            </div>
          </div>

          {result && result.issues.length > 0 && (
            <div className="shrink-0 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-700 px-4 py-1.5 flex flex-col gap-0.5">
              {result.issues.slice(0, 5).map((iss, idx) => (
                <p key={idx}>
                  <strong className="uppercase">{iss.level}:</strong> {iss.message}
                </p>
              ))}
            </div>
          )}

          <div className="flex-1 relative overflow-hidden">
            <SldSvgCanvas
              graph={result!.graph}
              selection={selection}
              theme={theme}
              onSelectNode={(code) => setSelection({ kind: 'node', code })}
              onSelectCircuit={(id) => setSelection({ kind: 'circuit', id })}
              onSelectIbt={(id) => setSelection({ kind: 'ibt', id })}
              onSelectRisk={(seq) => setSelection({ kind: 'risk', seq })}
              onBackgroundClick={() => setSelection(null)}
            />
            <div className="absolute left-3 top-3 z-10">
              <SLDLegend />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerSLDView;