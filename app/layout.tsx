import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'TopUp.TJ — Free Fire & PUBG Mobile',
  description:
    'Премиум сервис пополнения игр в Таджикистане: Free Fire алмазы, PUBG Mobile UC. DC City, Alif Mobi, Mastercard, Корти милли.',
  applicationName: 'TopUp.TJ',
  themeColor: '#0a0a0b',
  icons: {
    icon: '/Gemini_Generated_Image_2cm8ve2cm8ve2cm8.png',
    apple: '/Gemini_Generated_Image_2cm8ve2cm8ve2cm8.png',
  },
  openGraph: {
    title: 'TopUp.TJ — Game Top-Up Tajikistan',
    description: 'Алмазы Free Fire и UC PUBG Mobile за 5 минут.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0a0b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark">
      <body className="min-h-dvh antialiased">
        {/* Telegram WebApp SDK — non-blocking */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
