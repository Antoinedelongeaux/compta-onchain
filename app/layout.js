export const metadata = { title: 'Compta on-chain (MVP)', description: 'MVP publication comptable on-chain' }

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="mx-auto max-w-5xl p-6">
          <header className="mb-8">
            <h1 className="text-2xl font-bold">Compta publique on-chain — MVP</h1>
            <p className="text-sm text-gray-600">Simulation on-chain + écriture + réconciliation + ancrage</p>
          </header>
          {children}
          <footer className="mt-12 text-xs text-gray-500">© {new Date().getFullYear()} — MVP</footer>
        </div>
      </body>
    </html>
  )
}
