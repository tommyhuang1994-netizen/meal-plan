// Read side of the order store.
//
//   GET /api/orders?month=2026-09&day=14        one date
//   GET /api/orders?month=2026-09&counts=1      per-day counts for the calendar
//   GET /api/orders?month=2026-09&all=1         every day in the month (billing)
//   GET /api/orders?month=2026-09&student=NAME  one student's days
//
// There is deliberately no auth on these yet, and they return children's
// allergy information. They must not be exposed publicly before Supabase Auth
// and RLS land — see the note in lib/orders-db.js.
import { NextResponse } from 'next/server';
import { ordersForDate, orderCounts, daysInMonth, studentDays } from '../../../lib/orders-db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'month must be YYYY-MM' }, { status: 400 });
  }

  try {
    if (searchParams.get('counts')) {
      return NextResponse.json({ counts: await orderCounts(month) });
    }
    if (searchParams.get('all')) {
      return NextResponse.json({ rows: await daysInMonth(month) });
    }
    const student = searchParams.get('student');
    if (student) {
      return NextResponse.json({ rows: await studentDays(student, month) });
    }
    const day = parseInt(searchParams.get('day') ?? '', 10);
    if (!Number.isFinite(day)) {
      return NextResponse.json({ error: 'day is required' }, { status: 400 });
    }
    return NextResponse.json({ rows: await ordersForDate(month, day) });
  } catch (err) {
    console.error('[api/orders]', err);
    return NextResponse.json({ error: 'query failed' }, { status: 500 });
  }
}
