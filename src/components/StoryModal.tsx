import React, { useState } from 'react';
import { FacebookStoryItem } from '@/lib/types';

interface StoryModalProps {
  story: FacebookStoryItem | null;
  onClose: () => void;
}

export default function StoryModal({ story, onClose }: StoryModalProps) {
  const [copied, setCopied] = useState(false);

  if (!story) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(story, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.4rem' }}>📊</span>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Chi Tiết Story & Thống Kê Tương Tác</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {story.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', borderRadius: '50%' }}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Author & Link info */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>LINK STORY:</div>
            <a
              href={story.storyUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#38bdf8',
                wordBreak: 'break-all',
                background: 'rgba(0,0,0,0.3)',
                padding: '8px 12px',
                borderRadius: 8,
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem'
              }}
            >
              {story.storyUrl} ↗
            </a>
          </div>

          {/* Breakdown table */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Reach</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>{story.reachCount.toLocaleString()}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Impressions</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#818cf8' }}>{story.impressionsCount.toLocaleString()}</div>
            </div>
            <div style={{ background: 'rgba(255,46,99,0.08)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#ff7597' }}>Thả Tym (Love)</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ff2e63' }}>{story.reactions.love.toLocaleString()} ❤️</div>
            </div>
            <div style={{ background: 'rgba(24,119,242,0.08)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#93c5fd' }}>Thích (Like)</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1877F2' }}>{story.reactions.like.toLocaleString()} 👍</div>
            </div>
          </div>

          {/* Viewers List */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>👥 Danh sách người xem đã ghi nhận ({story.viewers.length})</span>
            </h4>
            <div style={{ maxHeight: 200, overflowY: 'auto', background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: 8 }}>
              {story.viewers.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Chưa có chi tiết danh sách người xem riêng lẻ (Chỉ có số đo Reach/Impressions).
                </div>
              ) : (
                story.viewers.map((viewer, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: 'var(--text-muted)' }}>#{idx + 1}</span>
                      <span style={{ fontWeight: 600 }}>{viewer.name || `User ID: ${viewer.id}`}</span>
                      {viewer.profileUrl && (
                        <a href={viewer.profileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', fontSize: '0.75rem' }}>
                          [Profile]
                        </a>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {viewer.reaction && (
                        <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 999, fontSize: '0.75rem' }}>
                          {viewer.reaction === 'love' && '❤️ Thả tym'}
                          {viewer.reaction === 'like' && '👍 Thích'}
                          {viewer.reaction === 'care' && '🥰 Thương'}
                          {viewer.reaction === 'wow' && '😮 Wow'}
                        </span>
                      )}
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {new Date(viewer.viewedAt).toLocaleTimeString('vi-VN')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Raw JSON Payload */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>RAW JSON SERVER PAYLOAD:</span>
              <button
                onClick={handleCopyJson}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                {copied ? '✓ Đã sao chép' : '📋 Copy JSON'}
              </button>
            </div>
            <pre style={{
              background: '#0a0d14',
              padding: 14,
              borderRadius: 8,
              fontSize: '0.78rem',
              color: '#38bdf8',
              maxHeight: 180,
              overflowY: 'auto',
              fontFamily: 'var(--font-mono)'
            }}>
              {JSON.stringify(story, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
