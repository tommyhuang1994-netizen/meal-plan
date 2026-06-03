import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  // TODO: fetch from database
  return NextResponse.json({ order: null, id: params.id });
}

export async function PATCH(request, { params }) {
  const { status } = await request.json();
  const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];

  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Status must be one of: ${validStatuses.join(', ')}` },
      { status: 400 }
    );
  }

  // TODO: update in database
  return NextResponse.json({ message: 'Order status updated', id: params.id, status });
}

export async function DELETE(request, { params }) {
  // TODO: delete/cancel in database
  return NextResponse.json({ message: 'Order cancelled', id: params.id });
}
