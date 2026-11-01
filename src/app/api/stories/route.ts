import { NextResponse } from 'next/server';
import { getAllStories, getStats, insertStoryWithInteractions } from '@/lib/db';

export async function GET() {
  try {
    const stories = getAllStories();
    const stats = getStats();
    return NextResponse.json({
      success: true,
      data: {
        stories,
        stats
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi tải dữ liệu stories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { story, interactions } = body;

    if (!story || !story.story_url) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin story_url' },
        { status: 400 }
      );
    }

    const storyId = insertStoryWithInteractions(
      {
        story_url: story.story_url,
        title: story.title || 'Facebook Story được cào / tiếp nhận',
        author_name: story.author_name || 'Facebook User / Page',
        author_id: story.author_id || 'unknown_author',
        page_url: story.page_url,
        media_url: story.media_url,
        total_views: story.total_views,
        total_reactions: story.total_reactions
      },
      interactions || []
    );

    return NextResponse.json({
      success: true,
      message: 'Đã lưu Story và tương tác vào SQLite',
      storyId
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi lưu story' },
      { status: 500 }
    );
  }
}
