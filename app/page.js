import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 24 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700 }}>🍱 Meal Plan</h1>
      <p style={{ color: '#555', marginTop: -16 }}>School meal ordering system</p>
      <div style={{ display: 'flex', gap: 16 }}>
        <Link href="/parent" style={btnStyle('#2563eb')}>I&apos;m a Parent</Link>
        <Link href="/admin" style={btnStyle('#16a34a')}>I&apos;m an Admin</Link>
      </div>
    </main>
  );
}

function btnStyle(bg) {
  return {
    background: bg,
    color: '#fff',
    padding: '12px 28px',
    borderRadius: 8,
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: 15,
  };
}
