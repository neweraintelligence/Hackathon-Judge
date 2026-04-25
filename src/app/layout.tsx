import type { Metadata } from 'next'
import { Space_Grotesk, Space_Mono } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
})

export const metadata: Metadata = {
  title: 'Judging',
  description: 'Hackathon judging tool',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body className="min-h-screen antialiased">
        <div className="bg-layer" />
        <div className="bg-grid" />
        <div className="bg-glow-a" />
        <div className="bg-glow-b" />
        <div className="main-content">
          {children}
        </div>
      </body>
    </html>
  )
}
