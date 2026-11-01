import { NextResponse } from 'next/server';
import { getStoryById, getDatabase } from '@/lib/db';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const story = getStoryById(id);

    if (!story) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy story với ID: ' + id },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: story
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi tải chi tiết story' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const db = getDatabase();
    
    // Delete interactions first, then story
    db.prepare('DELETE FROM interactions WHERE story_id = ?').run(id);
    const result = db.prepare('DELETE FROM stories WHERE id = ?').run(id);

    return NextResponse.json({
      success: true,
      message: 'Đã xóa Story khỏi SQLite',
      changes: result.changes
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi xóa story' },
      { status: 500 }
    );
  }
}
