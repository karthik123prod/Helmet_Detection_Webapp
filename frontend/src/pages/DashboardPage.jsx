import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, HardHat, Clock, Upload, ArrowRight, AlertTriangle, Image } from 'lucide-react';
import { getStats, getHistory } from '../services/api';

export default function DashboardPage({ showToast }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, historyRes] = await Promise.allSettled([
        getStats(),
        getHistory(1, 5),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data.stats);
      }
      if (historyRes.status === 'fulfilled') {
        setRecent(historyRes.value.data.data || []);
      }
    } catch (e) {
      console.warn('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const API_BASE = import.meta.env.VITE_API_URL || '';

  return (
    <div>
      <div className="page-header">
        <h1>🛡️ Traffic Safety Dashboard</h1>
        <p>AI-powered helmet detection & triple riding monitoring</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="glass-card stat-card blue">
          <div className="stat-card-header">
            <div className="stat-icon blue"><ScanIcon /></div>
          </div>
          <div className="stat-value">{stats?.total_detections ?? '—'}</div>
          <div className="stat-label">Total Scans</div>
        </div>

        <div className="glass-card stat-card red">
          <div className="stat-card-header">
            <div className="stat-icon red"><AlertTriangle size={20} /></div>
          </div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats?.total_violations ?? '—'}</div>
          <div className="stat-label">Violations Found</div>
        </div>

        <div className="glass-card stat-card green">
          <div className="stat-card-header">
            <div className="stat-icon green"><Image size={20} /></div>
          </div>
          <div className="stat-value">{stats?.images_processed ?? '—'}</div>
          <div className="stat-label">Images Processed</div>
        </div>

        <div className="glass-card stat-card orange">
          <div className="stat-card-header">
            <div className="stat-icon orange"><Clock size={20} /></div>
          </div>
          <div className="stat-value">{stats?.avg_inference_time_ms ? `${stats.avg_inference_time_ms}ms` : '—'}</div>
          <div className="stat-label">Avg Inference Time</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
        <div
          className="glass-card"
          style={{ cursor: 'pointer', transition: 'all 0.25s' }}
          onClick={() => navigate('/detect')}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = ''}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
              <Upload size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.15rem' }}>Upload & Detect</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Upload an image or video for AI analysis</p>
            </div>
            <ArrowRight size={20} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>

        <div
          className="glass-card"
          style={{ cursor: 'pointer', transition: 'all 0.25s' }}
          onClick={() => navigate('/history')}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = ''}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-secondary)' }}>
              <Clock size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.15rem' }}>View History</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Browse all past detection results</p>
            </div>
            <ArrowRight size={20} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>
      </div>

      {/* Recent Detections */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={18} color="var(--accent-primary)" /> Recent Detections
        </h3>

        {recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <p>No detections yet. Upload your first image!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recent.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 10,
                  border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onClick={() => navigate('/history')}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {item.result_image_url ? (
                    <img src={`${API_BASE}${item.result_image_url}`} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', background: '#111' }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Image size={18} style={{ opacity: 0.3 }} />
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.filename || 'Detection'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {item.total_violations > 0 ? (
                    <span className="badge badge-danger">{item.total_violations} violation{item.total_violations > 1 ? 's' : ''}</span>
                  ) : (
                    <span className="badge badge-success">Clean</span>
                  )}
                  <span className="badge badge-info">{item.source_type}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ScanIcon() {
  return <Shield size={20} />;
}
