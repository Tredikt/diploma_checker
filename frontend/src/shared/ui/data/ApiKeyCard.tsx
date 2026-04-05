import type { CompanyApiKeyListItem } from '@/shared/types/company'

interface ApiKeyCardProps {
  item: CompanyApiKeyListItem
  onRevoke: () => void
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Не использовался'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' }).format(date)
}

export function ApiKeyCard({ item, onRevoke }: ApiKeyCardProps) {
  const title = item.key_label?.trim() ? item.key_label : 'Ключ без названия'

  return (
    <tr className="border-b border-[var(--line-subtle)] last:border-b-0">
      <td className="px-4 py-4 align-top">
        <div className="min-w-0 space-y-1">
          <div className="truncate text-sm font-semibold text-[var(--text-primary)]" title={title}>
            {title}
          </div>
          <div className="text-xs text-[var(--text-muted)]">{item.is_active ? 'Активен' : 'Отозван'}</div>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-4 align-top text-sm text-[var(--text-secondary)]">{formatDate(item.created_at)}</td>
      <td className="whitespace-nowrap px-4 py-4 align-top text-sm text-[var(--text-secondary)]">{formatDate(item.last_used_at)}</td>
      <td className="px-4 py-4 align-top">
        <button
          className="rounded-full border border-[rgba(178,79,67,0.24)] px-3 py-2 text-xs font-semibold text-[var(--danger)] transition hover:bg-[rgba(178,79,67,0.06)] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!item.is_active}
          onClick={onRevoke}
          type="button"
        >
          {item.is_active ? 'Отозвать' : 'Отозван'}
        </button>
      </td>
    </tr>
  )
}
