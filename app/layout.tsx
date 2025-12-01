import './globals.css'
import type { Metadata } from 'next'
import { ThemeProvider } from '@/lib/contexts/ThemeContext'

// Force dynamic rendering for entire app - uses Supabase client components
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'QuizMe - AI Quiz Generator',
  description: 'Generate practice quizzes from your PDFs',
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
