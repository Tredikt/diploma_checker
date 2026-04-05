interface FileFieldProps {
  label: string
  hint?: string
  error?: string
  accept?: string
  onChange: (file: File | null) => void
}

export function FileField({ label, hint, error, accept, onChange }: FileFieldProps) {
  return (
    <label className="block space-y-3">
      <span className="text-sm font-semibold text-[var(--text-primary)]">{label}</span>
      <div className="rounded-[24px] border border-dashed border-[var(--line-strong)] bg-white/60 p-5 transition hover:border-[var(--accent)] hover:bg-white/70">
        <input
          accept={accept}
          className="block w-full text-sm text-[var(--text-secondary)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--bg-ink)] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white"
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
          type="file"
        />
      </div>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : hint ? <p className="text-sm text-[var(--text-muted)]">{hint}</p> : null}
    </label>
  )
}
