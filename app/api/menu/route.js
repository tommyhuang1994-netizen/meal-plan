import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: fetch from database
  return NextResponse.json({ items: [] });
}

export async function POST(request) {
  const body = await request.json();
  const { name, description, price, category, availableDate } = body;

  if (!name || !price) {
    return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
  }

  // TODO: save to database
  return NextResponse.json(
    { message: 'Menu item created', item: { name, description, price, category, availableDate } },
    { status: 201 }
  );
}
