import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cursor Judging',
  description: 'AI-powered hackathon judging platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0f] text-gray-100 antialiased">
        {children}
      </body>
    </html>
  )
}
