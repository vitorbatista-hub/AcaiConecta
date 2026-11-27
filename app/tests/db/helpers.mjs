// Limpeza dos dados criados pelos testes com banco (e-mails "teste-*"), respeitando as chaves estrangeiras.
export async function cleanTestData(db) {
  const ids = (await db.usuarios.findMany({ where: { email: { startsWith: 'teste-' } }, select: { id: true } })).map(u => u.id)
  const stores = (await db.batedeiras.findMany({ where: { responsavel_id: { in: ids } }, select: { id: true } })).map(s => s.id)
  const orders = (await db.pedidos.findMany({ where: { OR: [{ cliente_id: { in: ids } }, { batedeira_id: { in: stores } }] }, select: { id: true } })).map(o => o.id)
  await db.eventos_pedido.deleteMany({ where: { pedido_id: { in: orders } } })
  await db.itens_pedido.deleteMany({ where: { pedido_id: { in: orders } } })
  await db.pedidos.deleteMany({ where: { id: { in: orders } } })
  await db.configuracoes_plataforma.deleteMany({ where: { atualizado_por: { in: ids } } })
  await db.eventos_auditoria.deleteMany({ where: { usuario_id: { in: ids } } })
  await db.produtos.deleteMany({ where: { batedeira_id: { in: stores } } })
  await db.batedeiras.deleteMany({ where: { id: { in: stores } } })
  await db.enderecos_clientes.deleteMany({ where: { cliente_id: { in: ids } } })
  await db.usuarios.deleteMany({ where: { id: { in: ids } } })
  await db.tentativas_login.deleteMany({ where: { email: { startsWith: 'teste-' } } })
}
