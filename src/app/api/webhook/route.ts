import { NextResponse } from 'next/server';
import { saveStory } from '@/lib/storage';

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'meta_insights_secret_token_2026';

// GET /api/webhook - Xác thực webhook với Meta Developer Platform
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[META_WEBHOOK] Xác thực Webhook thành công!');
    return new Response(challenge, { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

// POST /api/webhook - Tiếp nhận sự kiện thời gian thực từ Meta Graph API
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[META_WEBHOOK_EVENT] Nhận payload:', JSON.stringify(body, null, 2));

    // Xử lý sự kiện nếu có
    if (body.object === 'page' && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        if (entry.changes) {
          for (const change of entry.changes) {
            // Giả lập lưu dữ liệu khi có thay đổi liên quan đến story/post
            if (change.field === 'story_insights' || change.field === 'feed') {
              const val = change.value || {};
              saveStory({
                storyUrl: val.story_url || `https://facebook.com/stories/${entry.id}/${val.id || Date.now()}`,
                pageOrUserId: entry.id,
                authorName: `Page ID: ${entry.id}`,
                reachCount: val.reach || 100,
                reactions: val.reactions || { like: 10, love: 25 },
                source: 'meta_webhook',
                notes: `Cập nhật tự động từ Meta Webhook: ${change.field}`
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ status: 'EVENT_RECEIVED' });
  } catch (error) {
    console.error('[META_WEBHOOK_ERROR]', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
