import './globals.css'

export const metadata = {
  title: 'Compta on-chain — Console de pilotage',
  description: 'Orchestrez vos flux comptables Web3 : simulation, écriture, réconciliation et ancrage sécurisé.',
}

export default function RootLayout({ children }) {
  const currentYear = new Date().getFullYear()

  return (
    <html lang="fr">
      <body className="bg-slate-100 font-sans text-slate-900 antialiased">
        <div className="min-h-screen bg-slate-100">
          <header className="relative isolate overflow-hidden bg-[#0B1F3A] py-16 text-white shadow-xl">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-20 top-12 h-64 w-64 rounded-full bg-sky-500/40 blur-3xl" />
              <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-emerald-400/30 blur-3xl" />
            </div>
            <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-6 md:px-10 lg:px-12">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-100/80">
                  Console finance publique
                </p>
                <h1 className="mt-4 text-3xl font-semibold md:text-4xl lg:text-5xl">Compta publique on-chain</h1>
                <p className="mt-4 text-sm leading-relaxed text-sky-100/80">
                  Harmonisez transactions Web3 et obligations comptables avec une interface unique : simulez les flux, créez
                  les écritures, réconciliez les pièces et ancrez vos périodes en quelques clics.
                </p>
              </div>
            </div>
          </header>

          <main className="relative -mt-16 pb-20">
            <div className="mx-auto max-w-6xl px-6 md:px-10 lg:px-12">
              <div className="rounded-[2.5rem] bg-white/95 px-6 py-10 shadow-xl shadow-slate-200/70 backdrop-blur-sm md:px-10 md:py-12">
                {children}
              </div>
            </div>
          </main>

          <footer className="mx-auto mt-10 max-w-6xl px-6 pb-12 text-xs text-slate-500 md:px-10 lg:px-12">
            © {currentYear} Compta on-chain — Prototype confidentiel.
          </footer>
        </div>
      </body>
    </html>
  )
}
