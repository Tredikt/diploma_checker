const studentAllQueryKey = ['student'] as const

export const studentQueryKeys = {
  all: studentAllQueryKey,
  list: (limit: number, offset: number) => [...studentAllQueryKey, 'diplomas', limit, offset] as const,
  detail: (diplomaId: string) => [...studentAllQueryKey, 'diplomas', diplomaId] as const,
  tokens: (diplomaId: string, limit: number, offset: number) =>
    [...studentAllQueryKey, 'diplomas', diplomaId, 'tokens', limit, offset] as const,
  tokenQr: (tokenId: string) => [...studentAllQueryKey, 'access-tokens', tokenId, 'qr'] as const,
}
