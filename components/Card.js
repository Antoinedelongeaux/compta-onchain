export default function Card({ title, children }) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm p-4">
      {title && <h2 className="mb-3 text-lg font-semibold">{title}</h2>}
      {children}
    </div>
  )
}
