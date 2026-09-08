'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useT } from '../../../lib/i18n';

export default function AdminDashboard() {
  const router = useRouter();
  const { t } = useT();

  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') !== 'true') {
      router.replace('/admin');
    }
  }, []);

  function signOut() {
    sessionStorage.removeItem('admin_auth');
    router.push('/admin');
  }

  return (
    <main style={{ background: '#FAFAFA', minHeight: '100dvh' }}>
      <header style={{ background: '#1B5E20', padding: '14px 20px', paddingRight: 108, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Image src="/logo.png" alt="Zera" width={140} height={40} style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        <button onClick={signOut}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {t('common.signOut')}
        </button>
      </header>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>{t('adminDash.title')}</h1>
        <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 24px' }}>{t('adminDash.subtitle')}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card title={t('adminDash.menuTitle')}   desc={t('adminDash.menuDesc')}   href="/admin/menu"   color="#1B5E20" />
          <Card title={t('adminDash.pricesTitle')} desc={t('adminDash.pricesDesc')} href="/admin/prices" color="#D97706" />
          <Card title={t('adminDash.ordersTitle')} desc={t('adminDash.ordersDesc')} href="/admin/orders" color="#ea580c" />
          <Card title={t('billing.adminCardTitle')} desc={t('billing.adminCardDesc')} href="/admin/billing" color="#1565C0" />
        </div>
      </div>
    </main>
  );
}

function Card({ title, desc, href, color }) {
  return (
    <Link href={href} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '18px 20px', textDecoration: 'none', borderLeft: `4px solid ${color}`, display: 'block' }}>
      <div style={{ fontWeight: 600, color: '#111', fontSize: 16 }}>{title}</div>
      <div style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>{desc}</div>
    </Link>
  );
}
