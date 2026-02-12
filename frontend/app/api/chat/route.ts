import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { history, message } = body;

    // TODO: Integrate with your backend API
    // For now, return a mock response
    const response = {
      text: `Echo: ${message}`,
      data: null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
