import React from 'react';
import { X, ShieldCheck, Trash2, CheckCircle2, Lock, EyeOff, Ban } from 'lucide-react';

export default function PrivacyModal({ isOpen, onClose, onClearHistory, historyCount }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={24} color="var(--accent-emerald)" />
            <h2 className="modal-title">BINGE Privacy Architecture</h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px' }}>
          Unlike traditional ad-funded video networks, BINGE is built from the database up with privacy-by-design.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
          <div style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <Ban size={18} color="var(--accent-rose)" style={{ marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Zero Advertisements</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No video ads, banner slots, tracking beacons, or forced sponsored content.
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <EyeOff size={18} color="var(--accent-amber)" style={{ marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>No Algorithmic Recommendations</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Your feed is never manipulated by watch-time retention algorithms. Content appears only through your selected Spaces and manual discovery.
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <Lock size={18} color="var(--accent-emerald)" style={{ marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Local-Only Watch History</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Your watch history is stored solely inside your browser's local sandbox ({historyCount} videos logged). It is never synchronized to the backend server.
              </div>
            </div>
          </div>
        </div>

        {/* Action: Clear Local History */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <button
            id="clear-history-btn"
            className="btn-secondary"
            style={{
              color: 'var(--accent-rose)',
              borderColor: 'rgba(255, 51, 102, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => {
              onClearHistory();
              alert("Local watch history cleared from this browser.");
            }}
          >
            <Trash2 size={16} />
            <span>Clear Local History</span>
          </button>

          <button className="btn-primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
