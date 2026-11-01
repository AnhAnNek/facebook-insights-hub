import { NextResponse } from 'next/server';
import { getDatabase, seedInitialData } from '@/lib/db';

export async function POST() {
  try {
    const db = getDatabase();
    seedInitialData(db);
    return NextResponse.json({
      success: true,
      message: 'Đã khởi tạo lại dữ liệu mẫu vào SQLite thành công'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi reseed database' },
      { status: 500 }
    );
  }
}
