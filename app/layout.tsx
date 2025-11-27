import './globals.css'
import type { Metadata } from 'next'

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
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
