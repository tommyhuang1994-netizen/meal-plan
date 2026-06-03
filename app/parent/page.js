'use client';

import Link from 'next/link';

const NEXT_MONTH = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
const NEXT_MONTH_LABEL = NEXT_MONTH.toLocaleString('default', { month: 'long', year: 'numeric' });

const HAS_ORDERED_NEXT_MONTH = false;

const MOCK_ORDERS = [
  {
    id: 'ORD-001',
    childName: 'Ahmad Irfan',
    month: 'April 2026',
    schoolDays: 22,
    status: 'delivered',
  },
  {
    id: 'ORD-002',
    childName: 'Ahmad Irfan',
    month: 'May 2026',
    schoolDays: 20,
    status: 'delivered',
  },
  {
    id: 'ORD-003',
    childName: 'Nur Aisyah',
    month: 'May 2026',
    schoolDays: 20,
    status: 'delivered',
  },
  {
    id: 'ORD-004',
    childName: 'Nur Aisyah',
    month: 'June 2026',
    schoolDays: 21,
    status: 'confirmed',
  },
];

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   bg: '#FEF9C3', color: '#854D0E', dot: '#CA8A04' },
  confirmed: { label: 'Confirmed', bg: '#DCFCE7', color: '#14532D', dot: '#16A34A' },
  delivered: { label: 'Delivered', bg: '#F0F9FF', color: '#0C4A6E', dot: '#0284C7' },
};


export default function ParentPage() {
  const showCTA = !HAS_ORDERED_NEXT_MONTH;

  return (
    <main style={{ background: '#FAFAFA', minHeight: '100dvh' }}>
      {/* Header */}
      <header style={styles.header}>
        <Link href="/" style={styles.backLink}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <div>
          <h1 style={styles.headerTitle}>My Meal Orders</h1>
          <p style={styles.headerSub}>Manage meal orders for your children</p>
        </div>
      </header>

      <div style={styles.container}>

        {/* CTA Banner — Order Next Month */}
        {showCTA && (
          <div style={styles.ctaBanner}>
            <div style={styles.ctaLeft}>
              <div style={styles.ctaIconWrap}>
                <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p style={styles.ctaLabel}>Order for</p>
                <p style={styles.ctaMonth}>{NEXT_MONTH_LABEL}</p>
                <p style={styles.ctaHint}>Meal plan not yet submitted for next month</p>
              </div>
            </div>
            <Link
              href="/parent/order"
              style={styles.ctaButton}
              onMouseEnter={e => e.currentTarget.style.background = '#B91C1C'}
              onMouseLeave={e => e.currentTarget.style.background = '#DC2626'}
            >
              Place Order
            </Link>
          </div>
        )}

        {/* Order History */}
        <section>
          <h2 style={styles.sectionTitle}>Order History</h2>

          {MOCK_ORDERS.length === 0 ? (
            <div style={styles.emptyState}>
              <svg width="40" height="40" fill="none" stroke="#D1D5DB" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p style={{ marginTop: 12, color: '#6B7280', fontSize: 15 }}>No orders yet</p>
              <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>Place your first order above</p>
            </div>
          ) : (
            <div style={styles.orderList}>
              {MOCK_ORDERS.map(order => {
                const s = STATUS_CONFIG[order.status];
                return (
                  <div key={order.id} style={styles.orderCard}>
                    <div style={styles.orderTop}>
                      <div>
                        <p style={styles.mealName}>{order.month}</p>
                        <p style={styles.childName}>
                          <svg width="12" height="12" fill="none" stroke="#6B7280" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 4, flexShrink: 0 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {order.childName}
                        </p>
                      </div>
                      <span style={{ ...styles.statusBadge, background: s.bg, color: s.color }}>
                        <span style={{ ...styles.statusDot, background: s.dot }} />
                        {s.label}
                      </span>
                    </div>
                    <div style={styles.orderMeta}>
                      <span style={styles.orderId}>{order.id}</span>
                      <span style={styles.orderDate}>
                        <svg width="12" height="12" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 3 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {order.schoolDays} school days
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const styles = {
  header: {
    background: '#fff',
    borderBottom: '1px solid #F3F4F6',
    padding: '16px 20px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    color: '#6B7280',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  headerSub: {
    fontSize: 13,
    color: '#6B7280',
    margin: '4px 0 0',
  },
  container: {
    maxWidth: 640,
    margin: '0 auto',
    padding: '20px 16px 40px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  ctaBanner: {
    background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
    borderRadius: 14,
    padding: '20px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    boxShadow: '0 4px 16px rgba(220,38,38,0.25)',
  },
  ctaLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  ctaIconWrap: {
    background: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ctaLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontWeight: 600,
  },
  ctaMonth: {
    fontSize: 17,
    fontWeight: 700,
    color: '#fff',
    margin: '2px 0 0',
  },
  ctaHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    margin: '3px 0 0',
  },
  ctaButton: {
    background: '#DC2626',
    color: '#fff',
    border: '2px solid rgba(255,255,255,0.5)',
    borderRadius: 10,
    padding: '10px 18px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 150ms ease',
    flexShrink: 0,
  },
  successBanner: {
    background: '#DCFCE7',
    border: '1px solid #BBF7D0',
    borderRadius: 10,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: '#166534',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 12px',
  },
  emptyState: {
    background: '#fff',
    border: '1px solid #F3F4F6',
    borderRadius: 12,
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  orderList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  orderCard: {
    background: '#fff',
    border: '1px solid #F3F4F6',
    borderRadius: 12,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  orderTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  mealName: {
    fontSize: 15,
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  childName: {
    fontSize: 13,
    color: '#6B7280',
    margin: '4px 0 0',
    display: 'flex',
    alignItems: 'center',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: 20,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    flexShrink: 0,
  },
  orderMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTop: '1px solid #F9FAFB',
  },
  orderId: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  orderDate: {
    fontSize: 12,
    color: '#9CA3AF',
    display: 'flex',
    alignItems: 'center',
  },
};
