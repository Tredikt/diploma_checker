import { CopyValue } from '@/shared/ui/data/CopyValue'

interface HashValueProps {
  value: string
  className?: string
}

const MAX_VISIBLE_HASH_LENGTH = 20

function getVisibleHash(value: string) {
  if (value.length <= MAX_VISIBLE_HASH_LENGTH) {
    return value
  }

  return `${value.slice(0, MAX_VISIBLE_HASH_LENGTH)}...`
}

export function HashValue({ value, className }: HashValueProps) {
  return (
    <CopyValue
      className={className}
      copyLabel="verification hash"
      title={value}
      value={value}
      visibleValue={getVisibleHash(value)}
    />
  )
}
