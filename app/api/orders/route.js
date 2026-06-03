import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: fetch from database, filter by role
  return NextResponse.json({ orders: [] });
}

export async function POST(request) {
  const body = await request.json();
  const { childName, menuItemId, date, quantity } = body;

  if (!childName || !menuItemId || !date) {
    return NextResponse.json(
      { error: 'childName, menuItemId, and date are required' },
      { status: 400 }
    );
  }

  // TODO: save to database
  return NextResponse.json(
    { message: 'Order placed', order: { childName, menuItemId, date, quantity: quantity || 1, status: 'pending' } },
    { status: 201 }
  );
}
