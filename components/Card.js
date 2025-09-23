const THEME_STYLES = {
  dark: {
    container: "border-white/12 bg-slate-900",
    header: "bg-slate-800 text-slate-100",
    body: "text-slate-200",
    title: "text-white",
  },
  light: {
    container: "border-gray-300 bg-white",
    header: "bg-gray-100 text-gray-900",
    body: "text-gray-700",
    title: "text-gray-900",
  },
}

export default function Card({ title, children, theme = "dark" }) {
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
      className={`overflow-hidden rounded-3xl border shadow-lg backdrop-blur-sm ${container}`}
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
