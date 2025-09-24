import './globals.css'
import Panel from '@/components/panel'

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
          <Panel />

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
