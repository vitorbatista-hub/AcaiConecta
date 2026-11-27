import { AppProvider } from '@/components/app-provider'
import { ToastProvider } from '@/components/app-shell'
import type { Metadata, Viewport } from 'next'
import { themeInitScript } from '@/components/theme-switcher'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'AçaíConecta - Açaí tradicional em Cametá/PA', template: '%s | AçaíConecta' },
  description: 'Peça açaí tradicional batido na hora pelas batedeiras de Cametá/PA. A partir de 1 litro, com entrega e pagamento direto à batedeira.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'AçaíConecta',
    title: 'AçaíConecta - Açaí tradicional em Cametá/PA',
    description: 'Conectamos você às batedeiras de açaí tradicional de Cametá. Peça a partir de 1 litro e pague por Pix ou em dinheiro na entrega.',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f6f1' },
    { media: '(prefers-color-scheme: dark)', color: '#1f0d35' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="bg-background" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head>
      <body className="antialiased">
        <ToastProvider><AppProvider>{children}</AppProvider></ToastProvider>
      </body>
    </html>
  )
}
