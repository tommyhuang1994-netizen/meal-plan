'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function VendorLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleLogin(e) {
    e.preventDefault();
    // Mock auth — replace with real auth later
    if (password === 'vendor123') {
      router.push('/vendor/dashboard');
    } else {
      setError('Incorrect password. Try: vendor123');
    }
  }

  return (
    <main style={{ position: 'relative', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', overflow: 'hidden', padding: 24 }}>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', pointerEvents: 'none' }}>
        <Image src="/gradient.jpg" alt="" fill style={{ objectFit: 'cover', objectPosition: 'bottom' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, background: '#fff', borderRadius: 16, padding: '36px 28px', maxWidth: 380, width: '100%', boxShadow: '0 4px 32px rgba(0,0,0,0.10)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Image src="/logo.png" alt="Zera International School" width={200} height={56} style={{ objectFit: 'contain' }} />
          <p style={{ color: '#4B7A4B', fontSize: 13, marginTop: 10 }}>Vendor Portal</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="Enter vendor password"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 9, border: `1.5px solid ${error ? '#DC2626' : '#E5E7EB'}`, fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
            />
            {error && <p style={{ color: '#DC2626', fontSize: 12, marginTop: 5 }}>{error}</p>}
          </div>
          <button type="submit" style={{ background: '#1B5E20', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            Sign In
          </button>
        </form>
      </div>
    </main>
  );
}
