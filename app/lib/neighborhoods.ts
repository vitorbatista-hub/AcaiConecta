// Lista oficial de bairros urbanos de Cametá/PA (DEC-057; fonte IBGE segundo o responsável, `bairros_cameta.txt`).
// A zona rural e as comunidades ribeirinhas ficam fora até nova decisão.
export type Neighborhood = { name: string; alternative?: string }

export const officialNeighborhoods: readonly Neighborhood[] = [
  { name: 'Centro', alternative: 'São João Batista' },
  { name: 'Aldeia' },
  { name: 'Bairro Novo' },
  { name: 'Baixa Verde' },
  { name: 'Brasília' },
  { name: 'Cidade Nova' },
  { name: 'Marambaia' },
  { name: 'Matinha' },
  { name: 'Nova Cametá' },
  { name: 'Primavera', alternative: 'Jardim Primavera' },
  { name: 'Santa Maria' },
  { name: 'São Benedito' },
  { name: 'Trigueiro' },
]

export const isOfficialNeighborhood = (name: string) => officialNeighborhoods.some(item => item.name === name)

/** Nome principal seguido do alternativo entre parênteses, quando houver (ex.: "Centro (São João Batista)"). */
export function neighborhoodLabel(name: string): string {
  const found = officialNeighborhoods.find(item => item.name === name)
  return found?.alternative ? `${found.name} (${found.alternative})` : name
}
