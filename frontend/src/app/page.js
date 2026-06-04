"use client";

import { useState, useRef, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const CLASS_LABELS = ["COVID", "Normal", "Viral Pneumonia"];

const SEVERITY_META = {
  COVID: { color: "bg-black", text: "text-black", badge: "bg-gray-900 text-white" },
  Normal: { color: "bg-gray-400", text: "text-gray-500", badge: "bg-gray-200 text-gray-700" },
  "Viral Pneumonia": { color: "bg-gray-700", text: "text-gray-700", badge: "bg-gray-700 text-white" },
};

// ─── Sub-components ────────────────────────────────────────────────────────

function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900 tracking-tight">MedAI Diagnostics</h1>
            <p className="text-xs text-gray-400">COVID-19 · Pneumonia Classifier</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow" />
          <span className="text-xs text-gray-500 font-medium">Model Online</span>
        </div>
      </div>
    </header>
  );
}

function DropZone({ onFile, preview }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) onFile(file);
  }, [onFile]);

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const handleChange = (e) => { const f = e.target.files?.[0]; if (f) onFile(f); };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden
        ${dragging ? "border-gray-900 bg-gray-50" : "border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50"}
        ${preview ? "h-64" : "h-48"}`}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      {preview ? (
        <>
          <img src={preview} alt="X-ray preview" className="w-full h-full object-contain p-2" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium bg-white/90 px-3 py-1.5 rounded-full text-gray-700 shadow-sm">
              Click to replace
            </span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Drop Chest X-ray here</p>
            <p className="text-xs text-gray-400 mt-0.5">or click to browse · PNG, JPG, DICOM</p>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 animate-fade-in">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-2 border-gray-100" />
        <div className="absolute inset-0 rounded-full border-2 border-t-gray-900 animate-spin-slow" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">Running AI Diagnostics</p>
        <p className="text-xs text-gray-400 mt-1">Analyzing · Computing Grad-CAM · Preparing results</p>
      </div>
    </div>
  );
}

function ConfidenceBar({ label, value, isTop }) {
  const meta = SEVERITY_META[label] || SEVERITY_META["Normal"];
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.badge}`}>
            {label}
          </span>
          {isTop && (
            <span className="text-xs text-gray-400 font-medium">· Top prediction</span>
          )}
        </div>
        <span className="text-sm font-semibold text-gray-900 tabular-nums">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${meta.color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ResultCard({ title, children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      <div className="px-5 py-3 border-b border-gray-50">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function DiagnosticBadge({ predictedClass, confidence }) {
  const meta = SEVERITY_META[predictedClass] || SEVERITY_META["Normal"];
  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
      <div className={`w-3 h-3 rounded-full ${meta.color}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium">Predicted Diagnosis</p>
        <p className="text-base font-bold text-gray-900 truncate">{predictedClass}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-gray-400 font-medium">Confidence</p>
        <p className="text-base font-bold text-gray-900">{(confidence * 100).toFixed(1)}%</p>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function Home() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFile = (f) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const handlePredict = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_URL}/predict`, { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Server error ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to connect to the diagnostic server.");
    } finally {
      setLoading(false);
    }
  };

  const sortedClasses = result
    ? CLASS_LABELS.slice().sort((a, b) => result.predictions[b] - result.predictions[a])
    : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">

        {/* Page title */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Chest X-ray Analysis</h2>
          <p className="text-sm text-gray-500 mt-1">
            Upload a chest X-ray to classify COVID-19, Viral Pneumonia, or Normal with Grad-CAM visual explanation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left Column: Upload + Controls ── */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Input Image</p>
              <DropZone onFile={handleFile} preview={preview} />

              {file && (
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="truncate font-medium">{file.name}</span>
                  <span className="ml-auto shrink-0 text-gray-400">{(file.size / 1024).toFixed(0)} KB</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handlePredict}
                  disabled={!file || loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 disabled:bg-gray-200 disabled:text-gray-400
                    text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin-slow" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Run AI Diagnostics
                    </>
                  )}
                </button>
                {(file || result) && (
                  <button
                    onClick={handleReset}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-700"
                    title="Reset"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Info card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Model Info</p>
              {[
                ["Architecture", "EfficientNet-B0"],
                ["Classes", "COVID · Normal · Viral Pneumonia"],
                ["Explainability", "Grad-CAM (conv_head)"],
                ["Input Size", "224 × 224 px"],
              ].map(([label, val]) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <span className="text-xs text-gray-400 shrink-0">{label}</span>
                  <span className="text-xs font-medium text-gray-700 text-right">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right columns: Results ── */}
          <div className="lg:col-span-2">
            {!file && !result && !loading && (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-4">
                  <svg className="w-9 h-9 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-400">Upload an X-ray to begin</p>
                <p className="text-xs text-gray-300 mt-1">Diagnostic results will appear here</p>
              </div>
            )}

            {loading && <LoadingSpinner />}

            {error && (
              <div className="animate-fade-in bg-white rounded-2xl border border-red-100 shadow-sm p-6 flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Diagnostic Failed</p>
                  <p className="text-xs text-gray-500 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-4 animate-slide-up">

                {/* Summary badge */}
                <DiagnosticBadge
                  predictedClass={result.predicted_class}
                  confidence={result.confidence}
                />

                {/* Three-panel grid: Original | Confidence | Grad-CAM */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  <ResultCard title="Original X-ray">
                    <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
                      <img
                        src={`data:image/png;base64,${result.original_image}`}
                        alt="Original X-ray"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </ResultCard>

                  <ResultCard title="Class Confidence">
                    <div className="space-y-4 py-1">
                      {sortedClasses.map((label, i) => (
                        <ConfidenceBar
                          key={label}
                          label={label}
                          value={result.predictions[label]}
                          isTop={i === 0}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                      Softmax probabilities from EfficientNet-B0 classification head.
                    </p>
                  </ResultCard>

                  <ResultCard title="Grad-CAM Explanation">
                    <div className="aspect-square bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
                      <img
                        src={`data:image/png;base64,${result.gradcam_image}`}
                        alt="Grad-CAM Heatmap"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                      Warm regions indicate areas most influential in the model's decision.
                    </p>
                  </ResultCard>

                </div>

                {/* Raw probabilities table */}
                <ResultCard title="Full Probability Report">
                  <div className="divide-y divide-gray-50">
                    {CLASS_LABELS.map((label) => (
                      <div key={label} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${SEVERITY_META[label]?.color}`} />
                          <span className="text-sm text-gray-700 font-medium">{label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${SEVERITY_META[label]?.color}`}
                              style={{ width: `${(result.predictions[label] * 100).toFixed(1)}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-900 tabular-nums w-12 text-right">
                            {(result.predictions[label] * 100).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ResultCard>

              </div>
            )}
          </div>

        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            MedAI · For research use only. Not a substitute for professional medical diagnosis.
          </p>
          <p className="text-xs text-gray-400">EfficientNet-B0 · Grad-CAM · FastAPI · Next.js</p>
        </div>
      </footer>
    </div>
  );
}
