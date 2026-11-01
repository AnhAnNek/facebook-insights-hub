import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Facebook Insights & Story Analytics Server | Next.js',
  description: 'Trung tâm tiếp nhận, quản trị và phân tích tương tác Story, Lượt xem và Thả tym từ Facebook qua API và Webhooks',
  keywords: ['facebook story', 'insights', 'analytics', 'reactions', 'nextjs server']
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
