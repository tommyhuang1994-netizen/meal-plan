// The order store, over HTTP.
//
//   GET    ?month=2026-09&day=14              orders served on one date
//   GET    ?month=2026-09&counts=1            per-day counts for the calendar
//   GET    ?month=2026-09&all=1               every day in the month (billing)
//   GET    ?month=2026-09&student=NAME        one student's days
//   GET    ?month=2026-09&summary=1&students= one card per student per month
//   GET    ?month=2026-09&edit=NAME           a placed order, ready to re-open
//   POST                                      place or replace an order
//   PATCH                                     change one day of a placed order
//   DELETE ?student=NAME&month=2026-09        cancel a month's order
//
// There is deliberately no auth on these yet, and they return children's
// allergy information. They must not be reachable publicly before Supabase
// Auth and RLS land — see the note in lib/orders-db.js.
import { NextResponse } from 'next/server';
import {
  ordersForDate, orderCounts, daysInMonth, studentDays, studentOrders, orderForEdit,
} from '../../../lib/orders-db';
import { saveOrder, updateOrderDay, cancelOrder } from '../../../lib/orders-write';

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
    if (searchParams.get('summary')) {
      // No `students` means every student: the admin view. A parent request
      // must always name its children.
      const names = (searchParams.get('students') ?? '').split(',').filter(Boolean);
      return NextResponse.json({ orders: await studentOrders(names) });
    }
    const edit = searchParams.get('edit');
    if (edit) {
      return NextResponse.json({ order: await orderForEdit(edit, month) });
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
    console.error('[api/orders GET]', err);
    return NextResponse.json({ error: 'query failed' }, { status: 500 });
  }
}

/// Place or replace a parent's order for one student and month.
export async function POST(request) {
  try {
    const body = await request.json();
    if (!body?.studentName || !body?.monthKey) {
      return NextResponse.json({ error: 'studentName and monthKey are required' }, { status: 400 });
    }
    return NextResponse.json(await saveOrder(body));
  } catch (err) {
    console.error('[api/orders POST]', err);
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}

/// Change one day of a placed order. 409 when the day is past its cut-off.
export async function PATCH(request) {
  try {
    const body = await request.json();
    const result = await updateOrderDay(body);
    return NextResponse.json(result, { status: result.ok ? 200 : 409 });
  } catch (err) {
    console.error('[api/orders PATCH]', err);
    return NextResponse.json({ error: 'update failed' }, { status: 500 });
  }
}

/// Cancel a month's order, at the parent's request.
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const student = searchParams.get('student');
    const month = searchParams.get('month');
    if (!student || !month) {
      return NextResponse.json({ error: 'student and month are required' }, { status: 400 });
    }
    const reason = searchParams.get('reason');
    return NextResponse.json(await cancelOrder(student, month, { reason }));
  } catch (err) {
    console.error('[api/orders DELETE]', err);
    return NextResponse.json({ error: 'cancel failed' }, { status: 500 });
  }
}
