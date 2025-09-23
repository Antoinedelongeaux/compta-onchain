export default function Card({ title, children }) {
  const resolvedTitle = (() => {
    if (!title) return null
    if (typeof title === 'string') {
      return <h2 className="text-xl font-semibold text-white">{title}</h2>
    }
    return title
  })()

  return (
    <section className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-6 shadow-[0_25px_60px_-35px_rgba(56,246,198,0.7)] transition duration-300 hover:border-emerald-300/60 hover:shadow-[0_35px_80px_-40px_rgba(96,165,250,0.65)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 via-transparent to-sky-500/20" />
      </div>
      {resolvedTitle && <div className="mb-6 flex items-start justify-between gap-4">{resolvedTitle}</div>}
      <div className="space-y-5 text-sm text-slate-200/80">{children}</div>
    </section>
  )
}
