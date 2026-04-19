import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Image, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getHistory, deleteDetection } from '../services/api';

export default function HistoryPage({ showToast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 0 });
  const [selected, setSelected] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    loadHistory();
  }, [page]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await getHistory(page, 12);
      if (res.data.success) {
        setItems(res.data.data || []);
        setPagination(res.data.pagination || {});
      }
    } catch (e) {
      console.warn('History load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this detection record?')) return;
    try {
      await deleteDetection(id);
      showToast('Detection deleted', 'success');
      loadHistory();
    } catch (e) {
      showToast('Failed to delete', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>📋 Detection History</h1>
        <p>{pagination.total || 0} total records</p>
      </div>

      {loading && (
        <div className="glass-card">
          <div className="loading-overlay" style={{ padding: '3rem' }}>
            <div className="spinner"></div>
            <div className="loading-text">Loading history...</div>
          </div>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-icon"><Image size={64} /></div>
            <h3>No detections yet</h3>
            <p style={{ color: 'var(--text-muted)' }}>Upload an image in the Detection tab to get started</p>
          </div>
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          {/* Detail Modal */}
          {selected && (
            <div className="glass-card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(59,130,246,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{selected.filename}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {selected.created_at ? new Date(selected.created_at).toLocaleString() : ''}
                  </p>
                </div>
                <button className="btn btn-outline" onClick={() => setSelected(null)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                  Close
                </button>
              </div>

              {selected.result_image_url && (
                <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: '1rem', background: '#000' }}>
                  <img src={`${API_BASE}${selected.result_image_url}`} alt="Result" style={{ width: '100%', maxHeight: 500, objectFit: 'contain' }} />
                </div>
              )}

              <div className="detection-grid">
                <div className="detection-metric">
                  <div className="detection-metric-value" style={{ color: 'var(--info)' }}>{selected.persons_detected}</div>
                  <div className="detection-metric-label">Persons</div>
                </div>
                <div className="detection-metric">
                  <div className="detection-metric-value" style={{ color: 'var(--warning)' }}>{selected.motorbikes_detected}</div>
                  <div className="detection-metric-label">Motorbikes</div>
                </div>
                <div className="detection-metric">
                  <div className="detection-metric-value" style={{ color: 'var(--success)' }}>{selected.helmets_detected}</div>
                  <div className="detection-metric-label">Helmets</div>
                </div>
                <div className="detection-metric">
                  <div className="detection-metric-value">{selected.inference_time_ms?.toFixed(0)}ms</div>
                  <div className="detection-metric-label">Inference</div>
                </div>
              </div>

              {selected.violations?.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  {selected.violations.map((v, i) => (
                    <div key={i} className={`violation-alert ${v.severity === 'critical' ? 'critical' : 'high'}`} style={{ marginBottom: '0.5rem' }}>
                      <AlertTriangle size={18} color={v.severity === 'critical' ? 'var(--danger)' : 'var(--warning)'} />
                      <div>
                        <h4 style={{ color: v.severity === 'critical' ? 'var(--danger)' : 'var(--warning)', fontSize: '0.85rem' }}>
                          {(v.type || '').replace(/_/g, ' ').toUpperCase()}
                        </h4>
                        <p style={{ fontSize: '0.8rem' }}>{v.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selected.plate_number && (
                <div style={{ marginTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Number Plate: </span>
                  <span className="plate-badge">{selected.plate_number}</span>
                </div>
              )}
            </div>
          )}

          {/* History Grid */}
          <div className="history-grid">
            {items.map(item => (
              <div key={item.id} className="glass-card history-card" onClick={() => setSelected(item)}>
                <div className="history-card-thumb">
                  {item.result_image_url ? (
                    <img src={`${API_BASE}${item.result_image_url}`} alt="" />
                  ) : (
                    <Image size={32} />
                  )}
                </div>
                <div className="history-card-body">
                  <div>
                    <div className="history-card-title">{item.filename}</div>
                    <div className="history-card-time">
                      <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                      {item.created_at ? new Date(item.created_at).toLocaleString() : '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {item.total_violations > 0 ? (
                      <span className="badge badge-danger">{item.total_violations}</span>
                    ) : (
                      <span className="badge badge-success">OK</span>
                    )}
                    <button
                      className="btn btn-danger"
                      style={{ padding: '0.3rem', borderRadius: 8 }}
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
              <button
                className="btn btn-outline"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={18} /> Previous
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Page {page} of {pagination.total_pages}
              </span>
              <button
                className="btn btn-outline"
                disabled={page >= pagination.total_pages}
                onClick={() => setPage(p => p + 1)}
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
