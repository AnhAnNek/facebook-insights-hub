export interface FacebookReactionBreakdown {
  like: number;
  love: number;   // Thả tym
  care: number;   // Thương thương
  haha: number;   // Haha
  wow: number;    // Wow
  sad: number;    // Buồn
  angry: number;  // Phẫn nộ
}

export interface FacebookViewerInfo {
  id?: string;
  name?: string;
  profileUrl?: string;
  avatarUrl?: string;
  viewedAt: string;
  reaction?: 'like' | 'love' | 'care' | 'haha' | 'wow' | 'sad' | 'angry' | null;
}

export interface FacebookStoryItem {
  id: string;
  storyUrl: string;
  pageOrUserId: string;
  authorName: string;
  authorProfileUrl: string;
  authorAvatar?: string;
  publishedAt: string;
  collectedAt: string;
  status: 'active' | 'expired';
  reachCount: number;
  impressionsCount: number;
  reactions: FacebookReactionBreakdown;
  viewers: FacebookViewerInfo[];
  notes?: string;
  source: 'api_collector' | 'meta_webhook' | 'manual_sync';
}

export interface CollectPayload {
  storyUrl: string;
  pageOrUserId?: string;
  authorName?: string;
  authorProfileUrl?: string;
  authorAvatar?: string;
  reachCount?: number;
  impressionsCount?: number;
  reactions?: Partial<FacebookReactionBreakdown>;
  viewers?: FacebookViewerInfo[];
  notes?: string;
  source?: 'api_collector' | 'meta_webhook' | 'manual_sync';
}
