import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'API 測試成功',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      message: '收到 POST 請求',
      data: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: '解析請求失敗',
        message: error instanceof Error ? error.message : '未知錯誤',
      },
      { status: 400 }
    );
  }
}
