import { urlMiniatura } from '@/domain/imagem'

/* Elementos visuais da marca. A arte é original e decorativa: não usa fotos de terceiros (DEC-038). */

export function Logo({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <path d="M3 15h26a13 13 0 0 1-26 0Z" fill="currentColor" />
      <ellipse cx="16" cy="15" rx="13" ry="4" fill="currentColor" opacity=".55" />
      <path d="M16 11c0-5 3-8 8-8-.5 5-3 8-8 8Z" fill="oklch(0.7 0.17 140)" />
      <path d="M16 11c0-4-2.5-6.5-6.5-6.5.4 4 2.5 6.5 6.5 6.5Z" fill="oklch(0.6 0.15 140)" />
    </svg>
  )
}

const imagemSegura = (url?: string | null): url is string => Boolean(url && /^(https:\/\/|\/)/.test(url) && !url.startsWith('//'))

/**
 * Foto real quando existe (`imagemUrl`); caso contrário, uma arte da marca.
 * Hoje ainda não há envio de fotos (backlog 2.5), então a arte é o que aparece.
 */
export function FotoOuArte({ url, alt, variante = 0, className = '', miniatura = false }: { url?: string | null; alt: string; variante?: number; className?: string; miniatura?: boolean }) {
  if (imagemSegura(url)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={miniatura ? urlMiniatura(url) : url} alt={alt} loading="lazy" referrerPolicy="no-referrer" className={`object-cover ${className}`} />
  }
  return (
    <div aria-hidden="true" className={`arte-${Math.abs(variante) % 3} relative flex items-center justify-center overflow-hidden ${className}`}>
      <svg viewBox="0 0 200 120" className="h-full max-h-full w-full max-w-[16rem] p-3" focusable="false">
        <ellipse cx="100" cy="108" rx="62" ry="6" fill="#000" opacity=".18" />
        <path d="M44 62h112a56 50 0 0 1-112 0Z" fill="oklch(0.2 0.09 305)" />
        <ellipse cx="100" cy="62" rx="56" ry="15" fill="oklch(0.3 0.13 305)" />
        <ellipse cx="100" cy="60" rx="46" ry="10" fill="oklch(0.42 0.16 310)" />
        <circle cx="82" cy="58" r="2.6" fill="oklch(0.85 0.1 85)" /><circle cx="104" cy="55" r="2.6" fill="oklch(0.85 0.1 85)" />
        <circle cx="120" cy="60" r="2.6" fill="oklch(0.85 0.1 85)" /><circle cx="93" cy="63" r="2.2" fill="oklch(0.85 0.1 85)" />
        <path d="M100 52c0-14 8-22 22-22-1 14-8 22-22 22Z" fill="oklch(0.7 0.17 140)" />
        <path d="M100 52c0-11-6-18-17-18 1 11 6 18 17 18Z" fill="oklch(0.58 0.15 140)" />
      </svg>
    </div>
  )
}
