'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useT } from '../../lib/i18n';

export default function AdminLogin() {
  const router = useRouter();
  const { t } = useT();
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (password === 'admin123') {
        sessionStorage.setItem('admin_auth', 'true');
        router.push('/admin/dashboard');
      } else {
        setError(t('login.incorrect'));
        setLoading(false);
      }
    }, 400);
  }

  return (
    <main style={{ position: 'relative', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', overflow: 'hidden', padding: 24 }}>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', pointerEvents: 'none' }}>
        <Image src="/gradient.jpg" alt="" fill style={{ objectFit: 'cover', objectPosition: 'bottom' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, background: '#fff', borderRadius: 16, padding: '36px 28px', maxWidth: 380, width: '100%', boxShadow: '0 4px 32px rgba(0,0,0,0.10)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Image src="/logo.png" alt="Zera International School" width={200} height={56} style={{ objectFit: 'contain' }} />
          <p style={{ color: '#4B7A4B', fontSize: 13, marginTop: 10, fontWeight: 600 }}>{t('adminLogin.portal')}</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              {t('common.password')}
            </label>
            <input
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder={t('adminLogin.placeholder')}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 9, border: `1.5px solid ${error ? '#DC2626' : '#E5E7EB'}`, fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
            />
            {error && <p style={{ color: '#DC2626', fontSize: 12, marginTop: 5 }}>{error}</p>}
          </div>
          <button type="submit" disabled={loading}
            style={{ background: '#1B5E20', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 0', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? t('common.signingIn') : t('common.signIn')}
          </button>
        </form>
      </div>
    </main>
  );
}
