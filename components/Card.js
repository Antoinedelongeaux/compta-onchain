const THEME_STYLES = {
  dark: {
    container: "bg-slate-900 text-slate-100",
    header: "bg-slate-800/80 text-slate-100",
    body: "text-slate-200",
    title: "text-white",
  },
  light: {
    container: "bg-white/90 shadow-lg shadow-slate-200/60 backdrop-blur-sm",
    header: "bg-gradient-to-r from-white/70 to-white text-slate-900",
    body: "text-slate-600",
    title: "text-slate-900",
  },
}

export default function Card({ title, children, theme = "light" }) {
  const { container, header, body, title: titleClass } =
    THEME_STYLES[theme] ?? THEME_STYLES.dark

  const resolvedTitle = (() => {
    if (!title) return null
    if (typeof title === "string") {
      return (
        <h2 className={`text-lg font-semibold ${titleClass}`}>
          {title}
        </h2>
      )
    }
    return title
  })()

  return (
    <section
      className={`overflow-hidden rounded-3xl ${container}`}
    >
      {resolvedTitle && (
        <header className={`px-6 py-5 ${header}`}>
          <div className="text-sm leading-6">{resolvedTitle}</div>
        </header>
      )}
      <div className={`space-y-4 px-6 py-5 text-sm ${body}`}>
        {children}
      </div>
    </section>
  )
}
