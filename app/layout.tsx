import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ustasanmmc',
  description: 'Created with iH',
  generator: 'ibadulla_hasanov',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
