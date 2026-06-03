import Link from 'next/link';

export default function AdminPage() {
  return (
    <main style={{ maxWidth: 600, margin: '60px auto', padding: '0 16px' }}>
      <Link href="/" style={{ color: '#16a34a', textDecoration: 'none', fontSize: 14 }}>← Back</Link>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginTop: 16 }}>Admin Panel</h1>
      <p style={{ color: '#555' }}>Manage the menu and review all incoming orders.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
        <Card title="Manage Menu" desc="Add, edit, or remove meal items" href="/admin/menu" color="#16a34a" />
        <Card title="View Orders" desc="See all orders from parents" href="/admin/orders" color="#ea580c" />
      </div>
    </main>
  );
}

function Card({ title, desc, href, color }) {
  return (
    <Link href={href} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '18px 20px', textDecoration: 'none', borderLeft: `4px solid ${color}` }}>
      <div style={{ fontWeight: 600, color: '#111', fontSize: 16 }}>{title}</div>
      <div style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>{desc}</div>
    </Link>
  );
}
