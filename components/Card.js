export default function Card({ title, children, theme = "dark" }) {
  const isDark = theme === "dark"
  console.log("Theme : ",isDark)

  const resolvedTitle = (() => {
    if (!title) return null
    if (typeof title === "string") {
      return (
        <h2
          className={`text-lg font-semibold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {title}
        </h2>
      )
    }
    return title
  })()

  return (
    <section
      className={`overflow-hidden rounded-3xl border shadow-lg backdrop-blur-sm ${
        isDark
          ? "border-white/12 bg-slate-900"
          : "border-gray-300 bg-white"
      }`}
    >
      {resolvedTitle && (
        <header
          className={`px-6 py-5 ${
            isDark
              ? "bg-slate-800 text-slate-100"
              : "bg-gray-100 text-gray-900"
          }`}
        >
          <div className="text-sm leading-6">{resolvedTitle}</div>
        </header>
      )}
      <div
        className={`space-y-4 px-6 py-5 text-sm ${
          isDark ? "text-slate-200" : "text-gray-700"
        }`}
      >
        {children}
      </div>
    </section>
  )
}
