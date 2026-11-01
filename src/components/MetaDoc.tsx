import React from 'react';

export default function MetaDoc() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="glass-panel doc-card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 14, color: '#38bdf8' }}>
          📘 Hướng Dẫn Kiến Trúc & Tích Hợp Server Next.js
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: 20 }}>
          Hệ thống được thiết kế với chuẩn RESTful API và Webhook Receiver, cho phép bạn tiếp nhận dữ liệu tương tác Facebook từ mọi nguồn hợp pháp (Meta Graph API, Webhooks, hoặc Worker nội bộ).
        </p>

        <div className="doc-step">
          <div className="step-num">1</div>
          <div className="step-content">
            <h4>Đẩy dữ liệu về Next.js Server qua cURL hoặc Python/Node.js</h4>
            <p>Bất kỳ tiến trình nào thu thập dữ liệu đều có thể gửi payload chuẩn JSON về endpoint sau:</p>
            <pre style={{
              background: '#0a0d14',
              padding: 12,
              borderRadius: 8,
              fontSize: '0.8rem',
              color: '#38bdf8',
              fontFamily: 'var(--font-mono)',
              overflowX: 'auto'
            }}>
{`curl -X POST http://localhost:3000/api/collect \\
  -H "Content-Type: application/json" \\
  -d '{
    "storyUrl": "https://www.facebook.com/stories/120880389116714/...",
    "authorName": "Easy English",
    "reachCount": 1420,
    "reactions": { "love": 382, "like": 124 },
    "viewers": [
      { "name": "Nguyễn Văn A", "viewedAt": "2026-11-01T20:00:00Z", "reaction": "love" }
    ]
  }'`}
            </pre>
          </div>
        </div>

        <div className="doc-step">
          <div className="step-num">2</div>
          <div className="step-content">
            <h4>Cấu hình Webhooks tự động với Meta for Developers</h4>
            <p>Khi bạn sở hữu Fanpage / Creator Profile, bạn có thể thiết lập Webhook để Meta tự động bắn sự kiện về Next.js:</p>
            <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.8 }}>
              <li><strong>Callback URL:</strong> <code>https://your-domain.com/api/webhook</code></li>
              <li><strong>Verify Token:</strong> <code>meta_insights_secret_token_2026</code> (hoặc cấu hình trong biến môi trường <code>META_WEBHOOK_VERIFY_TOKEN</code>)</li>
              <li><strong>Subscription Fields:</strong> <code>story_insights</code>, <code>feed</code>, <code>page_engagement</code></li>
            </ul>
          </div>
        </div>

        <div className="doc-step">
          <div className="step-num">3</div>
          <div className="step-content">
            <h4>Chính sách bảo mật quyền riêng tư của Facebook</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Theo quy định của Meta và luật bảo vệ dữ liệu (GDPR/PDPA), danh sách chi tiết từng tài khoản cá nhân xem Story không được công khai ra ngoài. Nền tảng khuyến nghị đo lường qua các chỉ số tổng hợp (Reach, Impressions, Reaction breakdown) để tránh rủi ro vi phạm điều khoản và bảo vệ an toàn cho Fanpage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
