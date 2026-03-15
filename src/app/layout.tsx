import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Judging',
  description: 'Hackathon judging tool',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen text-gray-100 antialiased">
        {children}
      </body>
    </html>
  )
}
