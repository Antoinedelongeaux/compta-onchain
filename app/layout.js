import './globals.css'

export const metadata = {
  title: 'Compta on-chain — Console de pilotage',
  description: 'Orchestrez vos flux comptables Web3 : simulation, écriture, réconciliation et ancrage sécurisé.',
}

export default function RootLayout({ children }) {
  const currentYear = new Date().getFullYear()

  return (
    <html lang="fr">
      <body className="bg-slate-950 font-sans text-slate-100">
        <div className="relative isolate min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 -top-48 -z-10 flex justify-center">
            <div className="h-[540px] w-[780px] rounded-full bg-gradient-to-br from-emerald-400/60 via-sky-500/40 to-transparent blur-3xl" />
          </div>
          <div className="pointer-events-none absolute -bottom-56 right-0 -z-10 hidden h-[520px] w-[520px] rounded-full bg-gradient-to-tl from-sky-500/40 via-transparent to-emerald-400/30 blur-3xl lg:block" />

          <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-12 pt-10 md:px-10 lg:px-12">
            <header className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.45em] text-emerald-300/80">Console finance publique</p>
                  <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">Compta publique on-chain</h1>
                  <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-200/80">
                    Harmonisez transactions Web3 et obligations comptables avec une interface unique : simulez les flux, créez
                    les écritures, réconciliez les pièces et ancrez vos périodes en quelques clics.
                  </p>
                </div>
                <div className="self-stretch rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-6 py-5 text-right shadow-lg backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">MVP en production</p>
                  <p className="mt-3 text-4xl font-semibold text-white">{currentYear}</p>
                  <p className="mt-2 text-sm text-slate-200/70">Ancrage sécurisé & traçabilité</p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-200/80">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 ring-1 ring-white/10">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  Workflow complet
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 ring-1 ring-white/10">
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  Réconciliation guidée
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 ring-1 ring-white/10">
                  <span className="h-2 w-2 rounded-full bg-emerald-200" />
                  Export audit-ready
                </span>
              </div>
            </header>

            <main className="mt-10 flex-1 pb-10">{children}</main>

            <footer className="mt-16 border-t border-white/10 pt-6 text-xs text-slate-400">
              © {currentYear} Compta on-chain — Prototype confidentiel.
            </footer>
          </div>
        </div>
      </body>
    </html>
  )
}
