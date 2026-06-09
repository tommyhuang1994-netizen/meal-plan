import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', overflow: 'hidden', background: '#fff' }}>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', pointerEvents: 'none' }}>
        <Image src="/gradient.jpg" alt="" fill style={{ objectFit: 'cover', objectPosition: 'bottom' }} priority />
      </div>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, padding: '0 24px', width: '100%', maxWidth: 360 }}>
        <Image src="/logo.png" alt="Zera International School" width={300} height={84} style={{ objectFit: 'contain', maxWidth: '85vw' }} priority />
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A3A1A', margin: '0 0 6px' }}>Meal Plan Portal</h1>
          <p style={{ color: '#4B7A4B', fontSize: 14, margin: 0 }}>Select your role to continue</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          <RoleBtn href="/parent" label="I'm a Parent" icon={ParentIcon} bg="#1B5E20" />
          <RoleBtn href="/admin"  label="I'm an Admin" icon={AdminIcon}  bg="#145A32" />
          <RoleBtn href="/vendor" label="I'm a Vendor" icon={VendorIcon} bg="#D97706" />
        </div>
      </div>
    </main>
  );
}

function RoleBtn({ href, label, icon: Icon, bg }) {
  return (
    <Link href={href} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: bg, color: '#fff', padding: '14px 20px',
      borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 15,
      boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
    }}>
      <Icon />
      {label}
      <svg style={{ marginLeft: 'auto' }} width="16" height="16" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

function ParentIcon() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function AdminIcon() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
}
function VendorIcon() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
}
