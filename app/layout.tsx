import './globals.css'
import type { Metadata } from 'next'
import { ThemeProvider } from '@/lib/contexts/ThemeContext'
import PWAInstaller from '@/components/PWAInstaller'

// Force dynamic rendering for entire app - uses Supabase client components
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'QuizMe - AI Quiz Generator',
  description: 'Generate practice quizzes from your learning materials using AI',
  manifest: '/manifest.json',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'QuizMe',
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png?v=3', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png?v=3', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192x192.png?v=3', sizes: '192x192', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <PWAInstaller />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
