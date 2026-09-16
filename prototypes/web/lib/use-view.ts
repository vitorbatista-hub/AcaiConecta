'use client'
import { useSyncExternalStore } from 'react'
function subscribe(callback:()=>void) {
  window.addEventListener('popstate',callback)
  window.addEventListener('acai-view-change',callback)
  return ()=>{window.removeEventListener('popstate',callback);window.removeEventListener('acai-view-change',callback)}
}
export function useView(defaultView='overview') {
  const view=useSyncExternalStore(subscribe,()=>new URLSearchParams(window.location.search).get('view')||defaultView,()=>defaultView)
  const setView=(value:string)=>{
    const url=new URL(window.location.href)
    if(value===defaultView) url.searchParams.delete('view'); else url.searchParams.set('view',value)
    window.history.pushState(null,'',url)
    window.dispatchEvent(new Event('acai-view-change'))
  }
  return [view,setView] as const
}
