import './globals.css';

export const metadata = {
  title: 'Zera Meal Plan',
  description: 'School meal ordering system — Zera International School',
};

// Mobile-first: render at device width (not desktop 980px) and extend under
// notches/home-indicator. Pinch-zoom is intentionally left enabled (a11y).
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1B5E20',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
