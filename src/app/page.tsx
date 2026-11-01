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
  CheckCircle2, 
  User, 
  Layers, 
  Code2, 
  Sparkles, 
  Trash2, 
  Terminal, 
  Activity, 
  Puzzle, 
  Radio, 
  ArrowUpRight, 
  X,
  FileSpreadsheet
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
  const [activeTab, setActiveTab] = useState<'stories' | 'extension' | 'database'>('stories');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [storyFilter, setStoryFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [toast, setToast] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Vừa mới kết nối');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Show toast notification
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch stories & stats from SQLite
  const loadData = async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch('/api/stories');
      const data = await res.json();
      if (data.success) {
        setStories(data.data.stories || []);
        setStats(data.data.stats || null);
        setLastSyncTime(new Date().toLocaleTimeString('vi-VN'));
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu:', err);
      if (!silent) showToast('Không thể kết nối tới server SQLite');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Auto polling to receive data automatically when Extension sends it!
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (autoRefresh) {
        loadData(true);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Fetch story details with interactions
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

  // Reseed / Reset DB
  const handleReseed = async () => {
    if (!confirm('Làm mới lại dữ liệu SQLite?')) return;
    try {
      const res = await fetch('/api/db/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Đã làm mới dữ liệu SQLite!');
        loadData();
      }
    } catch (err) {
      showToast('Lỗi khi reseed database');
    }
  };

  // Filter stories
  const filteredStories = stories.filter(s => {
    const matchesSearch = 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.story_url.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isArchived = s.status === 'archived' || s.story_url.includes('archive');
    if (storyFilter === 'active') return matchesSearch && !isArchived;
    if (storyFilter === 'archived') return matchesSearch && isArchived;
    return matchesSearch;
  });

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
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Puzzle size={22} className="text-white" />
              </div>
              <div>
                <div className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Facebook Insights Hub
                </div>
                <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
                  <span>Receiver cho Chrome Extension</span>
                  <span>&bull;</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Cổng tiếp nhận: POST /api/stories
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button 
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  autoRefresh 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
                onClick={() => setAutoRefresh(!autoRefresh)}
                title="Tự động lắng nghe và nạp dữ liệu ngay khi Extension gửi về"
              >
                <Radio size={13} className={autoRefresh ? 'animate-pulse text-emerald-400' : ''} />
                <span>Auto-Sync: {autoRefresh ? 'Bật (Mỗi 4s)' : 'Tắt'}</span>
              </button>

              <button 
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                onClick={() => loadData()}
                title="Làm mới thủ công"
              >
                <RefreshCw size={13} />
                <span>Làm Mới</span>
              </button>

              <a 
                href="/api/export?format=csv" 
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                download
                title="Tải toàn bộ người xem về dạng file CSV/Excel"
              >
                <Download size={13} />
                <span>Xuất CSV</span>
              </a>

              <button 
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all cursor-pointer"
                onClick={() => setActiveTab('extension')}
              >
                <Puzzle size={14} />
                <span>Hướng Dẫn Extension</span>
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold mb-3">
            <Radio size={13} className="text-emerald-400 animate-pulse" />
            <span>Chế độ: Đang chờ & Nhận dữ liệu từ Chrome Extension</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Trung Tâm Phân Tích Dữ Liệu{' '}
            <span className="bg-gradient-to-r from-blue-400 via-sky-400 to-rose-400 bg-clip-text text-transparent">
              Facebook Story
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed">
            Hệ thống web này đóng vai trò <strong>Máy chủ Lưu trữ (SQLite) & Bảng Điều Khiển</strong> chỉ tiếp nhận dữ liệu thực tế được quét và đồng bộ từ tiện ích <strong>Chrome Extension</strong> khi bạn mở xem Story trên Facebook.
          </p>
        </section>

        {/* Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1 */}
          <div className="p-5 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden group hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Story Đã Thu Thập</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <Layers size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              {stats ? stats.totalStories : '...'}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>Lưu vĩnh viễn trong SQLite</span>
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
              Cập nhật lúc: {lastSyncTime}
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
              Có Tên & Link Facebook cá nhân
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
            <span>Danh Sách Story Từ Extension ({stories.length})</span>
          </button>

          <button 
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'extension' 
                ? 'bg-blue-500/15 border border-blue-500/40 text-blue-400 shadow-md shadow-blue-500/20' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
            }`}
            onClick={() => setActiveTab('extension')}
          >
            <Puzzle size={16} />
            <span>Cài Đặt Extension & Kết Nối</span>
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
            <span>Bảng Dữ Liệu SQLite (Explorer)</span>
          </button>
        </div>

        {/* TAB 1: STORIES & VIEWERS RECEIVED FROM EXTENSION */}
        {activeTab === 'stories' && (
          <section className="mb-12">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Dữ Liệu Story Nhận Từ Chrome Extension</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Mỗi khi bạn bấm "Lưu Vào Server SQLite" trên tiện ích Chrome, dữ liệu sẽ ngay lập tức xuất hiện ở đây.
              </p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setStoryFilter('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    storyFilter === 'all'
                      ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  Tất Cả ({stories.length})
                </button>
                <button
                  onClick={() => setStoryFilter('active')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    storyFilter === 'active'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>⚡ Tin Đang Chạy (&lt;24h)</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20">
                    {stories.filter(s => s.status !== 'archived' && !s.story_url.includes('archive')).length}
                  </span>
                </button>
                <button
                  onClick={() => setStoryFilter('archived')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    storyFilter === 'archived'
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>📂 Kho Lưu Trữ (&gt;24h)</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20">
                    {stories.filter(s => s.status === 'archived' || s.story_url.includes('archive')).length}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1 sm:w-72">
                  <Search size={15} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Tìm theo tác giả, URL, tiêu đề..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition-all"
                  />
                </div>

                <button 
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                  onClick={() => loadData()}
                  title="Làm mới"
                >
                  <RefreshCw size={15} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-white/10">
                <RefreshCw size={28} className="animate-spin mx-auto mb-3 text-sky-400" />
                <div className="text-sm">Đang đọc dữ liệu từ SQLite...</div>
              </div>
            ) : filteredStories.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-white/10">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-4">
                  <Puzzle size={24} />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Chưa có Story nào trong mục này</h3>
                <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto mb-5">
                  Hãy mở Facebook trên Chrome, xem Story hoặc mở Kho lưu trữ tin, mở danh sách người xem và bấm nút <strong>Quét</strong> trên Extension!
                </p>
                <button 
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all cursor-pointer"
                  onClick={() => setActiveTab('extension')}
                >
                  <Puzzle size={14} /> Xem Hướng Dẫn Cài Extension
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredStories.map((story) => {
                  const isArchived = story.status === 'archived' || story.story_url.includes('archive');
                  return (
                    <div 
                      key={story.id} 
                      className="p-6 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 hover:border-sky-400/30 hover:shadow-xl hover:shadow-sky-500/5 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <img 
                            src={`https://api.dicebear.com/7.x/identicon/svg?seed=${story.author_name || story.author_id}`}
                            alt={story.author_name}
                            className="w-11 h-11 rounded-full object-cover border-2 border-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-white">{story.author_name}</h4>
                              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold">
                                {story.privacy || 'Công khai (Public)'}
                              </span>
                              {isArchived ? (
                                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold flex items-center gap-1">
                                  📂 Kho lưu trữ (&gt;24h)
                                </span>
                              ) : (
                                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                                  ⚡ Đang chạy (&lt;24h)
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              Lưu lúc: {new Date(story.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} &bull; {new Date(story.created_at).toLocaleDateString('vi-VN')}
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
                          <span>{story.total_reactions} thả cảm xúc / tym</span>
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
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                        onClick={() => viewStoryDetail(story.id)}
                      >
                        <User size={13} />
                        <span>Xem Chi Tiết Người Xem & Link FB</span>
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
                );
              })}
            </div>
            )}
          </section>
        )}

        {/* TAB 2: EXTENSION SETUP & RECEIVER STATUS */}
        {activeTab === 'extension' && (
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-xl mb-12">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Puzzle size={20} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Kết Nối Chrome Extension với Server Next.js</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Dữ liệu người xem Story thật sẽ được cào từ Extension và lưu thẳng vào SQLite.
                </p>
              </div>
            </div>

            {/* Connection Status Box */}
            <div className="p-5 rounded-xl bg-black/40 border border-emerald-500/30 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-sm font-bold text-white">Cổng tiếp nhận API (Receiver Endpoint) sẵn sàng:</span>
                </div>
                <code className="text-xs text-sky-400 font-mono bg-sky-950/60 px-3 py-1 rounded-md border border-sky-500/30">
                  POST http://localhost:3000/api/stories
                </code>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  CORS Enabled &bull; Hỗ trợ Extension Chrome
                </span>
              </div>
            </div>

            {/* Hướng Dẫn Quét Story Ngoài 24h (Kho Lưu Trữ Tin - Archive) */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900/70 border border-amber-500/40 shadow-xl mb-6">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg border border-amber-500/30">
                    📂
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Cách Quét Story Bên Ngoài 24 Giờ (Kho Lưu Trữ Tin / Story Archive)</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                        Trường hợp &gt; 24h
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Story sau 24h không bị mất! Facebook tự động lưu vào <strong>Kho lưu trữ tin (Archive)</strong> và giữ nguyên danh sách người xem.
                    </p>
                  </div>
                </div>

                <a 
                  href="https://www.facebook.com/archive/stories/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <ExternalLink size={13} />
                  <span>Mở Kho Lưu Trữ Tin Facebook</span>
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                  <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">1</span>
                    Truy cập Kho lưu trữ
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Vào trang cá nhân &rarr; Bấm <strong>"..."</strong> &rarr; Chọn <strong>Kho lưu trữ (Archive)</strong> &rarr; Chọn <strong>Kho lưu trữ tin</strong> (hoặc bấm nút màu vàng phía trên).
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                  <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">2</span>
                    Mở Story & Bấm Người xem
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Bấm vào bất kỳ Story cũ nào từ trước &rarr; Nhấn nút <strong>"Người xem"</strong> ở góc dưới để mở bảng danh sách người xem y hệt Story hiện tại.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                  <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">3</span>
                    Mở Extension & Quét
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Mở Extension &rarr; Bấm <strong>Quét Nhanh</strong> hoặc <strong>Cuộn & Quét Hết</strong> &rarr; Bấm Lưu vào SQLite. Dữ liệu sẽ được lưu vĩnh viễn trên máy của bạn!
                  </p>
                </div>
              </div>
            </div>

            {/* 3 Step Setup Guide */}
            <div className="space-y-4 mb-6">
              <div className="p-5 rounded-xl bg-black/30 border border-white/10">
                <div className="flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-white mb-1">Tải tiện ích Extension vào Chrome (10 giây)</h4>
                    <p className="text-xs text-slate-400 mb-2">
                      Mở tab mới trong Chrome gõ: <code className="text-sky-400 font-mono">chrome://extensions</code>, bật <strong>"Chế độ dành cho nhà phát triển"</strong> (Developer mode ở góc trên bên phải), bấm <strong>"Tải tiện ích đã giải nén"</strong> (Load unpacked) và chọn thư mục:
                    </p>
                    <div className="p-3 rounded-lg bg-black font-mono text-xs text-sky-400 border border-white/5 select-all">
                      d:\work-spaces\facebook-insights-hub\extension
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-black/30 border border-white/10">
                <div className="flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <div>
                    <h4 className="font-bold text-sm text-white mb-1">Mở Story của bạn trên Facebook</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Đăng nhập tài khoản Facebook trên trình duyệt và mở <strong>Story của chính bạn</strong>. Nhấn vào nút <strong>"Người xem"</strong> (ở góc dưới bên trái khung Story) để Facebook bung danh sách người xem lên màn hình.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-black/30 border border-white/10">
                <div className="flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <div>
                    <h4 className="font-bold text-sm text-white mb-1">Bấm Quét & Lưu vào SQLite</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Bấm vào biểu tượng Extension trên thanh công cụ &rarr; Bấm <strong>"Quét Dữ Liệu Story Đang Mở"</strong> &rarr; Bấm <strong>"Lưu Vào Server SQLite"</strong>. Dữ liệu sẽ tự động nhảy vào giao diện Web này trong vòng 4 giây!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                onClick={handleReseed}
              >
                <RefreshCw size={14} /> Khởi Tạo Lại SQLite Mẫu
              </button>
              <a 
                href="/api/export?format=csv"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
              >
                <FileSpreadsheet size={14} /> Xuất Dữ Liệu Ra File Excel (CSV)
              </a>
            </div>
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
                    Tệp dữ liệu cục bộ: <code className="text-sky-400 font-mono">data/facebook_insights.db</code>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a 
                  href="/api/export?format=csv" 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-all cursor-pointer"
                  download
                >
                  <Download size={13} /> Tải CSV
                </a>
                <a 
                  href="/api/export?format=json" 
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all cursor-pointer"
                >
                  <Code2 size={13} /> Xem JSON
                </a>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-white/5 text-slate-400 border-b border-white/10">
                    <th className="p-3">ID Story</th>
                    <th className="p-3">Tác giả Story</th>
                    <th className="p-3">Quyền riêng tư</th>
                    <th className="p-3">Lượt xem</th>
                    <th className="p-3">Thả cảm xúc</th>
                    <th className="p-3">Đường dẫn Story</th>
                    <th className="p-3">Hành động</th>
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
                      <td className="p-3">
                        <button 
                          className="text-xs text-sky-400 hover:underline cursor-pointer"
                          onClick={() => viewStoryDetail(s.id)}
                        >
                          Xem Người Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                    Chi Tiết Người Xem Story: {selectedStory.title}
                  </h3>
                </div>
                <button 
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => setSelectedStory(null)}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Story Summary Card */}
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
                        <th className="p-3">Thời gian xem</th>
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
                              <span>{viewer.user_profile_url}</span>
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
