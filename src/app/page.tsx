'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ExternalLink, 
  Heart, 
  Eye, 
  Share2, 
  MessageCircle, 
  Search, 
  RefreshCw, 
  Download, 
  Play, 
  CheckCircle2, 
  Clock, 
  User, 
  Layers, 
  Code2, 
  BookOpen, 
  Sparkles,
  ShieldCheck,
  Trash2,
  ThumbsUp,
  Smile,
  Terminal,
  Activity
} from 'lucide-react';

interface Story {
  id: string;
  story_url: string;
  title: string;
  author_name: string;
  author_id: string;
  page_url: string;
  media_type: string;
  media_url: string;
  status: string;
  privacy?: string;
  total_views: number;
  total_reactions: number;
  total_replies: number;
  created_at: string;
  updated_at: string;
  interactions?: Interaction[];
}

interface Interaction {
  id: number;
  story_id: string;
  user_name: string;
  user_profile_url: string;
  interaction_type: 'love' | 'like' | 'haha' | 'wow' | 'view' | 'reply' | string;
  comment_text?: string | null;
  avatar_url?: string;
  created_at: string;
  story_title?: string;
}

interface Stats {
  totalStories: number;
  totalViews: number;
  totalReactions: number;
  totalUniqueProfiles: number;
  totalInteractions: number;
  reactionsBreakdown: {
    love: number;
    like: number;
    haha: number;
  };
}

export default function HomePage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'stories' | 'scanner' | 'database' | 'guide'>('stories');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);

  // Scanner state
  const [targetName, setTargetName] = useState<string>('Trần Văn An');
  const [privacy, setPrivacy] = useState<string>('Công khai (Public)');
  const [scanUrl, setScanUrl] = useState<string>(
    'https://www.facebook.com/stories/120880389116714/UzpfSVNDOjIwNjc5NzMzOTcxNjY0MTU=/?bucket_count=9&source=story_tray'
  );
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [scanResult, setScanResult] = useState<any>(null);

  // Database inspector state
  const [dbTab, setDbTab] = useState<'interactions' | 'stories' | 'scans'>('interactions');
  const [allInteractions, setAllInteractions] = useState<Interaction[]>([]);

  // Show toast notification
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch stories & stats
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stories');
      const data = await res.json();
      if (data.success) {
        setStories(data.data.stories || []);
        setStats(data.data.stats || null);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu:', err);
      showToast('Lỗi khi kết nối tới Next.js API');
    } finally {
      setLoading(false);
    }
  };

  // Fetch story details
  const viewStoryDetail = async (storyId: string) => {
    try {
      setDetailLoading(true);
      const res = await fetch(`/api/stories/${storyId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedStory(data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Không thể tải chi tiết story');
    } finally {
      setDetailLoading(false);
    }
  };

  // Delete story
  const deleteStory = async (storyId: string) => {
    if (!confirm('Bạn có chắc muốn xóa Story này khỏi SQLite?')) return;
    try {
      const res = await fetch(`/api/stories/${storyId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Đã xóa Story khỏi SQLite');
        if (selectedStory?.id === storyId) setSelectedStory(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Scanner / Crawler Ingest
  const handleStartScan = async () => {
    if (!scanUrl.trim()) {
      showToast('Vui lòng nhập đường link Facebook Story');
      return;
    }

    setIsScanning(true);
    setScanLogs(['[INIT] Đang gửi yêu cầu tới Next.js Scanner Engine...']);
    setScanResult(null);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: scanUrl,
          targetName: targetName.trim() || 'Trần Văn An',
          privacy: privacy || 'Công khai (Public)'
        })
      });

      const json = await res.json();
      if (json.success) {
        setScanLogs(json.data.logs || []);
        setScanResult(json.data);
        showToast('Đã quét và lưu thành công vào SQLite!');
        loadData();
      } else {
        setScanLogs(prev => [...prev, `[ERROR] ${json.error}`]);
        showToast('Quá trình quét thất bại: ' + json.error);
      }
    } catch (err: any) {
      setScanLogs(prev => [...prev, `[FATAL] Không thể kết nối tới server: ${err.message}`]);
    } finally {
      setIsScanning(false);
    }
  };

  // Reseed DB
  const handleReseed = async () => {
    if (!confirm('Khởi tạo lại dữ liệu mẫu cho SQLite?')) return;
    try {
      const res = await fetch('/api/db/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Đã khởi tạo lại SQLite Database!');
        loadData();
      }
    } catch (err) {
      showToast('Lỗi khi reseed database');
    }
  };

  // Load raw interactions for DB tab
  const loadInteractions = async () => {
    try {
      const res = await fetch('/api/export?format=json');
      const data = await res.json();
      if (data.interactions) {
        setAllInteractions(data.interactions);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'database') {
      loadInteractions();
    }
  }, [activeTab]);

  // Filter stories
  const filteredStories = stories.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.story_url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '80px' }}>
      
      {/* Toast */}
      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} color="#34d399" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <header className="header glass-panel" style={{ padding: '14px 24px', marginBottom: '28px' }}>
        <div className="header-inner">
          <div className="brand-wrapper">
            <div className="brand-icon">
              <Activity size={24} color="#ffffff" />
            </div>
            <div>
              <div className="brand-title">Facebook Insights Hub</div>
              <div className="brand-sub">Next.js Fullstack Server &bull; SQLite Database</div>
            </div>
          </div>

          <div className="header-actions">
            <div className="status-badge">
              <span className="status-dot"></span>
              <span>SQLite Connected: facebook_insights.db</span>
            </div>

            <button 
              className="btn btn-secondary" 
              onClick={handleReseed}
              title="Khởi tạo lại dữ liệu mẫu"
            >
              <RefreshCw size={15} />
              Reset DB
            </button>

            <a 
              href="/api/export?format=csv" 
              className="btn btn-secondary"
              download
              title="Tải toàn bộ danh sách người xem về máy tính dưới dạng file CSV"
            >
              <Download size={15} />
              Xuất CSV
            </a>

            <button 
              className="btn btn-primary"
              onClick={() => {
                setActiveTab('scanner');
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
            >
              <Play size={15} />
              Quét Story Ngay
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-pill">
          <Sparkles size={14} />
          <span>Fullstack Next.js + SQLite Engine</span>
        </div>
        <h1 className="hero-title">
          Thu Thập & Phân Tích Dữ Liệu <span>Facebook Story</span>
        </h1>
        <p className="hero-desc">
          Hệ thống máy chủ Next.js App Router kết hợp cơ sở dữ liệu SQLite cục bộ (zero config). 
          Thu thập người xem, profile Facebook cá nhân, thả tym (Love), lượt xem và bình luận với giao diện trực quan.
        </p>
      </section>

      {/* Metric Cards */}
      <div className="stat-grid">
        <div className="stat-card glass-panel" style={{ '--card-glow': 'rgba(24, 119, 242, 0.25)' } as React.CSSProperties}>
          <div className="stat-header">
            <span className="stat-label">Tổng Story Theo Dõi</span>
            <div className="stat-icon" style={{ color: '#60a5fa' }}>
              <Layers size={18} />
            </div>
          </div>
          <div className="stat-value">{stats ? stats.totalStories : '...'}</div>
          <div className="stat-footer">
            <CheckCircle2 size={14} color="#10b981" />
            <span>Lưu trữ trong bảng `stories`</span>
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ '--card-glow': 'rgba(6, 182, 212, 0.25)' } as React.CSSProperties}>
          <div className="stat-header">
            <span className="stat-label">Tổng Lượt Xem (Views)</span>
            <div className="stat-icon" style={{ color: '#38bdf8' }}>
              <Eye size={18} />
            </div>
          </div>
          <div className="stat-value">{stats ? stats.totalViews.toLocaleString('vi-VN') : '...'}</div>
          <div className="stat-footer">
            <span>Trung bình ~{stats && stats.totalStories > 0 ? Math.round(stats.totalViews / stats.totalStories) : 0} lượt/story</span>
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ '--card-glow': 'rgba(255, 46, 99, 0.25)' } as React.CSSProperties}>
          <div className="stat-header">
            <span className="stat-label">Thả Tym & Cảm Xúc</span>
            <div className="stat-icon" style={{ color: '#ff2e63' }}>
              <Heart size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#ff4d7a' }}>
            {stats ? stats.totalReactions.toLocaleString('vi-VN') : '...'}
          </div>
          <div className="stat-footer">
            <span>❤️ {stats?.reactionsBreakdown?.love || 0} Tym &bull; 👍 {stats?.reactionsBreakdown?.like || 0} Thích &bull; 😆 {stats?.reactionsBreakdown?.haha || 0} Haha</span>
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ '--card-glow': 'rgba(16, 185, 129, 0.25)' } as React.CSSProperties}>
          <div className="stat-header">
            <span className="stat-label">Profile Người Xem Đã Lưu</span>
            <div className="stat-icon" style={{ color: '#34d399' }}>
              <User size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#34d399' }}>
            {stats ? stats.totalUniqueProfiles : '...'}
          </div>
          <div className="stat-footer">
            <span>Có đầy đủ Tên, Link profile & Avatar</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-nav">
        <button 
          className={`tab-btn ${activeTab === 'stories' ? 'active' : ''}`}
          onClick={() => setActiveTab('stories')}
        >
          <Layers size={17} />
          Danh Sách Story & Người Xem ({stories.length})
        </button>

        <button 
          className={`tab-btn ${activeTab === 'scanner' ? 'active' : ''}`}
          onClick={() => setActiveTab('scanner')}
        >
          <Play size={17} />
          Trình Quét & Cào Dữ Liệu (Scanner Engine)
        </button>

        <button 
          className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`}
          onClick={() => setActiveTab('database')}
        >
          <Database size={17} />
          Bảng Dữ Liệu SQLite (Explorer)
        </button>

        <button 
          className={`tab-btn ${activeTab === 'guide' ? 'active' : ''}`}
          onClick={() => setActiveTab('guide')}
        >
          <BookOpen size={17} />
          Hướng Dẫn & Cách Chạy Source Code
        </button>
      </div>

      {/* TAB 1: STORIES & VIEWERS */}
      {activeTab === 'stories' && (
        <section className="stories-section">
          <div className="section-head">
            <div className="section-title">
              <span>Các Facebook Stories Đã Thu Thập</span>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative', minWidth: '280px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm theo URL, tiêu đề, tác giả..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '38px', paddingRight: '12px' }}
                />
              </div>

              <button className="btn btn-secondary" onClick={loadData}>
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
              <RefreshCw size={32} className="spin" style={{ margin: '0 auto 12px' }} />
              <div>Đang tải danh sách Story từ SQLite...</div>
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ color: '#94a3b8', marginBottom: '16px' }}>Chưa có story nào phù hợp với tìm kiếm.</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('scanner')}>
                <Play size={15} /> Quét Story Mới
              </button>
            </div>
          ) : (
            <div className="story-grid">
              {filteredStories.map((story) => (
                <div key={story.id} className="story-card glass-panel">
                  <div>
                    <div className="story-author">
                      <img 
                        src={`https://api.dicebear.com/7.x/identicon/svg?seed=${story.author_id}`}
                        alt={story.author_name}
                        className="author-avatar"
                      />
                      <div className="author-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4>{story.author_name}</h4>
                          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', fontWeight: 600 }}>
                            {story.privacy || 'Công khai (Public)'}
                          </span>
                        </div>
                        <div className="author-meta">
                          ID: {story.author_id} &bull; {new Date(story.created_at).toLocaleDateString('vi-VN')} {new Date(story.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '10px', color: '#f8fafc' }}>
                      {story.title}
                    </h3>

                    {/* Target URL */}
                    <div className="story-url-box">
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {story.story_url}
                      </span>
                      <a 
                        href={story.story_url} 
                        target="_blank" 
                        rel="noreferrer"
                        title="Mở link story gốc trên Facebook"
                        style={{ color: '#38bdf8', display: 'flex', alignItems: 'center' }}
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>

                    {/* Reactions Pill Bar */}
                    <div className="reactions-bar">
                      <div className="reaction-pill like">
                        <Eye size={13} />
                        <span>{story.total_views} lượt xem</span>
                      </div>
                      <div className="reaction-pill love">
                        <Heart size={13} fill="#ff2e63" />
                        <span>{story.total_reactions} thả tym</span>
                      </div>
                      {story.total_replies > 0 && (
                        <div className="reaction-pill care">
                          <MessageCircle size={13} />
                          <span>{story.total_replies} bình luận</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="story-card-footer">
                    <button 
                      className="btn btn-secondary" 
                      style={{ fontSize: '0.82rem', padding: '8px 14px' }}
                      onClick={() => viewStoryDetail(story.id)}
                    >
                      <User size={14} />
                      Xem Người Xem & Thả Tym
                    </button>

                    <button 
                      className="btn btn-danger"
                      style={{ padding: '8px 12px' }}
                      onClick={() => deleteStory(story.id)}
                      title="Xóa story này khỏi SQLite"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: SCANNER ENGINE */}
      {activeTab === 'scanner' && (
        <section className="glass-panel" style={{ padding: '32px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
            <div className="brand-icon" style={{ width: '38px', height: '38px' }}>
              <Play size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Trình Quét & Cào Dữ Liệu Facebook Story</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                Nhập đường dẫn Story cần quét. Server Next.js sẽ tiến hành phân tích, thu thập người xem, link profile và ghi trực tiếp vào SQLite.
              </p>
            </div>
          </div>

          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="form-label">Tên người cần quét (Target Name / Chủ Story):</label>
              <input 
                type="text" 
                className="form-input"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                placeholder="Ví dụ: Trần Văn An"
                style={{ fontWeight: 600 }}
              />
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                Bộ lọc trích xuất danh tính tác giả cần quét
              </div>
            </div>

            <div>
              <label className="form-label">Quyền riêng tư (Privacy):</label>
              <select 
                className="form-input"
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
                style={{ background: '#070a11', cursor: 'pointer' }}
              >
                <option value="Công khai (Public)">🌐 Công khai (Public)</option>
                <option value="Bạn bè (Friends)">👥 Bạn bè (Friends)</option>
                <option value="Chỉ mình tôi (Only me)">🔒 Chỉ mình tôi (Only me)</option>
              </select>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                Chế độ phân quyền hiển thị của Story trên Facebook
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Đường dẫn Facebook Story (URL cần cào):</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                className="form-input"
                value={scanUrl}
                onChange={(e) => setScanUrl(e.target.value)}
                placeholder="https://www.facebook.com/stories/..."
                style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}
              />
              <button 
                className="btn btn-primary"
                onClick={handleStartScan}
                disabled={isScanning}
                style={{ minWidth: '190px' }}
              >
                {isScanning ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    Đang Cào Dữ Liệu...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Quét Story Ngay
                  </>
                )}
              </button>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '6px' }}>
              URL mẫu: <code>https://www.facebook.com/stories/120880389116714/UzpfSVNDOjIwNjc5NzMzOTcxNjY0MTU=/?bucket_count=9&source=story_tray</code>
            </div>
          </div>

          {/* Terminal Scan Logs */}
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
                <Terminal size={15} color="#38bdf8" />
                <span>Nhật ký tiến trình (Real-time Scanner Execution Log):</span>
              </div>
              {scanLogs.length > 0 && (
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                  onClick={() => setScanLogs([])}
                >
                  Xóa Log
                </button>
              )}
            </div>

            <div style={{
              background: '#070a11',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              color: '#38bdf8',
              minHeight: '160px',
              maxHeight: '260px',
              overflowY: 'overlay' as any
            }} className="overlay-scroll">
              {scanLogs.length === 0 ? (
                <div style={{ color: '#475569', fontStyle: 'italic' }}>
                  Nhấn "Quét Story Ngay" để kích hoạt tiến trình cào dữ liệu cho {targetName}...
                </div>
              ) : (
                scanLogs.map((log, idx) => (
                  <div key={idx} style={{ 
                    marginBottom: '4px',
                    color: log.includes('[ERROR]') || log.includes('[FATAL]') ? '#f87171' :
                           log.includes('[SUCCESS]') || log.includes('[DONE]') ? '#34d399' :
                           log.includes('[SQLITE]') ? '#fbbf24' : '#38bdf8'
                  }}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* STRUCTURED RESULT VIEW (TRẢ VỀ ĐÚNG YÊU CẦU CỦA USER) */}
          {scanResult && (
            <div style={{ marginTop: '24px', padding: '24px', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 'var(--radius-lg)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={22} color="#10b981" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                    Kết Quả Quét Story của: <span style={{ color: '#38bdf8' }}>{scanResult.author_name}</span>
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ padding: '4px 12px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '999px', fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600 }}>
                    Quyền riêng tư: {scanResult.privacy}
                  </span>
                  <span style={{ padding: '4px 12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '999px', fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>
                    {scanResult.total_views} Lượt xem
                  </span>
                  <span style={{ padding: '4px 12px', background: 'rgba(255, 46, 99, 0.15)', border: '1px solid rgba(255, 46, 99, 0.3)', borderRadius: '999px', fontSize: '0.8rem', color: '#ff4d7a', fontWeight: 600 }}>
                    {scanResult.total_reactions} Thả cảm xúc
                  </span>
                </div>
              </div>

              {/* Table of viewers with direct Facebook Profile links */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} color="#38bdf8" />
                <span>Danh sách người xem & Link Facebook cá nhân ({scanResult.viewers?.length || 0} người):</span>
              </h4>

              <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: '#0a0d14' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.04)', color: '#94a3b8', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ padding: '10px 14px' }}>Tên người xem</th>
                      <th style={{ padding: '10px 14px' }}>Hành động / Thả tym</th>
                      <th style={{ padding: '10px 14px' }}>Link Facebook Cá Nhân</th>
                      <th style={{ padding: '10px 14px' }}>Bình luận đi kèm</th>
                      <th style={{ padding: '10px 14px' }}>Thời gian xem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanResult.viewers && scanResult.viewers.map((viewer: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img 
                              src={viewer.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${viewer.name}`} 
                              alt="" 
                              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <span style={{ fontWeight: 600, color: '#f8fafc' }}>{viewer.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className={`reaction-pill ${viewer.interactionType === 'love' ? 'love' : viewer.interactionType === 'like' ? 'like' : 'care'}`} style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                            {viewer.interactionType === 'love' ? '❤️ Thả tym' : 
                             viewer.interactionType === 'like' ? '👍 Thích' : 
                             viewer.interactionType === 'haha' ? '😆 Haha' : 
                             viewer.interactionType === 'view' ? '👁️ Xem' : viewer.interactionType}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <a 
                            href={viewer.profileUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ 
                              color: '#38bdf8', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '6px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.82rem',
                              background: 'rgba(56, 189, 248, 0.1)',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid rgba(56, 189, 248, 0.2)'
                            }}
                          >
                            <span>{viewer.profileUrl}</span>
                            <ExternalLink size={12} />
                          </a>
                        </td>
                        <td style={{ padding: '10px 14px', color: viewer.comment ? '#f1f5f9' : '#64748b', fontStyle: viewer.comment ? 'normal' : 'italic' }}>
                          {viewer.comment || '-'}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '0.78rem' }}>
                          {new Date(viewer.viewedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} &bull; {new Date(viewer.viewedAt).toLocaleDateString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ fontSize: '0.85rem', padding: '8px 16px' }}
                  onClick={() => {
                    setActiveTab('stories');
                    viewStoryDetail(scanResult.storyId);
                  }}
                >
                  <Eye size={14} /> Mở Trong Quản Lý Stories
                </button>
                <a 
                  href="/api/export?format=csv"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem', padding: '8px 16px' }}
                >
                  <Download size={14} /> Xuất Danh Sách Người Xem (CSV)
                </a>
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: DATABASE EXPLORER */}
      {activeTab === 'database' && (
        <section className="glass-panel" style={{ padding: '32px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="brand-icon" style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' }}>
                <Database size={20} color="#ffffff" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>SQLite Database Explorer</h2>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  Tệp vật lý: <code>data/facebook_insights.db</code> &bull; Chuẩn lưu trữ SQLite Engine
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className={`btn ${dbTab === 'interactions' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 14px', fontSize: '0.84rem' }}
                onClick={() => setDbTab('interactions')}
              >
                Bảng `interactions` (Người xem & Tym)
              </button>
              <button 
                className={`btn ${dbTab === 'stories' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 14px', fontSize: '0.84rem' }}
                onClick={() => setDbTab('stories')}
              >
                Bảng `stories` ({stories.length})
              </button>
              <a 
                href="/api/export?format=json" 
                target="_blank"
                className="btn btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.84rem' }}
              >
                <Code2 size={14} /> Xuất JSON
              </a>
            </div>
          </div>

          {/* Table display */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            {dbTab === 'interactions' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid var(--border-subtle)', color: '#94a3b8' }}>
                    <th style={{ padding: '12px 16px' }}>#</th>
                    <th style={{ padding: '12px 16px' }}>Người xem / Tài khoản</th>
                    <th style={{ padding: '12px 16px' }}>Tương tác</th>
                    <th style={{ padding: '12px 16px' }}>Link Facebook Cá Nhân</th>
                    <th style={{ padding: '12px 16px' }}>Bình luận / Tin nhắn</th>
                    <th style={{ padding: '12px 16px' }}>Thời gian ghi nhận</th>
                  </tr>
                </thead>
                <tbody>
                  {allInteractions.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                        Đang đọc dữ liệu từ SQLite...
                      </td>
                    </tr>
                  ) : (
                    allInteractions.map((item, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{item.id || index + 1}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img 
                              src={item.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${item.user_name}`} 
                              alt="" 
                              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <span style={{ fontWeight: 600, color: '#f8fafc' }}>{item.user_name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className={`reaction-pill ${item.interaction_type === 'love' ? 'love' : item.interaction_type === 'like' ? 'like' : 'care'}`}>
                            {item.interaction_type === 'love' && <Heart size={12} fill="#ff2e63" />}
                            {item.interaction_type === 'like' && <ThumbsUp size={12} />}
                            {item.interaction_type === 'haha' && <Smile size={12} />}
                            {item.interaction_type === 'view' && <Eye size={12} />}
                            {item.interaction_type.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <a 
                            href={item.user_profile_url} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
                          >
                            <span>{item.user_profile_url.replace('https://www.facebook.com/', '@')}</span>
                            <ExternalLink size={12} />
                          </a>
                        </td>
                        <td style={{ padding: '12px 16px', color: item.comment_text ? '#e2e8f0' : '#64748b', fontStyle: item.comment_text ? 'normal' : 'italic' }}>
                          {item.comment_text || '(Chỉ xem / thả cảm xúc)'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.82rem' }}>
                          {new Date(item.created_at).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid var(--border-subtle)', color: '#94a3b8' }}>
                    <th style={{ padding: '12px 16px' }}>ID Story</th>
                    <th style={{ padding: '12px 16px' }}>Tác giả</th>
                    <th style={{ padding: '12px 16px' }}>Lượt xem</th>
                    <th style={{ padding: '12px 16px' }}>Thả tym</th>
                    <th style={{ padding: '12px 16px' }}>Story URL</th>
                    <th style={{ padding: '12px 16px' }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {stories.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{s.id}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{s.author_name}</td>
                      <td style={{ padding: '12px 16px' }}>{s.total_views}</td>
                      <td style={{ padding: '12px 16px', color: '#ff4d7a', fontWeight: 600 }}>{s.total_reactions}</td>
                      <td style={{ padding: '12px 16px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <a href={s.story_url} target="_blank" rel="noreferrer" style={{ color: '#94a3b8' }}>
                          {s.story_url}
                        </a>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.78rem' }}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {/* TAB 4: GUIDE */}
      {activeTab === 'guide' && (
        <section className="glass-panel" style={{ padding: '32px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div className="brand-icon" style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #f59e0b 0%, #ff2e63 100%)' }}>
              <BookOpen size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Hướng Dẫn Vận Hành & Chạy Source Code Fullstack</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                Toàn bộ mã nguồn đã được cấu hình trọn gói: Next.js App Router + SQLite Native + API Ingest + Dashboard UI.
              </p>
            </div>
          </div>

          <div className="doc-card glass-panel" style={{ background: 'rgba(0, 0, 0, 0.25)' }}>
            <div className="doc-step">
              <div className="step-num">1</div>
              <div className="step-content">
                <h4>Khởi chạy Development Server</h4>
                <p>Mở terminal tại thư mục dự án và chạy lệnh sau:</p>
                <div className="code-editor" style={{ minHeight: '60px', padding: '12px' }}>
                  npm run dev
                </div>
                <p style={{ marginTop: '8px' }}>
                  Sau khi chạy, truy cập trình duyệt tại: <a href="http://localhost:3000" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>http://localhost:3000</a>
                </p>
              </div>
            </div>

            <div className="doc-step">
              <div className="step-num">2</div>
              <div className="step-content">
                <h4>Cơ sở dữ liệu SQLite cục bộ (Zero Config)</h4>
                <p>
                  Dự án sử dụng module <code>node:sqlite</code> tích hợp sẵn trong Node.js (Node 22+). 
                  Toàn bộ dữ liệu được lưu vĩnh viễn vào tệp:
                </p>
                <div className="code-editor" style={{ minHeight: '40px', padding: '10px' }}>
                  data/facebook_insights.db
                </div>
                <p style={{ marginTop: '8px' }}>
                  Bạn không cần cài đặt thêm MySQL, PostgreSQL hay Docker. Tệp SQLite tự động được tạo và cấu trúc khi chạy server.
                </p>
              </div>
            </div>

            <div className="doc-step">
              <div className="step-num">3</div>
              <div className="step-content">
                <h4>API Endpoints cung cấp sẵn</h4>
                <ul style={{ paddingLeft: '20px', color: '#cbd5e1', lineHeight: '1.8' }}>
                  <li><code>GET /api/stories</code>: Lấy danh sách stories và số liệu thống kê tổng hợp.</li>
                  <li><code>POST /api/scan</code>: Gửi đường link Facebook Story để cào dữ liệu và lưu vào SQLite.</li>
                  <li><code>GET /api/stories/[id]</code>: Lấy chi tiết story và danh sách người xem, thả tym.</li>
                  <li><code>GET /api/export?format=csv</code>: Tải danh sách người xem về máy dạng file Excel/CSV.</li>
                  <li><code>POST /api/db/seed</code>: Reset và nạp lại dữ liệu mẫu vào SQLite.</li>
                </ul>
              </div>
            </div>

            <div className="doc-step">
              <div className="step-num">4</div>
              <div className="step-content">
                <h4>Chính sách & Kết nối Meta Graph API thực tế</h4>
                <p>
                  Đối với các Fanpage/Doanh nghiệp bạn quản lý, bạn có thể truyền trực tiếp <code>Page Access Token</code> để nhận dữ liệu Story Insights qua webhook chính thống của Meta mà không lo ngại việc bị khóa tài khoản hoặc chặn IP.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* DETAIL MODAL (Khi người dùng click Xem Người Xem) */}
      {selectedStory && (
        <div className="modal-overlay" onClick={() => setSelectedStory(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Heart size={20} color="#ff2e63" fill="#ff2e63" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  Danh Sách Người Xem & Thả Tym: {selectedStory.title}
                </h3>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px' }}
                onClick={() => setSelectedStory(null)}
              >
                ✕ Đóng
              </button>
            </div>

            <div className="modal-body">
              {/* Story Summary Card */}
              <div style={{ display: 'flex', gap: '16px', background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Đường dẫn Story gốc:</div>
                  <a 
                    href={selectedStory.story_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ color: '#38bdf8', fontSize: '0.85rem', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>{selectedStory.story_url}</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div className="reaction-pill like">
                    <Eye size={13} />
                    <span>{selectedStory.total_views} Lượt xem</span>
                  </div>
                  <div className="reaction-pill love">
                    <Heart size={13} fill="#ff2e63" />
                    <span>{selectedStory.total_reactions} Thả tym</span>
                  </div>
                </div>
              </div>

              {/* Viewers & Reactions Table */}
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} color="#38bdf8" />
                <span>Chi tiết tài khoản người xem ({selectedStory.interactions?.length || 0} tài khoản ghi nhận):</span>
              </h4>

              {detailLoading ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                  Đang tải danh sách người xem...
                </div>
              ) : !selectedStory.interactions || selectedStory.interactions.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                  Chưa có tương tác nào được ghi nhận cho story này.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', borderBottom: '1px solid var(--border-subtle)' }}>
                        <th style={{ padding: '10px 14px' }}>Tên người dùng</th>
                        <th style={{ padding: '10px 14px' }}>Hành động</th>
                        <th style={{ padding: '10px 14px' }}>Link Facebook</th>
                        <th style={{ padding: '10px 14px' }}>Bình luận</th>
                        <th style={{ padding: '10px 14px' }}>Thời gian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStory.interactions.map((viewer) => (
                        <tr key={viewer.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <img 
                                src={viewer.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${viewer.user_name}`} 
                                alt="" 
                                style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                              <span style={{ fontWeight: 600, color: '#f8fafc' }}>{viewer.user_name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span className={`reaction-pill ${viewer.interaction_type === 'love' ? 'love' : viewer.interaction_type === 'like' ? 'like' : 'care'}`} style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                              {viewer.interaction_type === 'love' ? '❤️ Thả tym' : 
                               viewer.interaction_type === 'like' ? '👍 Thích' : 
                               viewer.interaction_type === 'haha' ? '😆 Haha' : 
                               viewer.interaction_type === 'view' ? '👁️ Xem' : viewer.interaction_type}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <a 
                              href={viewer.user_profile_url} 
                              target="_blank" 
                              rel="noreferrer" 
                              style={{ color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <span>Xem Profile</span>
                              <ExternalLink size={12} />
                            </a>
                          </td>
                          <td style={{ padding: '10px 14px', color: viewer.comment_text ? '#f1f5f9' : '#64748b', fontStyle: viewer.comment_text ? 'normal' : 'italic' }}>
                            {viewer.comment_text || '-'}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '0.78rem' }}>
                            {new Date(viewer.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} &bull; {new Date(viewer.created_at).toLocaleDateString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
