import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Play, Image, AlertTriangle, ShieldCheck, Download, Trash2, HardHat, Users, Bike, Clock, X } from 'lucide-react';
import { detectImage, detectVideo } from '../services/api';

export default function DetectionPage({ showToast }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [confidence, setConfidence] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [resultImageUrl, setResultImageUrl] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || '';

  const onDrop = useCallback((acceptedFiles) => {
    const f = acceptedFiles[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setResultImageUrl(null);

    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'], 'video/*': ['.mp4', '.avi', '.mov'] },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024,
  });

  const runDetection = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setResultImageUrl(null);

    try {
      const isVideo = file.type.startsWith('video/');
      const res = isVideo
        ? await detectVideo(file, confidence)
        : await detectImage(file, confidence);

      const data = res.data;
      if (data.success) {
        setResult(data);
        if (data.result_image_url) {
          setResultImageUrl(`${API_BASE}${data.result_image_url}`);
        }

        const violations = data.violations?.length || data.results?.total_violations || 0;
        if (violations > 0) {
          showToast(`⚠️ ${violations} violation(s) detected!`, 'error');
        } else {
          showToast('✓ Detection complete — no violations found', 'success');
        }
      }
    } catch (err) {
      console.error('Detection error:', err);
      const msg = err.response?.data?.detail || err.message || 'Detection failed';
      showToast(`Error: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setResultImageUrl(null);
  };

  const detection = result?.detection;
  const violations = result?.violations || result?.results?.violations || [];
  const stage1 = detection?.stage1_bike_person;
  const stage2 = detection?.stage2_helmet;
  const stage3 = detection?.stage3_plate;
  const videoResults = result?.results;

  return (
    <div>
      <div className="page-header">
        <h1>🔍 Detection Analysis</h1>
        <p>Upload an image or video to run helmet & triple riding detection</p>
      </div>

      <div className="two-col">
        {/* Left - Upload & Controls */}
        <div>
          <div className="glass-card">
            {/* Upload Zone */}
            {!file ? (
              <div {...getRootProps()} className={`upload-zone ${isDragActive ? 'active' : ''}`}>
                <input {...getInputProps()} />
                <div className="upload-zone-icon">
                  <Upload size={28} />
                </div>
                <h3>Drop your file here</h3>
                <p>or click to browse from your computer</p>
                <div className="formats">
                  <span className="format-badge">JPG</span>
                  <span className="format-badge">PNG</span>
                  <span className="format-badge">MP4</span>
                  <span className="format-badge">AVI</span>
                </div>
              </div>
            ) : (
              <>
                {/* File Preview */}
                <div className="file-preview">
                  {preview ? (
                    <img src={preview} alt="Preview" className="file-preview-thumb" />
                  ) : (
                    <div className="file-preview-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Play size={20} style={{ opacity: 0.5 }} />
                    </div>
                  )}
                  <div className="file-preview-info">
                    <div className="file-preview-name">{file.name}</div>
                    <div className="file-preview-meta">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB • {file.type.startsWith('video/') ? 'Video' : 'Image'}
                    </div>
                  </div>
                  <button className="btn btn-outline" onClick={clearAll} style={{ padding: '0.4rem' }}>
                    <X size={18} />
                  </button>
                </div>

                {/* Controls */}
                <div className="controls-row">
                  <div className="control-group">
                    <span className="control-label">Confidence Threshold</span>
                    <div className="slider-container">
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={confidence}
                        onChange={e => setConfidence(parseFloat(e.target.value))}
                      />
                      <span className="slider-value">{confidence.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Run Button */}
                <button
                  className="btn btn-primary"
                  onClick={runDetection}
                  disabled={loading}
                  style={{ marginTop: '1.25rem', width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '0.95rem' }}
                >
                  {loading ? (
                    <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div> Running AI Pipeline...</>
                  ) : (
                    <><ShieldCheck size={20} /> Run Detection</>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Pipeline Info */}
          {!result && (
            <div className="glass-card" style={{ marginTop: '1.25rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Detection Pipeline
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { num: '1', title: 'Motorbike & Person Detection', desc: 'YOLOv3 COCO model', color: 'var(--accent-primary)' },
                  { num: '2', title: 'Helmet Detection', desc: 'Custom YOLOv3 model', color: 'var(--success)' },
                  { num: '3', title: 'Number Plate Recognition', desc: 'CNN classifier (demo)', color: 'var(--warning)' },
                ].map(step => (
                  <div key={step.num} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: step.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>
                      {step.num}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{step.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right - Results */}
        <div>
          {loading && (
            <div className="glass-card">
              <div className="loading-overlay">
                <div className="spinner"></div>
                <div className="loading-text">Running AI Detection Pipeline...</div>
                <div className="loading-subtext">Analyzing with YOLOv3 neural network — this may take 5-15 seconds</div>
              </div>
            </div>
          )}

          {!loading && !result && (
            <div className="glass-card">
              <div className="empty-state">
                <div className="empty-state-icon"><Image size={64} /></div>
                <h3>Results will appear here</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Upload a file and click "Run Detection" to start</p>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="results-panel">
              {/* Annotated Image */}
              {resultImageUrl && (
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="result-image-container">
                    <img src={resultImageUrl} alt="Detection result" />
                  </div>
                  <div style={{ padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Inference: {result.inference_time_ms || result.results?.processing_time_ms || '—'}ms
                    </span>
                    <a href={resultImageUrl} download className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                      <Download size={14} /> Download
                    </a>
                  </div>
                </div>
              )}

              {/* Detection Metrics */}
              {stage1 && (
                <div className="detection-grid" style={{ marginTop: '1.25rem' }}>
                  <div className="detection-metric">
                    <div className="detection-metric-value" style={{ color: 'var(--info)' }}>{stage1.persons}</div>
                    <div className="detection-metric-label">Persons</div>
                  </div>
                  <div className="detection-metric">
                    <div className="detection-metric-value" style={{ color: 'var(--warning)' }}>{stage1.motorbikes}</div>
                    <div className="detection-metric-label">Motorbikes</div>
                  </div>
                  <div className="detection-metric">
                    <div className="detection-metric-value" style={{ color: 'var(--success)' }}>{stage2?.helmets ?? '—'}</div>
                    <div className="detection-metric-label">Helmets</div>
                  </div>
                  <div className="detection-metric">
                    <div className="detection-metric-value" style={{ color: result.inference_time_ms > 1000 ? 'var(--warning)' : 'var(--text-primary)' }}>
                      {result.inference_time_ms ? `${(result.inference_time_ms / 1000).toFixed(1)}s` : '—'}
                    </div>
                    <div className="detection-metric-label">Time</div>
                  </div>
                </div>
              )}

              {/* Video Results Summary */}
              {videoResults && (
                <div className="detection-grid" style={{ marginTop: '1.25rem' }}>
                  <div className="detection-metric">
                    <div className="detection-metric-value" style={{ color: 'var(--accent-primary)' }}>{videoResults.frames_processed}</div>
                    <div className="detection-metric-label">Frames Scanned</div>
                  </div>
                  <div className="detection-metric">
                    <div className="detection-metric-value" style={{ color: 'var(--danger)' }}>{videoResults.total_violations}</div>
                    <div className="detection-metric-label">Violations</div>
                  </div>
                  <div className="detection-metric">
                    <div className="detection-metric-value">{videoResults.video_info?.duration_sec || '—'}s</div>
                    <div className="detection-metric-label">Duration</div>
                  </div>
                  <div className="detection-metric">
                    <div className="detection-metric-value">{videoResults.processing_time_ms ? `${(videoResults.processing_time_ms / 1000).toFixed(1)}s` : '—'}</div>
                    <div className="detection-metric-label">Process Time</div>
                  </div>
                </div>
              )}

              {/* Violations */}
              {violations.length > 0 && (
                <div style={{ marginTop: '1.25rem' }}>
                  {violations.map((v, i) => (
                    <div key={i} className={`violation-alert ${v.severity === 'critical' ? 'critical' : 'high'}`} style={{ marginBottom: '0.75rem' }}>
                      <div className="violation-alert-icon">
                        <AlertTriangle size={20} color={v.severity === 'critical' ? 'var(--danger)' : 'var(--warning)'} />
                      </div>
                      <div>
                        <h4 style={{ color: v.severity === 'critical' ? 'var(--danger)' : 'var(--warning)' }}>
                          {(v.type || '').replace(/_/g, ' ').toUpperCase()}
                        </h4>
                        <p>{v.details}</p>
                        {v.frame_number && (
                          <p style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>Frame #{v.frame_number} ({v.timestamp_sec}s)</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {violations.length === 0 && result && (
                <div className="violation-alert" style={{ marginTop: '1.25rem', background: 'rgba(34,197,94,0.08)', borderColor: 'var(--success)' }}>
                  <ShieldCheck size={20} color="var(--success)" />
                  <div>
                    <h4 style={{ color: 'var(--success)' }}>ALL CLEAR</h4>
                    <p>No violations detected in this {file?.type?.startsWith('video/') ? 'video' : 'image'}</p>
                  </div>
                </div>
              )}

              {/* Plate Info */}
              {stage3?.plate && (
                <div className="glass-card" style={{ marginTop: '1.25rem' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Detected Registration</div>
                  <div className="plate-badge" style={{ fontSize: '1.1rem' }}>{stage3.plate}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Confidence: {(stage3.confidence * 100).toFixed(1)}% • Mode: {stage3.mode}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
