'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ExternalLink, 
  Heart, 
  Eye, 
  MessageCircle, 
  Search, 
  RefreshCw, 
  Download, 
  Play, 
  CheckCircle2, 
  User, 
  Layers, 
  Code2, 
  BookOpen, 
  Sparkles,
  Trash2,
  ThumbsUp,
  Smile,
  Terminal,
  Activity,
  Globe,
  X
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
  const [dbTab, setDbTab] = useState<'interactions' | 'stories'>('interactions');
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
    <div className="min-h-screen bg-[#0a0d14] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
        
        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 bg-slate-900 border border-emerald-500/40 text-emerald-300 rounded-xl shadow-2xl shadow-black/60 animate-bounce">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span className="text-sm font-medium">{toast}</span>
          </div>
        )}

        {/* Header */}
        <header className="sticky top-4 z-40 mb-8 backdrop-blur-xl bg-slate-900/85 border border-white/10 rounded-2xl shadow-xl shadow-black/40 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Activity size={22} className="text-white" />
              </div>
              <div>
                <div className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Facebook Insights Hub
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Next.js App Router &bull; Pure Tailwind CSS &bull; SQLite Engine
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>SQLite Connected: facebook_insights.db</span>
              </div>

              <button 
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl font-medium text-xs bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                onClick={handleReseed}
                title="Khởi tạo lại dữ liệu mẫu"
              >
                <RefreshCw size={14} />
                <span>Reset DB</span>
              </button>

              <a 
                href="/api/export?format=csv" 
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl font-medium text-xs bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                download
                title="Tải toàn bộ danh sách người xem về máy tính dưới dạng file CSV"
              >
                <Download size={14} />
                <span>Xuất CSV</span>
              </a>

              <button 
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                onClick={() => {
                  setActiveTab('scanner');
                  window.scrollTo({ top: 350, behavior: 'smooth' });
                }}
              >
                <Play size={14} />
                <span>Quét Story</span>
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold mb-3">
            <Sparkles size={13} />
            <span>Fullstack Next.js &bull; Tailwind CSS v4 &bull; SQLite Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Thu Thập & Phân Tích Dữ Liệu{' '}
            <span className="bg-gradient-to-r from-blue-400 via-sky-400 to-rose-400 bg-clip-text text-transparent">
              Facebook Story
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed">
            Hệ thống máy chủ Next.js thuần Tailwind CSS kết hợp cơ sở dữ liệu SQLite cục bộ. 
            Thu thập người xem, profile Facebook cá nhân, thả tym (Love), lượt xem và bình luận với giao diện trực quan.
          </p>
        </section>

        {/* Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1 */}
          <div className="p-5 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden group hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Story Theo Dõi</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <Layers size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              {stats ? stats.totalStories : '...'}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>Bảng `stories` SQLite</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden group hover:border-sky-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Lượt Xem (Views)</span>
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center">
                <Eye size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              {stats ? stats.totalViews.toLocaleString('vi-VN') : '...'}
            </div>
            <div className="text-xs text-slate-400">
              ~{stats && stats.totalStories > 0 ? Math.round(stats.totalViews / stats.totalStories) : 0} lượt/story
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden group hover:border-rose-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thả Tym & Cảm Xúc</span>
              <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
                <Heart size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 mb-2">
              {stats ? stats.totalReactions.toLocaleString('vi-VN') : '...'}
            </div>
            <div className="text-xs text-slate-400 truncate">
              ❤️ {stats?.reactionsBreakdown?.love || 0} &bull; 👍 {stats?.reactionsBreakdown?.like || 0} &bull; 😆 {stats?.reactionsBreakdown?.haha || 0}
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-5 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Profile Người Xem</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <User size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mb-2">
              {stats ? stats.totalUniqueProfiles : '...'}
            </div>
            <div className="text-xs text-slate-400">
              Tên, Link profile & Avatar
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-8 overflow-x-auto">
          <button 
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'stories' 
                ? 'bg-blue-500/15 border border-blue-500/40 text-blue-400 shadow-md shadow-blue-500/20' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
            }`}
            onClick={() => setActiveTab('stories')}
          >
            <Layers size={16} />
            <span>Danh Sách Story & Người Xem ({stories.length})</span>
          </button>

          <button 
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'scanner' 
                ? 'bg-blue-500/15 border border-blue-500/40 text-blue-400 shadow-md shadow-blue-500/20' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
            }`}
            onClick={() => setActiveTab('scanner')}
          >
            <Play size={16} />
            <span>Trình Quét Dữ Liệu (Scanner Engine)</span>
          </button>

          <button 
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'database' 
                ? 'bg-blue-500/15 border border-blue-500/40 text-blue-400 shadow-md shadow-blue-500/20' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
            }`}
            onClick={() => setActiveTab('database')}
          >
            <Database size={16} />
            <span>Bảng Dữ Liệu SQLite</span>
          </button>

          <button 
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'guide' 
                ? 'bg-blue-500/15 border border-blue-500/40 text-blue-400 shadow-md shadow-blue-500/20' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
            }`}
            onClick={() => setActiveTab('guide')}
          >
            <BookOpen size={16} />
            <span>Hướng Dẫn & Vận Hành</span>
          </button>
        </div>

        {/* TAB 1: STORIES & VIEWERS */}
        {activeTab === 'stories' && (
          <section className="mb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Các Facebook Stories Đã Thu Thập</span>
              </h2>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search size={15} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Tìm theo URL, tiêu đề, tác giả..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition-all"
                  />
                </div>

                <button 
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                  onClick={loadData}
                  title="Tải lại"
                >
                  <RefreshCw size={15} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-white/10">
                <RefreshCw size={28} className="animate-spin mx-auto mb-3 text-sky-400" />
                <div className="text-sm">Đang tải danh sách Story từ SQLite...</div>
              </div>
            ) : filteredStories.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-white/10">
                <p className="text-slate-400 text-sm mb-4">Chưa có story nào phù hợp với tìm kiếm.</p>
                <button 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-all cursor-pointer"
                  onClick={() => setActiveTab('scanner')}
                >
                  <Play size={14} /> Quét Story Mới
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredStories.map((story) => (
                  <div 
                    key={story.id} 
                    className="p-6 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 hover:border-sky-400/30 hover:shadow-xl hover:shadow-sky-500/5 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <img 
                          src={`https://api.dicebear.com/7.x/identicon/svg?seed=${story.author_id}`}
                          alt={story.author_name}
                          className="w-11 h-11 rounded-full object-cover border-2 border-blue-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-white">{story.author_name}</h4>
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold">
                              {story.privacy || 'Công khai (Public)'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            ID: {story.author_id} &bull; {new Date(story.created_at).toLocaleDateString('vi-VN')} {new Date(story.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-100 mb-3 line-clamp-2">
                        {story.title}
                      </h3>

                      {/* URL Box */}
                      <div className="flex items-center justify-between gap-2 p-3 bg-black/40 border border-white/5 rounded-xl font-mono text-xs text-sky-400 mb-4">
                        <span className="truncate">{story.story_url}</span>
                        <a 
                          href={story.story_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-sky-400 hover:text-sky-300 flex-shrink-0"
                          title="Mở story gốc trên Facebook"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>

                      {/* Reactions Pill Bar */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-semibold text-blue-400">
                          <Eye size={12} />
                          <span>{story.total_views} lượt xem</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-xs font-semibold text-rose-400">
                          <Heart size={12} fill="#ff2e63" />
                          <span>{story.total_reactions} thả tym</span>
                        </span>
                        {story.total_replies > 0 && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-semibold text-amber-400">
                            <MessageCircle size={12} />
                            <span>{story.total_replies} bình luận</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-2">
                      <button 
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                        onClick={() => viewStoryDetail(story.id)}
                      >
                        <User size={13} />
                        <span>Xem Người Xem & Thả Tym</span>
                      </button>

                      <button 
                        className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                        onClick={() => deleteStory(story.id)}
                        title="Xóa story này"
                      >
                        <Trash2 size={13} />
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
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-xl mb-12">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Play size={18} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Trình Quét & Thu Thập Dữ Liệu Facebook Story</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Cài đặt tên mục tiêu cần quét, chế độ quyền riêng tư và đường link Facebook Story.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Tên người cần quét (Target Name / Chủ Story):</label>
                <input 
                  type="text" 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 font-semibold"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  placeholder="Ví dụ: Trần Văn An"
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  Định danh chủ tài khoản Story cần trích xuất
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Quyền riêng tư (Privacy):</label>
                <select 
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400 cursor-pointer"
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value)}
                >
                  <option value="Công khai (Public)">🌐 Công khai (Public)</option>
                  <option value="Bạn bè (Friends)">👥 Bạn bè (Friends)</option>
                  <option value="Chỉ mình tôi (Only me)">🔒 Chỉ mình tôi (Only me)</option>
                </select>
                <div className="text-[11px] text-slate-500 mt-1">
                  Chế độ hiển thị của Story trên Facebook
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-300 mb-2">Đường dẫn Facebook Story (URL cần cào):</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-sky-400"
                  value={scanUrl}
                  onChange={(e) => setScanUrl(e.target.value)}
                  placeholder="https://www.facebook.com/stories/..."
                />
                <button 
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                  onClick={handleStartScan}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Đang Cào Dữ Liệu...</span>
                    </>
                  ) : (
                    <>
                      <Play size={15} />
                      <span>Quét Story Ngay</span>
                    </>
                  )}
                </button>
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5 font-mono">
                URL mẫu: <code>https://www.facebook.com/stories/120880389116714/UzpfSVNDOjIwNjc5NzMzOTcxNjY0MTU=/?bucket_count=9&source=story_tray</code>
              </div>
            </div>

            {/* Terminal Logs */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <Terminal size={14} className="text-sky-400" />
                  <span>Nhật ký tiến trình thời gian thực (Real-time Scanner Log):</span>
                </div>
                {scanLogs.length > 0 && (
                  <button 
                    className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-white/5 border border-white/10 transition-colors"
                    onClick={() => setScanLogs([])}
                  >
                    Xóa Log
                  </button>
                )}
              </div>

              <div className="bg-[#05070d] border border-white/10 rounded-xl p-4 font-mono text-xs text-sky-400 min-h-36 max-h-60 overflow-y-auto">
                {scanLogs.length === 0 ? (
                  <div className="text-slate-600 italic">
                    Nhấn "Quét Story Ngay" để kích hoạt tiến trình cào dữ liệu cho {targetName}...
                  </div>
                ) : (
                  scanLogs.map((log, idx) => (
                    <div 
                      key={idx} 
                      className={`mb-1 ${
                        log.includes('[ERROR]') || log.includes('[FATAL]') ? 'text-rose-400' :
                        log.includes('[SUCCESS]') || log.includes('[DONE]') ? 'text-emerald-400' :
                        log.includes('[SQLITE]') ? 'text-amber-400' : 'text-sky-300'
                      }`}
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* STRUCTURED RESULT VIEW (THEO ĐÚNG YÊU CẦU CỦA USER) */}
            {scanResult && (
              <div className="mt-6 p-6 rounded-2xl bg-slate-900/90 border border-sky-400/30 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={20} className="text-emerald-400" />
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Kết Quả Quét Story của: <span className="text-sky-400">{scanResult.author_name}</span>
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400">
                      Quyền riêng tư: {scanResult.privacy}
                    </span>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      {scanResult.total_views} Lượt xem
                    </span>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
                      {scanResult.total_reactions} Thả cảm xúc
                    </span>
                  </div>
                </div>

                {/* Table of Viewers with direct Facebook links */}
                <h4 className="text-xs sm:text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <User size={15} className="text-sky-400" />
                  <span>Danh sách người xem & Link Facebook cá nhân ({scanResult.viewers?.length || 0} người):</span>
                </h4>

                <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-white/5 text-slate-400 border-b border-white/10">
                        <th className="p-3">Tên người xem</th>
                        <th className="p-3">Hành động / Cảm xúc</th>
                        <th className="p-3">Link Facebook Cá Nhân</th>
                        <th className="p-3">Bình luận đi kèm</th>
                        <th className="p-3">Thời gian xem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {scanResult.viewers && scanResult.viewers.map((viewer: any, idx: number) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <img 
                                src={viewer.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${viewer.name}`} 
                                alt="" 
                                className="w-7 h-7 rounded-full object-cover"
                              />
                              <span className="font-semibold text-slate-100">{viewer.name}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              viewer.interactionType === 'love' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                              viewer.interactionType === 'like' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              viewer.interactionType === 'haha' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                            }`}>
                              {viewer.interactionType === 'love' ? '❤️ Thả tym' : 
                               viewer.interactionType === 'like' ? '👍 Thích' : 
                               viewer.interactionType === 'haha' ? '😆 Haha' : 
                               viewer.interactionType === 'view' ? '👁️ Xem' : viewer.interactionType}
                            </span>
                          </td>
                          <td className="p-3">
                            <a 
                              href={viewer.profileUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="inline-flex items-center gap-1.5 font-mono text-[11px] text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-md hover:bg-sky-500/20 transition-colors"
                            >
                              <span>{viewer.profileUrl}</span>
                              <ExternalLink size={11} />
                            </a>
                          </td>
                          <td className="p-3 text-slate-300">
                            {viewer.comment ? (
                              <span className="text-slate-200">{viewer.comment}</span>
                            ) : (
                              <span className="text-slate-600 italic">-</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-400 whitespace-nowrap text-[11px]">
                            {new Date(viewer.viewedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} &bull; {new Date(viewer.viewedAt).toLocaleDateString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex gap-3">
                  <button 
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-all cursor-pointer"
                    onClick={() => {
                      setActiveTab('stories');
                      viewStoryDetail(scanResult.storyId);
                    }}
                  >
                    <Eye size={13} /> Mở Trong Quản Lý Stories
                  </button>
                  <a 
                    href="/api/export?format=csv"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <Download size={13} /> Xuất File CSV
                  </a>
                </div>
              </div>
            )}
          </section>
        )}

        {/* TAB 3: DATABASE EXPLORER */}
        {activeTab === 'database' && (
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-xl mb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-sky-400 flex items-center justify-center text-white">
                  <Database size={18} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">SQLite Database Explorer</h2>
                  <div className="text-xs text-slate-400">
                    Tệp dữ liệu: <code className="text-sky-400">data/facebook_insights.db</code> (node:sqlite)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    dbTab === 'interactions' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                  onClick={() => setDbTab('interactions')}
                >
                  Bảng `interactions` (Người xem & Tym)
                </button>
                <button 
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    dbTab === 'stories' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                  onClick={() => setDbTab('stories')}
                >
                  Bảng `stories` ({stories.length})
                </button>
                <a 
                  href="/api/export?format=json" 
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all cursor-pointer"
                >
                  <Code2 size={13} /> JSON
                </a>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
              {dbTab === 'interactions' ? (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-white/5 text-slate-400 border-b border-white/10">
                      <th className="p-3">#</th>
                      <th className="p-3">Tài khoản người xem</th>
                      <th className="p-3">Hành động</th>
                      <th className="p-3">Link Facebook Cá Nhân</th>
                      <th className="p-3">Bình luận</th>
                      <th className="p-3">Thời gian ghi nhận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {allInteractions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          Đang tải dữ liệu từ bảng SQLite...
                        </td>
                      </tr>
                    ) : (
                      allInteractions.map((item, index) => (
                        <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3 text-slate-500">{item.id || index + 1}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <img 
                                src={item.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${item.user_name}`} 
                                alt="" 
                                className="w-7 h-7 rounded-full object-cover"
                              />
                              <span className="font-semibold text-slate-100">{item.user_name}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              item.interaction_type === 'love' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                              item.interaction_type === 'like' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {item.interaction_type.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3">
                            <a 
                              href={item.user_profile_url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-sky-400 hover:text-sky-300 font-mono text-[11px] inline-flex items-center gap-1"
                            >
                              <span>{item.user_profile_url}</span>
                              <ExternalLink size={11} />
                            </a>
                          </td>
                          <td className="p-3 text-slate-300">
                            {item.comment_text || <span className="text-slate-600 italic">(Chỉ xem / thả tym)</span>}
                          </td>
                          <td className="p-3 text-slate-400 text-[11px]">
                            {new Date(item.created_at).toLocaleString('vi-VN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-white/5 text-slate-400 border-b border-white/10">
                      <th className="p-3">ID Story</th>
                      <th className="p-3">Tác giả</th>
                      <th className="p-3">Quyền riêng tư</th>
                      <th className="p-3">Lượt xem</th>
                      <th className="p-3">Thả cảm xúc</th>
                      <th className="p-3">Story URL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stories.map((s) => (
                      <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 font-mono text-sky-400">{s.id}</td>
                        <td className="p-3 font-semibold text-slate-100">{s.author_name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 text-[11px]">
                            {s.privacy || 'Công khai'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-200">{s.total_views}</td>
                        <td className="p-3 text-rose-400 font-semibold">{s.total_reactions}</td>
                        <td className="p-3 max-w-xs truncate text-slate-400 font-mono text-[11px]">
                          {s.story_url}
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
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-xl mb-12">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white">
                <BookOpen size={18} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Hướng Dẫn Vận Hành & Chạy Source Code Fullstack</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Mã nguồn sử dụng Next.js App Router + Pure Tailwind CSS v4 + SQLite Engine.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-black/40 border border-white/10">
                <div className="flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <div>
                    <h4 className="font-bold text-sm text-white mb-1">Khởi chạy dự án</h4>
                    <p className="text-xs text-slate-400 mb-2">Chạy lệnh sau tại thư mục gốc của dự án:</p>
                    <pre className="p-3 rounded-lg bg-black text-sky-400 font-mono text-xs">npm run dev</pre>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-black/40 border border-white/10">
                <div className="flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <div>
                    <h4 className="font-bold text-sm text-white mb-1">Cơ sở dữ liệu SQLite cục bộ (Zero Config)</h4>
                    <p className="text-xs text-slate-400 mb-2">
                      Dữ liệu lưu trữ vĩnh viễn trong tệp cục bộ mà không cần cài đặt thêm MySQL hay Docker:
                    </p>
                    <pre className="p-3 rounded-lg bg-black text-emerald-400 font-mono text-xs">data/facebook_insights.db</pre>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-black/40 border border-white/10">
                <div className="flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <div>
                    <h4 className="font-bold text-sm text-white mb-1">Các API Endpoint sẵn sàng</h4>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-5">
                      <li><code>POST /api/scan</code>: Tiếp nhận và quét Story theo tên người cần quét.</li>
                      <li><code>GET /api/stories</code>: Lấy danh sách toàn bộ Stories và số liệu.</li>
                      <li><code>GET /api/export?format=csv</code>: Tải danh sách người xem về máy dưới dạng Excel/CSV.</li>
                      <li><code>POST /api/db/seed</code>: Khởi tạo lại dữ liệu mẫu vào SQLite.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* DETAIL MODAL (Khi click Xem Người Xem & Thả Tym) */}
        {selectedStory && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedStory(null)}>
            <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <Heart size={18} className="text-rose-500" fill="#ff2e63" />
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Chi Tiết Người Xem: {selectedStory.title}
                  </h3>
                </div>
                <button 
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => setSelectedStory(null)}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Story Summary */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="text-[11px] text-slate-400">Đường dẫn Story gốc:</div>
                  <a 
                    href={selectedStory.story_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-xs text-sky-400 hover:text-sky-300 font-mono inline-flex items-center gap-1 truncate max-w-md"
                  >
                    <span className="truncate">{selectedStory.story_url}</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                    {selectedStory.total_views} Lượt xem
                  </span>
                  <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                    {selectedStory.total_reactions} Thả cảm xúc
                  </span>
                </div>
              </div>

              {/* Viewers Table */}
              <h4 className="text-xs sm:text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                <User size={14} className="text-sky-400" />
                <span>Chi tiết tài khoản người xem ({selectedStory.interactions?.length || 0} tài khoản):</span>
              </h4>

              {detailLoading ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Đang tải danh sách người xem...
                </div>
              ) : !selectedStory.interactions || selectedStory.interactions.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  Chưa có tương tác nào được ghi nhận cho story này.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-white/5 text-slate-400 border-b border-white/10">
                        <th className="p-3">Tên người dùng</th>
                        <th className="p-3">Hành động</th>
                        <th className="p-3">Link Facebook</th>
                        <th className="p-3">Bình luận</th>
                        <th className="p-3">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {selectedStory.interactions.map((viewer) => (
                        <tr key={viewer.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <img 
                                src={viewer.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${viewer.user_name}`} 
                                alt="" 
                                className="w-7 h-7 rounded-full object-cover"
                              />
                              <span className="font-semibold text-slate-100">{viewer.user_name}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              viewer.interaction_type === 'love' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                              viewer.interaction_type === 'like' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              viewer.interaction_type === 'haha' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                            }`}>
                              {viewer.interaction_type === 'love' ? '❤️ Thả tym' : 
                               viewer.interaction_type === 'like' ? '👍 Thích' : 
                               viewer.interaction_type === 'haha' ? '😆 Haha' : 
                               viewer.interaction_type === 'view' ? '👁️ Xem' : viewer.interaction_type}
                            </span>
                          </td>
                          <td className="p-3">
                            <a 
                              href={viewer.user_profile_url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-sky-400 hover:text-sky-300 font-mono text-[11px] inline-flex items-center gap-1"
                            >
                              <span>Xem Profile</span>
                              <ExternalLink size={11} />
                            </a>
                          </td>
                          <td className="p-3 text-slate-300">
                            {viewer.comment_text || <span className="text-slate-600 italic">-</span>}
                          </td>
                          <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap">
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
        )}

      </div>
    </div>
  );
}
