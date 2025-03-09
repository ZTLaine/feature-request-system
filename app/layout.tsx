import type { Metadata } from 'next'
import './globals.css'
import ClientProvider from '@/components/providers/ClientProvider'

export const metadata: Metadata = {
  title: 'Features Request System',
  description: 'Features Request System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ClientProvider>
          {children}
        </ClientProvider>
      </body>
    </html>
  )
}