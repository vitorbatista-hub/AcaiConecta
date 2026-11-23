export default function Inicio() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-4 px-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-folha">Cametá · Pará</p>
      <h1 className="text-4xl font-black tracking-tight">AçaíConecta</h1>
      <p className="text-suave">
        Peça açaí tradicional das batedeiras de Cametá, a partir de 1 litro, e pague na entrega.
      </p>
      <p className="rounded-xl border border-borda bg-cartao p-4 text-sm text-suave">
        O MVP está em construção. As regras de negócio, o banco e a autenticação já estão implementados e testados; as telas vêm a seguir.
      </p>
    </main>
  )
}
