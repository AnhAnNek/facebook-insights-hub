'use strict';
import React from 'react';

interface HeaderProps {
  lastUpdated?: string;
  totalStories: number;
}

export default function Header({ lastUpdated, totalStories }: HeaderProps) {
  return (
    <header className="header">
      <div className="container header-inner">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" fill="white"/>
            </svg>
          </div>
          <div>
            <div className="brand-title">FB Insights Hub</div>
            <div className="brand-sub">Next.js Server API & Story Analytics Receiver</div>
          </div>
        </div>

        <div className="header-actions">
          <div className="status-badge">
            <span className="status-dot"></span>
            Server Ready ({totalStories} Stories)
          </div>
          {lastUpdated && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Cập nhật: {new Date(lastUpdated).toLocaleTimeString('vi-VN')}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
