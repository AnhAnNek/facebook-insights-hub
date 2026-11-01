import React from 'react';

interface SummaryData {
  totalStories: number;
  totalReach: number;
  totalImpressions: number;
  totalReactions: number;
  totalLoves: number;
  avgEngagementRate: string;
}

interface StatCardsProps {
  summary: SummaryData;
}

export default function StatCards({ summary }: StatCardsProps) {
  return (
    <div className="stat-grid">
      <div className="glass-panel stat-card" style={{ ['--card-glow' as string]: 'rgba(24, 119, 242, 0.2)' }}>
        <div className="stat-header">
          <span className="stat-label">Tổng Story Giám Sát</span>
          <div className="stat-icon" style={{ color: '#38bdf8' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>
        <div className="stat-value">{summary.totalStories}</div>
        <div className="stat-footer">
          <span>✓ Đang theo dõi và lưu trữ</span>
        </div>
      </div>

      <div className="glass-panel stat-card" style={{ ['--card-glow' as string]: 'rgba(6, 182, 212, 0.2)' }}>
        <div className="stat-header">
          <span className="stat-label">Tổng Lượt Tiếp Cận (Reach)</span>
          <div className="stat-icon" style={{ color: '#06b6d4' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        </div>
        <div className="stat-value">{summary.totalReach.toLocaleString()}</div>
        <div className="stat-footer">
          <span>{summary.totalImpressions.toLocaleString()} Impressions</span>
        </div>
      </div>

      <div className="glass-panel stat-card" style={{ ['--card-glow' as string]: 'rgba(255, 46, 99, 0.25)' }}>
        <div className="stat-header">
          <span className="stat-label">Thả Tym (Love ❤️)</span>
          <div className="stat-icon" style={{ color: '#ff2e63' }}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        </div>
        <div className="stat-value" style={{ color: '#ff4d7a' }}>{summary.totalLoves.toLocaleString()}</div>
        <div className="stat-footer">
          <span>{summary.totalReactions.toLocaleString()} tổng cảm xúc</span>
        </div>
      </div>

      <div className="glass-panel stat-card" style={{ ['--card-glow' as string]: 'rgba(16, 185, 129, 0.2)' }}>
        <div className="stat-header">
          <span className="stat-label">Tỷ Lệ Tương Tác</span>
          <div className="stat-icon" style={{ color: '#10b981' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
        <div className="stat-value" style={{ color: '#34d399' }}>{summary.avgEngagementRate}</div>
        <div className="stat-footer">
          <span>Engagement / Reach</span>
        </div>
      </div>
    </div>
  );
}
