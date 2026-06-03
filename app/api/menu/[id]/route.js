import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  // TODO: fetch from database
  return NextResponse.json({ item: null, id: params.id });
}

export async function PUT(request, { params }) {
  const body = await request.json();
  // TODO: update in database
  return NextResponse.json({ message: 'Menu item updated', id: params.id, ...body });
}

export async function DELETE(request, { params }) {
  // TODO: delete from database
  return NextResponse.json({ message: 'Menu item deleted', id: params.id });
}
