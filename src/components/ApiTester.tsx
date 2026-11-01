import React, { useState } from 'react';
import { FacebookStoryItem } from '@/lib/types';

interface ApiTesterProps {
  onStoryAdded: (newStory: FacebookStoryItem) => void;
}

export default function ApiTester({ onStoryAdded }: ApiTesterProps) {
  const [storyUrl, setStoryUrl] = useState(
    'https://www.facebook.com/stories/120880389116714/UzpfSVNDOjIwNjc5NzMzOTcxNjY0MTU=/?bucket_count=9&source=story_tray'
  );
  const [authorName, setAuthorName] = useState('Easy English Community');
  const [reachCount, setReachCount] = useState(1850);
  const [loveCount, setLoveCount] = useState(420);
  const [likeCount, setLikeCount] = useState(165);
  const [viewerNameInput, setViewerNameInput] = useState('Trần Văn An');
  const [loading, setLoading] = useState(false);
  const [responseLog, setResponseLog] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponseLog(null);

    const payload = {
      storyUrl,
      authorName,
      authorProfileUrl: 'https://www.facebook.com/120880389116714',
      reachCount: Number(reachCount),
      impressionsCount: Math.round(Number(reachCount) * 1.3),
      reactions: {
        love: Number(loveCount),
        like: Number(likeCount),
        care: 35,
        haha: 12,
        wow: 28,
        sad: 0,
        angry: 0
      },
      viewers: [
        {
          name: viewerNameInput,
          profileUrl: 'https://facebook.com/profile',
          viewedAt: new Date().toISOString(),
          reaction: 'love'
        },
        {
          name: 'Nguyễn Thị Mai',
          profileUrl: 'https://facebook.com/mai',
          viewedAt: new Date(Date.now() - 10 * 60000).toISOString(),
          reaction: 'like'
        }
      ],
      notes: 'Được gửi trực tiếp từ bộ kiểm thử API Ingestion Tester',
      source: 'api_collector'
    };

    const startTime = performance.now();

    try {
      const res = await fetch('/api/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      if (res.ok && data.success) {
        setResponseLog(
          `✓ HTTP 201 Created (${latency}ms)\n` +
          JSON.stringify(data, null, 2)
        );
        onStoryAdded(data.item);
      } else {
        setResponseLog(`✕ HTTP ${res.status} Error:\n` + JSON.stringify(data, null, 2));
      }
    } catch (err) {
      setResponseLog(`✕ Network Exception: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: 28, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 6 }}>
          ⚡ Bộ Giả Lập & Kiểm Thử Đẩy Dữ Liệu về Next.js Server
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Gửi payload kiểm thử trực tiếp vào endpoint <code style={{ color: '#38bdf8' }}>POST /api/collect</code> để kiểm tra quá trình tiếp nhận dữ liệu và đồng bộ giao diện thời gian thực.
        </p>
      </div>

      <form onSubmit={handleSend}>
        <div className="form-group">
          <label className="form-label">Link Story Facebook cần cào / tiếp nhận:</label>
          <input
            type="url"
            required
            className="form-input"
            value={storyUrl}
            onChange={(e) => setStoryUrl(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Tên Fanpage / Tác giả:</label>
            <input
              type="text"
              className="form-input"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Lượt xem (Reach Count):</label>
            <input
              type="number"
              className="form-input"
              value={reachCount}
              onChange={(e) => setReachCount(Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Thả tym (Love ❤️):</label>
            <input
              type="number"
              className="form-input"
              value={loveCount}
              onChange={(e) => setLoveCount(Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Thích (Like 👍):</label>
            <input
              type="number"
              className="form-input"
              value={likeCount}
              onChange={(e) => setLikeCount(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Mẫu người xem (Viewer Name):</label>
          <input
            type="text"
            className="form-input"
            value={viewerNameInput}
            onChange={(e) => setViewerNameInput(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ minWidth: 200 }}
          >
            {loading ? 'Đang gửi...' : '🚀 Gửi Dữ Liệu Lên Server'}
          </button>
        </div>
      </form>

      {responseLog && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
            KẾT QUẢ PHẢN HỒI TỪ SERVER NEXT.JS:
          </div>
          <pre
            style={{
              background: '#0a0d14',
              padding: 16,
              borderRadius: 10,
              fontSize: '0.82rem',
              color: responseLog.startsWith('✓') ? '#86efac' : '#f87171',
              fontFamily: 'var(--font-mono)',
              whiteSpace: 'pre-wrap',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            {responseLog}
          </pre>
        </div>
      )}
    </div>
  );
}
