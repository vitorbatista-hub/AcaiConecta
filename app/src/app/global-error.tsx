'use client'

/** Último recurso, quando o próprio layout falha: precisa trazer `html` e `body`. */
export default function ErroGlobal({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: '28rem', margin: '0 auto' }}>
        <h1>Algo deu errado</h1>
        <p>Não foi possível carregar a página. Tente de novo em instantes.</p>
        {error.digest ? <p>Código para o suporte: <strong>{error.digest}</strong></p> : null}
      </body>
    </html>
  )
}
