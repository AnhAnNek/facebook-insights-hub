import { NextResponse } from 'next/server';
import { getAllStories, getStats, insertStoryWithInteractions } from '@/lib/db';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function GET() {
  try {
    const stories = getAllStories();
    const stats = getStats();
    return NextResponse.json(
      {
        success: true,
        data: {
          stories,
          stats
        }
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi tải dữ liệu stories' },
      { status: 500, headers: corsHeaders }
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
        { status: 400, headers: corsHeaders }
      );
    }

    const storyId = insertStoryWithInteractions(
      {
        id: story.id || story.story_id,
        story_url: story.story_url,
        title: story.title || `Story Facebook (${new Date().toLocaleDateString('vi-VN')})`,
        author_name: story.author_name || 'Trần Văn An',
        author_id: story.author_id || 'owner_story',
        page_url: story.page_url,
        media_url: story.media_url,
        privacy: story.privacy || 'Công khai (Public)',
        status: story.status || (story.story_url.includes('archive') ? 'archived' : 'active'),
        total_views: story.total_views || (interactions ? interactions.length : 0),
        total_reactions: story.total_reactions || (interactions ? interactions.filter((i: any) => i.interaction_type !== 'view').length : 0)
      },
      interactions || []
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Đã lưu Story và tương tác vào SQLite từ Extension',
        storyId
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi lưu story' },
      { status: 500, headers: corsHeaders }
    );
  }
}
