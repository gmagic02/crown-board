import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Whop Leaderboards',
  description: 'Live leaderboards for your Whop business',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}


