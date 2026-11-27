// Envio de mensagens. Ainda não há provedor de e-mail contratado: fora de produção o link aparece no log do servidor
// para permitir o teste; em produção nada é enviado e o aviso fica no log (sem o link) até um provedor ser configurado.
export async function sendPasswordReset(to: string, link: string): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[redefinição de senha] ${to}: ${link}`)
    return
  }
  console.warn('Redefinição de senha solicitada, mas nenhum provedor de e-mail está configurado; mensagem não enviada.')
}
