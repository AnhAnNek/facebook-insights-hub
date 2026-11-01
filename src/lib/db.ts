import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'facebook_insights.db');

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    initTables(dbInstance);
  }
  return dbInstance;
}

function initTables(db: DatabaseSync) {
  // 1. Stories Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      story_url TEXT NOT NULL,
      title TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_id TEXT NOT NULL,
      page_url TEXT,
      media_type TEXT DEFAULT 'image',
      media_url TEXT,
      status TEXT DEFAULT 'active',
      privacy TEXT DEFAULT 'Công khai (Public)',
      total_views INTEGER DEFAULT 0,
      total_reactions INTEGER DEFAULT 0,
      total_replies INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  try {
    db.exec("ALTER TABLE stories ADD COLUMN privacy TEXT DEFAULT 'Công khai (Public)';");
  } catch (_e) {
    // Column already exists
  }

  // 2. Interactions Table (Viewers, Likes, Loves, Comments)
  db.exec(`
    CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      story_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_profile_url TEXT NOT NULL,
      interaction_type TEXT NOT NULL, -- 'love', 'like', 'haha', 'wow', 'view', 'reply'
      comment_text TEXT,
      avatar_url TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (story_id) REFERENCES stories (id) ON DELETE CASCADE
    );
  `);

  // 3. Scans / Ingest Logs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_url TEXT NOT NULL,
      scan_type TEXT NOT NULL,
      status TEXT NOT NULL,
      total_items_found INTEGER DEFAULT 0,
      logs TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Seed default data if stories table is empty
  const countRow = db.prepare('SELECT COUNT(*) as count FROM stories').get() as { count: number };
  if (countRow.count === 0) {
    seedInitialData(db);
  }
}

export function seedInitialData(db: DatabaseSync) {
  // Clear existing
  db.exec('DELETE FROM interactions;');
  db.exec('DELETE FROM stories;');
  db.exec('DELETE FROM scans;');

  // Story 1: User's provided Facebook story link
  const story1Id = 'story_fb_120880389116714_main';
  const targetUrl = 'https://www.facebook.com/stories/120880389116714/UzpfSVNDOjIwNjc5NzMzOTcxNjY0MTU=/?bucket_count=9&source=story_tray';

  const insertStory = db.prepare(`
    INSERT INTO stories (
      id, story_url, title, author_name, author_id, page_url, media_type, media_url,
      status, privacy, total_views, total_reactions, total_replies, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStory.run(
    story1Id,
    targetUrl,
    'Story cập nhật xu hướng công nghệ & Insight tháng 11',
    'Trần Văn An',
    '120880389116714',
    'https://www.facebook.com/120880389116714',
    'image',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    'active',
    'Công khai (Public)',
    185,
    72,
    14,
    new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    new Date().toISOString()
  );

  // Story 2: Secondary story
  const story2Id = 'story_fb_9938471283_secondary';
  insertStory.run(
    story2Id,
    'https://www.facebook.com/stories/120880389116714/UzpfSVNDOjgwODkwMjMyMzg0OTQ4MQ==/',
    'Livestream công bố tính năng mới & Hỏi đáp cộng đồng',
    'Trần Văn An',
    '120880389116714',
    'https://www.facebook.com/120880389116714',
    'video',
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80',
    'active',
    'Bạn bè (Friends)',
    312,
    142,
    28,
    new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    new Date().toISOString()
  );

  // Seed interactions (Viewers, Thả tym, Likes, Comments)
  const insertInteraction = db.prepare(`
    INSERT INTO interactions (
      story_id, user_name, user_profile_url, interaction_type, comment_text, avatar_url, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const mockInteractions = [
    {
      story_id: story1Id,
      user_name: 'Nguyễn Văn Minh',
      user_profile_url: 'https://www.facebook.com/nguyenvanminh.dev',
      interaction_type: 'love',
      comment_text: 'Ý tưởng dự án cào dữ liệu và phân tích rất hay!',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      timeOffset: 12
    },
    {
      story_id: story1Id,
      user_name: 'Trần Thị Mai Phương',
      user_profile_url: 'https://www.facebook.com/maiphuong.designer',
      interaction_type: 'love',
      comment_text: 'Thả tym cho giao diện xịn xò ❤️',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      timeOffset: 25
    },
    {
      story_id: story1Id,
      user_name: 'Lê Hoàng Nam',
      user_profile_url: 'https://www.facebook.com/nam.lehoang99',
      interaction_type: 'like',
      comment_text: null,
      avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      timeOffset: 45
    },
    {
      story_id: story1Id,
      user_name: 'Phạm Thu Hằng',
      user_profile_url: 'https://www.facebook.com/hangpham.marketing',
      interaction_type: 'love',
      comment_text: 'Hóng bản cập nhật tiếp theo nhé admin!',
      avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
      timeOffset: 60
    },
    {
      story_id: story1Id,
      user_name: 'Vũ Quốc Bảo',
      user_profile_url: 'https://www.facebook.com/bao.quoc.vu',
      interaction_type: 'haha',
      comment_text: 'Quá nhanh quá nguy hiểm 😂',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      timeOffset: 85
    },
    {
      story_id: story1Id,
      user_name: 'Đặng Thùy Dung',
      user_profile_url: 'https://www.facebook.com/thuydung.dang',
      interaction_type: 'view',
      comment_text: null,
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
      timeOffset: 110
    },
    {
      story_id: story1Id,
      user_name: 'Hoàng Anh Tuấn',
      user_profile_url: 'https://www.facebook.com/tuan.hoanganh.se',
      interaction_type: 'love',
      comment_text: 'Đang theo dõi story này liên tục 🔥',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      timeOffset: 130
    },
    {
      story_id: story1Id,
      user_name: 'Bùi Lan Anh',
      user_profile_url: 'https://www.facebook.com/lananh.media',
      interaction_type: 'wow',
      comment_text: 'Số liệu tăng vọt luôn này!',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
      timeOffset: 160
    },
    {
      story_id: story1Id,
      user_name: 'Đỗ Tiến Dũng',
      user_profile_url: 'https://www.facebook.com/dung.dotien',
      interaction_type: 'view',
      comment_text: null,
      avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80',
      timeOffset: 190
    },
    {
      story_id: story1Id,
      user_name: 'Ngô Mỹ Linh',
      user_profile_url: 'https://www.facebook.com/mylinh.ngo',
      interaction_type: 'love',
      comment_text: 'Thả tym cho page ❤️',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
      timeOffset: 220
    }
  ];

  for (const item of mockInteractions) {
    insertInteraction.run(
      item.story_id,
      item.user_name,
      item.user_profile_url,
      item.interaction_type,
      item.comment_text,
      item.avatar_url,
      new Date(Date.now() - item.timeOffset * 60 * 1000).toISOString()
    );
  }

  // Insert initial scan log
  const insertScan = db.prepare(`
    INSERT INTO scans (target_url, scan_type, status, total_items_found, logs, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertScan.run(
    targetUrl,
    'Story Auto Scan & Ingest',
    'SUCCESS',
    10,
    JSON.stringify([
      '[INIT] Đã kết nối SQLite Database: data/facebook_insights.db',
      '[SCAN] Đang phân tích Story: ' + targetUrl,
      '[EXTRACT] Nhận diện ID tác giả: 120880389116714 (Tech & Media Insights Hub)',
      '[EXTRACT] Thu thập 148 lượt xem, 64 cảm xúc (Love: 42, Like: 15, Haha: 4, Wow: 3)',
      '[INGEST] Đã lưu 10 bản ghi người xem và tương tác vào SQLite',
      '[DONE] Quá trình quét hoàn tất thành công.'
    ]),
    new Date(Date.now() - 30 * 60 * 1000).toISOString()
  );
}

// Helper query functions
export function getAllStories() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM stories ORDER BY created_at DESC').all();
}

export function getStoryById(id: string) {
  const db = getDatabase();
  const story = db.prepare('SELECT * FROM stories WHERE id = ?').get(id);
  if (!story) return null;

  const interactions = db.prepare('SELECT * FROM interactions WHERE story_id = ? ORDER BY created_at DESC').all(id);
  return {
    ...story,
    interactions
  };
}

export function getAllInteractions() {
  const db = getDatabase();
  return db.prepare('SELECT i.*, s.title as story_title FROM interactions i LEFT JOIN stories s ON i.story_id = s.id ORDER BY i.created_at DESC').all();
}

export function getScans() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM scans ORDER BY created_at DESC LIMIT 20').all();
}

export function getStats() {
  const db = getDatabase();
  const totalStories = db.prepare('SELECT COUNT(*) as count FROM stories').get() as { count: number };
  const viewsRow = db.prepare('SELECT SUM(total_views) as sum_views, SUM(total_reactions) as sum_reactions FROM stories').get() as { sum_views: number; sum_reactions: number };
  const totalViewers = db.prepare('SELECT COUNT(DISTINCT user_profile_url) as count FROM interactions').get() as { count: number };
  const totalInteractions = db.prepare('SELECT COUNT(*) as count FROM interactions').get() as { count: number };
  const loveCount = db.prepare("SELECT COUNT(*) as count FROM interactions WHERE interaction_type = 'love'").get() as { count: number };
  const likeCount = db.prepare("SELECT COUNT(*) as count FROM interactions WHERE interaction_type = 'like'").get() as { count: number };
  const hahaCount = db.prepare("SELECT COUNT(*) as count FROM interactions WHERE interaction_type = 'haha'").get() as { count: number };

  return {
    totalStories: totalStories?.count || 0,
    totalViews: viewsRow?.sum_views || 0,
    totalReactions: viewsRow?.sum_reactions || 0,
    totalUniqueProfiles: totalViewers?.count || 0,
    totalInteractions: totalInteractions?.count || 0,
    reactionsBreakdown: {
      love: loveCount?.count || 0,
      like: likeCount?.count || 0,
      haha: hahaCount?.count || 0
    }
  };
}

export function insertStoryWithInteractions(
  storyData: {
    story_url: string;
    title: string;
    author_name: string;
    author_id: string;
    page_url?: string;
    media_url?: string;
    privacy?: string;
    status?: string;
    total_views?: number;
    total_reactions?: number;
  },
  interactions: Array<{
    user_name: string;
    user_profile_url: string;
    interaction_type: string;
    comment_text?: string | null;
    avatar_url?: string;
  }>
) {
  const db = getDatabase();
  const storyId = 'story_' + Date.now();

  const insertStoryStmt = db.prepare(`
    INSERT INTO stories (
      id, story_url, title, author_name, author_id, page_url, media_type, media_url,
      status, privacy, total_views, total_reactions, total_replies, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStoryStmt.run(
    storyId,
    storyData.story_url,
    storyData.title,
    storyData.author_name,
    storyData.author_id,
    storyData.page_url || 'https://www.facebook.com/' + storyData.author_id,
    'image',
    storyData.media_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    storyData.status || (storyData.story_url.includes('archive') ? 'archived' : 'active'),
    storyData.privacy || 'Công khai (Public)',
    storyData.total_views || interactions.length,
    storyData.total_reactions || interactions.filter(i => i.interaction_type !== 'view').length,
    interactions.filter(i => !!i.comment_text).length,
    new Date().toISOString(),
    new Date().toISOString()
  );

  const insertInteractionStmt = db.prepare(`
    INSERT INTO interactions (
      story_id, user_name, user_profile_url, interaction_type, comment_text, avatar_url, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of interactions) {
    insertInteractionStmt.run(
      storyId,
      item.user_name,
      item.user_profile_url,
      item.interaction_type,
      item.comment_text || null,
      item.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      new Date().toISOString()
    );
  }

  return storyId;
}

export function logScanSession(targetUrl: string, scanType: string, status: string, totalItems: number, logs: string[]) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO scans (target_url, scan_type, status, total_items_found, logs, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(targetUrl, scanType, status, totalItems, JSON.stringify(logs), new Date().toISOString());
}
