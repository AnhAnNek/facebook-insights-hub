import { NextResponse } from 'next/server';
import { getAllStories, saveStory, deleteStory } from '@/lib/storage';
import { CollectPayload } from '@/lib/types';

// GET /api/collect - Lấy toàn bộ danh sách stories và thống kê tổng quan
export async function GET() {
  try {
    const stories = getAllStories();
    
    // Tính toán số liệu tổng hợp
    const totalStories = stories.length;
    const totalReach = stories.reduce((sum, s) => sum + (s.reachCount || 0), 0);
    const totalImpressions = stories.reduce((sum, s) => sum + (s.impressionsCount || 0), 0);
    const totalReactions = stories.reduce((sum, s) => {
      const r = s.reactions;
      return sum + (r.like + r.love + r.care + r.haha + r.wow + r.sad + r.angry);
    }, 0);
    const totalLoves = stories.reduce((sum, s) => sum + (s.reactions.love || 0), 0);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalStories,
        totalReach,
        totalImpressions,
        totalReactions,
        totalLoves,
        avgEngagementRate: totalReach > 0 ? ((totalReactions / totalReach) * 100).toFixed(2) + '%' : '0%'
      },
      data: stories
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/collect - Endpoint tiếp nhận dữ liệu cào/quét hoặc webhook đẩy về Server
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Kiểm tra tính hợp lệ cơ bản
    if (!body || !body.storyUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Thiếu trường dữ liệu bắt buộc: storyUrl'
        },
        { status: 400 }
      );
    }

    const payload: CollectPayload = {
      storyUrl: body.storyUrl,
      pageOrUserId: body.pageOrUserId,
      authorName: body.authorName,
      authorProfileUrl: body.authorProfileUrl,
      authorAvatar: body.authorAvatar,
      reachCount: typeof body.reachCount === 'number' ? body.reachCount : undefined,
      impressionsCount: typeof body.impressionsCount === 'number' ? body.impressionsCount : undefined,
      reactions: body.reactions || {},
      viewers: Array.isArray(body.viewers) ? body.viewers : [],
      notes: body.notes,
      source: body.source || 'api_collector'
    };

    const saved = saveStory(payload);

    return NextResponse.json(
      {
        success: true,
        message: 'Dữ liệu đã được tiếp nhận và lưu trữ thành công trên Next.js Server',
        item: saved
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE /api/collect?id=... - Xóa một bản ghi story
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu tham số id' }, { status: 400 });
    }

    const ok = deleteStory(id);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy story để xóa' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Đã xóa bản ghi thành công' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
