'use client'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useSyncExternalStore } from 'react'

export type ThemeChoice = 'light' | 'dark' | 'system'
export const themeStorageKey = 'acaiconecta-tema'
// Executado antes da hidratação (ver layout.tsx) para evitar o flash do tema errado.
export const themeInitScript = `try{var t=localStorage.getItem('${themeStorageKey}');if(t==='light'||t==='dark'){document.documentElement.classList.add(t)}}catch(e){}`

const options = [
  { value: 'light', label: 'Modo claro', icon: Sun },
  { value: 'dark', label: 'Modo escuro', icon: Moon },
  { value: 'system', label: 'Seguir o sistema', icon: Monitor },
] as const

const listeners = new Set<() => void>()
function readChoice(): ThemeChoice {
  try { const saved = localStorage.getItem(themeStorageKey); return saved === 'light' || saved === 'dark' ? saved : 'system' } catch { return 'system' }
}
function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener('storage', listener)
  return () => { listeners.delete(listener); window.removeEventListener('storage', listener) }
}
function apply(choice: ThemeChoice) {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  if (choice !== 'system') root.classList.add(choice)
  try { if (choice === 'system') localStorage.removeItem(themeStorageKey); else localStorage.setItem(themeStorageKey, choice) } catch { /* sem armazenamento: vale só nesta página */ }
  listeners.forEach(listener => listener())
}

export function ThemeSwitcher() {
  const choice = useSyncExternalStore(subscribe, readChoice, () => 'system' as ThemeChoice)
  return <div role="radiogroup" aria-label="Aparência" className="flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5">
    {options.map(({ value, label, icon: Icon }) => <button key={value} type="button" role="radio" aria-checked={choice === value} aria-label={label} title={label} onClick={() => apply(value)} className={`grid size-9 place-items-center rounded-full transition focus-visible:outline-2 focus-visible:outline-primary ${choice === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}><Icon className="size-4" aria-hidden /></button>)}
  </div>
}
