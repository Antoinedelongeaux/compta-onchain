export default function Card({ title, children }) {
  const resolvedTitle = (() => {
    if (!title) return null
    if (typeof title === 'string') {
      return <h2 className="text-lg font-semibold text-white">{title}</h2>
    }
    return title
  })()

  return (
    <section className="overflow-hidden rounded-3xl border border-white/12 bg-white/[0.04] shadow-[0_18px_60px_-35px_rgba(15,23,42,0.9)] backdrop-blur-sm">
      {resolvedTitle && (
        <header className="bg-white/[0.08] px-6 py-5 text-slate-100">
          <div className="text-sm leading-6">{resolvedTitle}</div>
        </header>
      )}
      <div className="space-y-4 px-6 py-5 text-sm text-slate-200/85">{children}</div>
    </section>
  )
}
