import { NextResponse } from 'next/server';
import { getAllStories, getAllInteractions, getScans, getStats } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const stories = getAllStories();
    const interactions = getAllInteractions();
    const scans = getScans();
    const stats = getStats();

    if (format === 'csv') {
      // Generate CSV string for interactions (Viewers, Likes, Loves, Profiles)
      const headers = ['Story ID', 'Story Title', 'User Name', 'Profile URL', 'Interaction Type', 'Comment Text', 'Timestamp'];
      const rows = (interactions as any[]).map(item => [
        `"${item.story_id}"`,
        `"${item.story_title || ''}"`,
        `"${item.user_name}"`,
        `"${item.user_profile_url}"`,
        `"${item.interaction_type}"`,
        `"${(item.comment_text || '').replace(/"/g, '""')}"`,
        `"${item.created_at}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="facebook_story_viewers.csv"'
        }
      });
    }

    // Default JSON export
    return NextResponse.json({
      export_date: new Date().toISOString(),
      database_type: 'SQLite (node:sqlite)',
      database_file: 'data/facebook_insights.db',
      stats,
      stories,
      interactions,
      scans
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi xuất dữ liệu' },
      { status: 500 }
    );
  }
}
