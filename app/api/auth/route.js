import { NextResponse } from 'next/server';

export async function POST(request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const body = await request.json();

  if (action === 'register') {
    const { name, email, password } = body;
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }
    // TODO: implement real registration
    return NextResponse.json({ message: 'Register endpoint ready' }, { status: 201 });
  }

  // default: login
  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }
  // TODO: implement real auth (JWT + database)
  return NextResponse.json({ message: 'Login endpoint ready' });
}
