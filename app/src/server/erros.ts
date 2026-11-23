/** Erro esperado de regra de negócio, seguro para mostrar ao usuário. */
export class ErroNegocio extends Error {
  override readonly name = 'ErroNegocio'
  constructor(
    readonly codigo: string,
    mensagem: string,
  ) {
    super(mensagem)
  }
}
