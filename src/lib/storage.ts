import fs from 'fs';
import path from 'path';
import { FacebookStoryItem, CollectPayload } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'stories.json');

// Dữ liệu mẫu khởi tạo ban đầu, bao gồm link từ người dùng cung cấp
const INITIAL_STORIES: FacebookStoryItem[] = [
  {
    id: 'story-120880389116714-2067973397166415',
    storyUrl: 'https://www.facebook.com/stories/120880389116714/UzpfSVNDOjIwNjc5NzMzOTcxNjY0MTU=/?bucket_count=9&source=story_tray',
    pageOrUserId: '120880389116714',
    authorName: 'Easy English Learning Community',
    authorProfileUrl: 'https://www.facebook.com/120880389116714',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    publishedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    collectedAt: new Date().toISOString(),
    status: 'active',
    reachCount: 1420,
    impressionsCount: 1890,
    reactions: {
      like: 124,
      love: 382,   // Thả tym
      care: 45,
      haha: 18,
      wow: 62,
      sad: 2,
      angry: 1
    },
    viewers: [
      {
        id: 'user_101',
        name: 'Minh Hoàng',
        profileUrl: 'https://facebook.com/user_101',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        viewedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        reaction: 'love'
      },
      {
        id: 'user_102',
        name: 'Thu Trang',
        profileUrl: 'https://facebook.com/user_102',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        viewedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
        reaction: 'love'
      },
      {
        id: 'user_103',
        name: 'Tuấn Anh',
        profileUrl: 'https://facebook.com/user_103',
        avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
        viewedAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
        reaction: 'like'
      },
      {
        id: 'user_104',
        name: 'Phương Thảo',
        profileUrl: 'https://facebook.com/user_104',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
        viewedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
        reaction: 'wow'
      },
      {
        id: 'user_105',
        name: 'Đức Huy',
        profileUrl: 'https://facebook.com/user_105',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        viewedAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
        reaction: 'care'
      }
    ],
    notes: 'Story hướng dẫn từ vựng tiếng Anh giao tiếp mỗi ngày.',
    source: 'api_collector'
  },
  {
    id: 'story-demo-page-2',
    storyUrl: 'https://www.facebook.com/stories/120880389116714/mini_game_event_2026',
    pageOrUserId: '120880389116714',
    authorName: 'Easy English Learning Community',
    authorProfileUrl: 'https://www.facebook.com/120880389116714',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    publishedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    collectedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    status: 'active',
    reachCount: 2850,
    impressionsCount: 3620,
    reactions: {
      like: 310,
      love: 890,
      care: 120,
      haha: 64,
      wow: 140,
      sad: 4,
      angry: 0
    },
    viewers: [
      {
        id: 'user_201',
        name: 'Hải Đăng',
        profileUrl: 'https://facebook.com/user_201',
        viewedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        reaction: 'love'
      },
      {
        id: 'user_202',
        name: 'Ngọc Lan',
        profileUrl: 'https://facebook.com/user_202',
        viewedAt: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
        reaction: 'haha'
      }
    ],
    notes: 'Mini-game thử thách phát âm chuẩn bản xứ.',
    source: 'meta_webhook'
  }
];

function ensureStorage(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_STORIES, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Lỗi khi khởi tạo thư mục lưu trữ:', err);
  }
}

export function getAllStories(): FacebookStoryItem[] {
  ensureStorage();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as FacebookStoryItem[];
  } catch (err) {
    console.error('Lỗi khi đọc file stories.json:', err);
    return INITIAL_STORIES;
  }
}

export function getStoryById(id: string): FacebookStoryItem | undefined {
  const stories = getAllStories();
  return stories.find((s) => s.id === id);
}

export function saveStory(payload: CollectPayload): FacebookStoryItem {
  ensureStorage();
  const stories = getAllStories();

  // Tạo hoặc tìm ID từ URL
  let generatedId = `story-${Date.now()}`;
  if (payload.storyUrl.includes('/stories/')) {
    const parts = payload.storyUrl.split('/stories/')[1]?.split('/')[0];
    if (parts) generatedId = `story-${parts}-${Date.now()}`;
  }

  // Kiểm tra xem đã có story với URL này chưa
  const existingIndex = stories.findIndex((s) => s.storyUrl === payload.storyUrl);

  const defaultReactions = {
    like: 0,
    love: 0,
    care: 0,
    haha: 0,
    wow: 0,
    sad: 0,
    angry: 0,
    ...payload.reactions
  };

  const newItem: FacebookStoryItem = {
    id: existingIndex >= 0 ? stories[existingIndex].id : generatedId,
    storyUrl: payload.storyUrl,
    pageOrUserId: payload.pageOrUserId || 'unknown_page',
    authorName: payload.authorName || 'Facebook Creator',
    authorProfileUrl: payload.authorProfileUrl || 'https://facebook.com',
    authorAvatar: payload.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    publishedAt: existingIndex >= 0 ? stories[existingIndex].publishedAt : new Date().toISOString(),
    collectedAt: new Date().toISOString(),
    status: 'active',
    reachCount: payload.reachCount ?? (existingIndex >= 0 ? stories[existingIndex].reachCount : 1),
    impressionsCount: payload.impressionsCount ?? (existingIndex >= 0 ? stories[existingIndex].impressionsCount : 1),
    reactions: defaultReactions,
    viewers: payload.viewers && payload.viewers.length > 0
      ? payload.viewers
      : (existingIndex >= 0 ? stories[existingIndex].viewers : []),
    notes: payload.notes || 'Dữ liệu được tiếp nhận qua API endpoint /api/collect',
    source: payload.source || 'api_collector'
  };

  if (existingIndex >= 0) {
    stories[existingIndex] = newItem;
  } else {
    stories.unshift(newItem);
  }

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(stories, null, 2), 'utf-8');
  } catch (err) {
    console.error('Lỗi khi ghi file stories.json:', err);
  }

  return newItem;
}

export function deleteStory(id: string): boolean {
  ensureStorage();
  const stories = getAllStories();
  const filtered = stories.filter((s) => s.id !== id);
  if (filtered.length !== stories.length) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  }
  return false;
}
