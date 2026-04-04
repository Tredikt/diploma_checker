export const universityQueryKeys = {
  all: ['university-diplomas'] as const,
  list: (limit: number, offset: number) => [...universityQueryKeys.all, 'list', limit, offset] as const,
  detail: (verificationHash: string) => [...universityQueryKeys.all, 'detail', verificationHash] as const,
}
