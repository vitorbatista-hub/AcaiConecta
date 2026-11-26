import { requireRole } from '@/lib/session-server'

export const dynamic = 'force-dynamic'

// Autorização no servidor: só entra quem tem sessão válida no banco e o papel desta área.
export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireRole('cliente')
  return children
}
