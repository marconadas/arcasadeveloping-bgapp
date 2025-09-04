import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { QueryProvider } from '@/components/query-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BGAPP - Marine Angola | Painel Administrativo v2.0.0',
  description: 'Dashboard administrativo para gestão completa da plataforma oceanográfica e meteorológica BGAPP Marine Angola',
  authors: [{ name: 'Mare Datum Consultoria' }],
  manifest: '/manifest.json',
  keywords: ['BGAPP', 'Marine Angola', 'Dashboard', 'Oceanografia', 'Biodiversidade', 'Machine Learning', 'Administração'],
  creator: 'Mare Datum Consultoria',
  publisher: 'BGAPP Marine Angola',
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  openGraph: {
    title: 'BGAPP - Dashboard Administrativo',
    description: 'Plataforma de gestão oceanográfica e meteorológica para Angola',
    siteName: 'BGAPP Marine Angola',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 600,
        alt: 'BGAPP Marine Angola Logo',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BGAPP - Dashboard Administrativo',
    description: 'Plataforma de gestão oceanográfica e meteorológica para Angola',
    images: ['/logo.png'],
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon-16x16.png',
  },
}

export function generateViewport() {
  return {
    themeColor: '#173c72',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}