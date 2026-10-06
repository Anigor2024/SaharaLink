import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic, Manrope, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-latin',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SaharaLink — The Transfer Corridor',
  description:
    'منصة طلبات التحويل المالي العابر للحدود بين موريتانيا وساحل العاج (MRU ↔ XOF) مع تسعير فوري، تتبع مسار مباشر، ولوحة عمليات للإدارة.',
  openGraph: {
    title: 'SaharaLink — The Transfer Corridor',
    description:
      'منصة طلبات التحويل المالي العابر للحدود بين موريتانيا وساحل العاج (MRU ↔ XOF) مع تسعير فوري، تتبع مسار مباشر، ولوحة عمليات للإدارة.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SaharaLink — The Transfer Corridor',
    description:
      'منصة طلبات التحويل المالي العابر للحدود بين موريتانيا وساحل العاج (MRU ↔ XOF) مع تسعير فوري، تتبع مسار مباشر، ولوحة عمليات للإدارة.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${ibmPlexArabic.variable} ${manrope.variable} ${ibmPlexMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="bg-[#FAF8F2] text-[#10161F] font-[var(--font-arabic),var(--font-latin),sans-serif] antialiased overflow-x-hidden"
      >
        {children}
      </body>
    </html>
  );
}
