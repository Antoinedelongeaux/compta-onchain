export default function Panel() {
  return (
    <header className="sticky top-0 z-50 w-full isolate overflow-hidden bg-[#0B1F3A] text-white shadow-xl box-border px-6 sm:px-8 md:px-16 py-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-12 h-64 w-64 rounded-full bg-sky-500/40 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-emerald-400/30 blur-3xl" />
      </div>

      <div className="relative flex w-full flex-col gap-8">
        <div className="max-w-3xl">
          <h5 className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-50/90">
            Console finance publique
          </h5>
          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-white">
            Compta publique on-chain
          </h1>
          <h6 className="mt-6 text-base leading-relaxed text-white/90">
            Harmonisez transactions Web3 et obligations comptables avec une interface unique : 
            simulez les flux, créez les écritures, réconciliez les pièces et ancrez vos périodes 
            en quelques clics.
          </h6>
        </div>
      </div>
    </header>
  )
}
