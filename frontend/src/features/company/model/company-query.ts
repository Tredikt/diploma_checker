const companyAllQueryKey = ['company'] as const

export const companyQueryKeys = {
  all: companyAllQueryKey,
  verification: [...companyAllQueryKey, 'verification'] as const,
  apiKeys: (limit: number, offset: number) => [...companyAllQueryKey, 'api-keys', limit, offset] as const,
  limits: [...companyAllQueryKey, 'limits'] as const,
}
