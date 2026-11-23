/**
 * Regras dos logs estruturados (backlog 1.5, PRD §18.5, §17): o que pode ser registrado e como o erro é descrito.
 * O princípio é uma lista de omissão por nome de campo, mais descrição de erro sem a mensagem, que pode conter dados.
 */
export const NIVEIS = ['debug', 'info', 'warn', 'error'] as const
export type NivelLog = (typeof NIVEIS)[number]

/** Campos cujo valor nunca vai para o log: credenciais, dados pessoais e texto livre do usuário. */
const SENSIVEL = /senha|password|token|cookie|authorization|secret|segredo|hash|e-?mail|telefone|phone|endereco|logradouro|referencia|nome|cpf|cnpj|motivo|observacao|mensagem|detalhe|chave|credencial/i

const LIMITE_TEXTO = 200
const PROFUNDIDADE_MAXIMA = 3

export const ID_REQUISICAO = /^[A-Za-z0-9-]{8,64}$/

export const idRequisicaoValido = (v: string | null | undefined): v is string => Boolean(v && ID_REQUISICAO.test(v))

export function redigir(valor: unknown, profundidade = 0): unknown {
  if (valor === null || valor === undefined) return valor
  if (typeof valor === 'bigint') return valor.toString()
  if (typeof valor === 'string') return valor.length > LIMITE_TEXTO ? `${valor.slice(0, LIMITE_TEXTO)}…` : valor
  if (typeof valor === 'number' || typeof valor === 'boolean') return valor
  if (valor instanceof Date) return valor.toISOString()
  if (valor instanceof Error) return descreverErro(valor)
  if (profundidade >= PROFUNDIDADE_MAXIMA) return '[omitido]'
  if (Array.isArray(valor)) return valor.slice(0, 20).map(v => redigir(v, profundidade + 1))
  if (typeof valor === 'object') {
    const saida: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(valor as Record<string, unknown>)) {
      saida[k] = SENSIVEL.test(k) ? '[omitido]' : redigir(v, profundidade + 1)
    }
    return saida
  }
  return '[omitido]'
}

export type ErroDescrito = { tipo: string; codigo?: string; local?: string }

/**
 * Descreve o erro sem a mensagem (erros do banco e de bibliotecas podem trazer valores de consulta) e sem a
 * pilha completa: só o tipo, o código e o primeiro ponto do código do projeto.
 */
export function descreverErro(e: unknown): ErroDescrito {
  if (!(e instanceof Error)) return { tipo: typeof e }
  const bruto = (e as { code?: unknown; codigo?: unknown }).codigo ?? (e as { code?: unknown }).code
  const codigo = typeof bruto === 'string' || typeof bruto === 'number' ? String(bruto) : undefined
  const quadro = e.stack
    ?.split('\n')
    .slice(1)
    .find(l => (l.includes('/src/') || l.includes('/app/')) && !l.includes('node_modules'))
  const local = quadro?.trim().replace(/^at\s+/, '').replace(/^.*?\(/, '').replace(/\)$/, '').split(/[\\/]/).slice(-3).join('/')
  return { tipo: e.name, ...(codigo ? { codigo } : {}), ...(local ? { local: local.slice(0, 120) } : {}) }
}

/** Caminho sem a query string (que pode ter tokens ou dados). */
export const caminhoSemQuery = (caminho: string) => caminho.split('?')[0]?.slice(0, 200) ?? ''
