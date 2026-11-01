import React from 'react';
import { FacebookStoryItem } from '@/lib/types';

interface StoryCardProps {
  story: FacebookStoryItem;
  onSelect: (story: FacebookStoryItem) => void;
  onDelete: (id: string) => void;
}

export default function StoryCard({ story, onSelect, onDelete }: StoryCardProps) {
  const totalReactions = Object.values(story.reactions).reduce((a, b) => a + b, 0);

  return (
    <div className="glass-panel story-card">
      <div>
        {/* Author info */}
        <div className="story-author">
          <img
            src={story.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
            alt={story.authorName}
            className="author-avatar"
          />
          <div className="author-info">
            <h4>{story.authorName}</h4>
            <div className="author-meta">
              Thu thập lúc: {new Date(story.collectedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {story.source}
            </div>
          </div>
        </div>

        {/* Story Link Box */}
        <div className="story-url-box">
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {story.storyUrl}
          </span>
          <a
            href={story.storyUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Mở link Facebook"
            style={{ color: '#60a5fa', flexShrink: 0 }}
          >
            ↗
          </a>
        </div>

        {/* Reactions Bar */}
        <div className="reactions-bar">
          <div className="reaction-pill love">
            <span>❤️</span>
            <span>{story.reactions.love.toLocaleString()}</span>
          </div>
          <div className="reaction-pill like">
            <span>👍</span>
            <span>{story.reactions.like.toLocaleString()}</span>
          </div>
          {story.reactions.care > 0 && (
            <div className="reaction-pill care">
              <span>🥰</span>
              <span>{story.reactions.care}</span>
            </div>
          )}
          {story.reactions.wow > 0 && (
            <div className="reaction-pill">
              <span>😮</span>
              <span>{story.reactions.wow}</span>
            </div>
          )}
          {story.reactions.haha > 0 && (
            <div className="reaction-pill">
              <span>😆</span>
              <span>{story.reactions.haha}</span>
            </div>
          )}
        </div>

        {/* Viewers Preview */}
        <div className="viewers-preview">
          <div className="viewers-title">
            <span>Người xem gần đây ({story.viewers.length})</span>
            <span style={{ color: '#38bdf8' }}>Reach: {story.reachCount.toLocaleString()}</span>
          </div>
          <div className="viewer-chips">
            {story.viewers.slice(0, 4).map((viewer, idx) => (
              <div key={idx} className="viewer-chip">
                <span>👤 {viewer.name || `User #${idx + 1}`}</span>
                {viewer.reaction === 'love' && <span>❤️</span>}
                {viewer.reaction === 'like' && <span>👍</span>}
              </div>
            ))}
            {story.viewers.length > 4 && (
              <div className="viewer-chip" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                +{story.viewers.length - 4} khác
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="story-card-footer">
        <button
          onClick={() => onSelect(story)}
          className="btn btn-secondary"
          style={{ fontSize: '0.82rem', padding: '6px 14px' }}
        >
          🔍 Xem chi tiết
        </button>

        <button
          onClick={() => onDelete(story.id)}
          className="btn btn-danger"
          style={{ fontSize: '0.82rem', padding: '6px 12px' }}
          title="Xóa story này"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
