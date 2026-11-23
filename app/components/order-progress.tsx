import { Check } from 'lucide-react'
import type { OrderStatus } from '@/lib/mock-data'

const steps: { status: OrderStatus; label: string }[] = [
  { status: 'AGUARDANDO_ACEITE', label: 'Enviado' },
  { status: 'ACEITO', label: 'Aceito' },
  { status: 'EM_PREPARO', label: 'Preparo' },
  { status: 'PRONTO', label: 'Pronto' },
  { status: 'SAIU_PARA_ENTREGA', label: 'A caminho' },
  { status: 'ENTREGUE', label: 'Entregue' },
]

/** Trilha visual do caminho feliz do pedido; estados negativos não a exibem. */
export function OrderProgress({ status }: { status: OrderStatus }) {
  const current = steps.findIndex(step => step.status === status)
  if (current < 0) return null
  return <ol aria-label="Progresso do pedido" className="grid grid-cols-6 gap-1">
    {steps.map((step, index) => {
      const done = index < current || status === 'ENTREGUE'
      const active = index === current && status !== 'ENTREGUE'
      return <li key={step.status} aria-current={active ? 'step' : undefined} className="flex flex-col items-center gap-1.5 text-center">
        <span className="relative flex w-full items-center justify-center">
          {index > 0 && <span aria-hidden className={`absolute right-1/2 top-1/2 h-0.5 w-full -translate-y-1/2 ${index <= current ? 'bg-primary' : 'bg-border'}`} />}
          <span className={`relative grid size-7 place-items-center rounded-full border-2 text-xs font-bold ${done ? 'border-primary bg-primary text-primary-foreground' : active ? 'border-primary bg-background text-primary ring-4 ring-primary/15' : 'border-border bg-background text-muted-foreground'}`}>
            {done ? <Check className="size-4" aria-hidden /> : index + 1}
          </span>
        </span>
        <span className={`text-[11px] leading-tight sm:text-xs ${active ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
          {step.label}
          <span className="sr-only">{done ? ' (concluído)' : active ? ' (etapa atual)' : ' (pendente)'}</span>
        </span>
      </li>
    })}
  </ol>
}
