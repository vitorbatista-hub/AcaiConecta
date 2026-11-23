/** Executado uma vez quando o servidor Node inicia: liga as tarefas periódicas (expiração de pedidos e expurgo). */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { iniciarAgendador } = await import('./server/agendador')
    iniciarAgendador()
  }
}
