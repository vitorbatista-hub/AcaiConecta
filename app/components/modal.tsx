'use client'
import { useEffect, useId, useRef } from 'react'

export function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) {
  const dialog=useRef<HTMLDialogElement>(null)
  const titleId=useId()
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null
    const element=dialog.current
    element?.showModal()
    const previousOverflow=document.body.style.overflow
    document.body.style.overflow='hidden'
    return ()=>{element?.close();document.body.style.overflow=previousOverflow;previous?.focus()}
  },[])
  return <dialog ref={dialog} aria-labelledby={titleId} onCancel={event=>{event.preventDefault();onClose()}} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-3xl border border-border bg-background p-4 sm:p-6 text-foreground shadow-2xl backdrop:bg-black/50">
    <div className="mb-5 flex items-center justify-between gap-4"><h2 id={titleId} className="text-2xl font-black">{title}</h2><button type="button" onClick={onClose} aria-label="Fechar" className="grid size-11 shrink-0 place-items-center rounded-full border">×</button></div>{children}
  </dialog>
}
