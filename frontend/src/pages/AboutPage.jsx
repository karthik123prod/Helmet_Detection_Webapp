import { Shield, Cpu, Eye, Database, Mail, Globe } from 'lucide-react';

export default function AboutPage() {
  return (
    <div>
      <div className="page-header">
        <h1>ℹ️ About This System</h1>
        <p>AI-powered helmet detection & traffic safety monitoring</p>
      </div>

      {/* Overview */}
      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>System Overview</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.92rem' }}>
          This system uses deep learning models to detect traffic safety violations
          from images and videos. It identifies motorcycles and riders, checks for helmet
          compliance, detects triple riding violations, and performs number plate recognition
          on violating vehicles. The system processes uploads through a 3-stage AI pipeline
          and generates annotated results with bounding boxes and violation alerts.
        </p>
      </div>

      {/* Detection Pipeline */}
      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>3-Stage Detection Pipeline</h3>
        <div className="pipeline-steps">
          <div className="glass-card pipeline-step">
            <div className="pipeline-step-num">1</div>
            <h4>Vehicle & Person Detection</h4>
            <p>YOLOv3 trained on COCO dataset detects motorcycles and persons in the scene</p>
          </div>
          <div className="glass-card pipeline-step">
            <div className="pipeline-step-num">2</div>
            <h4>Helmet Detection</h4>
            <p>Custom-trained YOLOv3 model identifies helmets and checks compliance</p>
          </div>
          <div className="glass-card pipeline-step">
            <div className="pipeline-step-num">3</div>
            <h4>Plate Recognition</h4>
            <p>CNN classifier identifies the registration number of violating vehicles</p>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Technology Stack</h3>
        <div className="tech-grid">
          {[
            { icon: Globe, name: 'React + Vite', desc: 'Frontend UI', color: 'var(--accent-primary)' },
            { icon: Cpu, name: 'FastAPI', desc: 'Backend API', color: 'var(--success)' },
            { icon: Eye, name: 'YOLOv3 + OpenCV', desc: 'Object Detection', color: 'var(--warning)' },
            { icon: Shield, name: 'TensorFlow/Keras', desc: 'CNN Model', color: 'var(--danger)' },
            { icon: Database, name: 'SQLite', desc: 'Result Storage', color: 'var(--accent-secondary)' },
            { icon: Mail, name: 'Yagmail', desc: 'Email Alerts', color: 'var(--info)' },
          ].map(tech => (
            <div key={tech.name} className="glass-card tech-card">
              <div className="tech-card-icon" style={{ background: `${tech.color}15`, color: tech.color }}>
                <tech.icon size={22} />
              </div>
              <h4>{tech.name}</h4>
              <p>{tech.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Violation Types */}
      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Detectable Violations</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.06)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.15)' }}>
            <h4 style={{ color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '0.35rem' }}>⛑️ No Helmet</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Detected when number of helmets is less than riders on a motorcycle. Severity: High.
            </p>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(245,158,11,0.06)', borderRadius: 12, border: '1px solid rgba(245,158,11,0.15)' }}>
            <h4 style={{ color: 'var(--warning)', fontSize: '0.9rem', marginBottom: '0.35rem' }}>👥 Triple Riding</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Detected when 3 or more persons are found on a single motorcycle. Severity: Critical.
            </p>
          </div>
        </div>
      </div>

      {/* Model Info */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Model Details</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                {['Model', 'Type', 'Input', 'Classes', 'Size'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Person/Bike Detector', 'YOLOv3 (Darknet)', '416×416', 'person, motorbike', '248 MB'],
                ['Helmet Detector', 'YOLOv3 (Custom)', '416×416', 'Helmet', '246 MB'],
                ['Plate Classifier', 'CNN Sequential', '64×64', '20 classes (demo)', '3.2 MB'],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: '0.75rem', color: j === 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
