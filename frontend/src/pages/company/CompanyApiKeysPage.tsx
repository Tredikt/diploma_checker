import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'

import { createCompanyApiKey, getCompanyApiKeys, revokeCompanyApiKey } from '@/features/company/api/company-api'
import { companyApiKeyCreateSchema, type CompanyApiKeyCreateFormValues } from '@/features/company/model/company-forms'
import { companyQueryKeys } from '@/features/company/model/company-query'
import type { CreateCompanyApiKeyResponse } from '@/shared/types/company'
import { getApiErrorMessage } from '@/shared/api/http-client'
import { ApiKeyCard } from '@/shared/ui/data/ApiKeyCard'
import { DataTableCard } from '@/shared/ui/data/DataTableCard'
import { CopyValue } from '@/shared/ui/data/CopyValue'
import { InfoCard } from '@/shared/ui/feedback/InfoCard'
import { PageSection } from '@/shared/ui/feedback/PageSection'
import { ResultBanner } from '@/shared/ui/feedback/ResultBanner'
import { FormField } from '@/shared/ui/forms/FormField'
import { FormMessage } from '@/shared/ui/forms/FormMessage'
import { InlineConfirmCard } from '@/shared/ui/overlay/InlineConfirmCard'
import { EmptyState } from '@/shared/ui/states/EmptyState'
import { LoadingState } from '@/shared/ui/states/LoadingState'

const PAGE_SIZE = 6

export function CompanyApiKeysPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null)
  const [createdKey, setCreatedKey] = useState<CreateCompanyApiKeyResponse | null>(null)
  const offset = Number(searchParams.get('offset') ?? '0')
  const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0

  const form = useForm<CompanyApiKeyCreateFormValues>({
    resolver: zodResolver(companyApiKeyCreateSchema),
    defaultValues: {
      key_label: '',
    },
  })

  const apiKeysQuery = useQuery({
    queryKey: companyQueryKeys.apiKeys(PAGE_SIZE, safeOffset),
    queryFn: () => getCompanyApiKeys({ limit: PAGE_SIZE, offset: safeOffset }),
  })

  const createMutation = useMutation({
    mutationFn: createCompanyApiKey,
    onSuccess: (result) => {
      setCreatedKey(result)
      form.reset({ key_label: '' })
      void queryClient.invalidateQueries({ queryKey: companyQueryKeys.all })
    },
  })

  const revokeMutation = useMutation({
    mutationFn: revokeCompanyApiKey,
    onSuccess: () => {
      setPendingRevokeId(null)
      void queryClient.invalidateQueries({ queryKey: companyQueryKeys.all })
    },
  })

  function setOffset(nextOffset: number) {
    setSearchParams(nextOffset > 0 ? { offset: String(nextOffset) } : {})
  }

  const handleSubmit = form.handleSubmit((values) => {
    createMutation.mutate({
      key_label: values.key_label?.trim() ? values.key_label.trim() : null,
    })
  })

  if (apiKeysQuery.isLoading) {
    return <LoadingState description="Подготавливаем список ключей и состояние интеграционного контура." title="Загружаем API-ключи" />
  }

  const data = apiKeysQuery.data
  const items = data?.items ?? []
  const hasNextPage = data ? data.offset + data.limit < data.total : false

  return (
    <div className="space-y-6">
      <PageSection
        eyebrow="Company API"
        title="API-ключи"
        description="Выпуск, просмотр и отзыв ключей компании в компактном рабочем контуре без лишней высоты и визуального шума."
        aside={
          <InfoCard
            description="Полный ключ показывается только сразу после создания. В списке остаются только операционный статус и даты."
            label="Правило"
            title="One-time reveal"
            tone="accent"
            footer={<Link className="text-sm font-semibold text-[var(--accent)]" to="/app/company/limits">Открыть лимиты</Link>}
          />
        }
      />

      {pendingRevokeId ? (
        <InlineConfirmCard
          confirmLabel="Отозвать ключ"
          description={`Ключ ${pendingRevokeId} будет отключён для новых интеграционных вызовов.`}
          isPending={revokeMutation.isPending}
          onCancel={() => setPendingRevokeId(null)}
          onConfirm={() => revokeMutation.mutate(pendingRevokeId)}
          title="Подтвердите отзыв ключа"
        />
      ) : null}

      <section className="space-y-4">
        <InfoCard
          description="Держите отдельный ключ на каждую интеграцию, чтобы отзыв не затрагивал остальные контуры."
          label="Практика"
          title="Как вести ключи"
          footer={
            <div className="space-y-2 text-sm leading-6 text-[var(--text-secondary)]">
              <div>1. Отдельный ключ для production и sandbox.</div>
              <div>2. Понятная метка по системе или окружению.</div>
              <div>3. Отзыв вместо ручного переиспользования общих ключей.</div>
            </div>
          }
        />

      </section>

      <section className="glass-panel rounded-[28px] p-5 md:p-7">
        <div className="grid gap-5 xl:grid-cols-[.4fr_.6fr] xl:items-center">
          <div className="max-w-2xl">
            <div className="eyebrow">Create Key</div>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">Новый ключ</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
              Используйте понятное имя под интеграцию, систему или окружение. Блок выровнен в одну линию на desktop и остаётся читабельным на mobile.
            </p>
          </div>

          <form className="flex w-full flex-col gap-3 sm:flex-row sm:items-center" onSubmit={handleSubmit}>
            <FormField
              className="sm:flex-1"
              error={form.formState.errors.key_label?.message}
              hint="Например: ATS production, CRM sandbox, HR portal."
              label="Название ключа"
              placeholder="ATS production"
              {...form.register('key_label')}
            />
            <button
              className="h-[52px] rounded-full bg-[var(--bg-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--bg-ink-soft)] disabled:cursor-not-allowed disabled:opacity-70 sm:shrink-0 sm:px-6"
              disabled={createMutation.isPending}
              type="submit"
            >
              {createMutation.isPending ? 'Выпускаем ключ...' : 'Создать ключ'}
            </button>
          </form>
        </div>

        {createMutation.isError ? (
          <div className="mt-4">
            <FormMessage message={getApiErrorMessage(createMutation.error, 'Не удалось создать ключ.')} tone="error" />
          </div>
        ) : null}

        {createdKey ? (
          <div className="mt-5 space-y-4">
            <ResultBanner
              description="Скопируйте ключ сейчас. После ухода со страницы он больше не будет показан."
              title="Ключ выпущен"
              tone="success"
            />
            <div className="rounded-[24px] border border-[rgba(45,122,87,0.2)] bg-[rgba(45,122,87,0.06)] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    {createdKey.key_label?.trim() ? createdKey.key_label : 'Полный ключ'}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    Единственный момент, когда полный ключ доступен без перевыпуска.
                  </div>
                </div>
                <CopyValue className="w-full md:w-auto md:max-w-full" copyLabel="api-ключ" value={createdKey.key} />
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <div className="grid gap-6">
        <section className="space-y-4">
          {apiKeysQuery.isError ? <FormMessage message={getApiErrorMessage(apiKeysQuery.error, 'Не удалось загрузить список ключей.')} tone="error" /> : null}

          {!apiKeysQuery.isError && items.length === 0 ? (
            <EmptyState
              description="После выпуска первый ключ появится в этом списке вместе с датой создания и статусом."
              hint="Список сразу готов к server-side pagination, даже если ключей пока немного."
              title="Ключей пока нет"
            />
          ) : null}

          {!apiKeysQuery.isError && items.length > 0 ? (
            <DataTableCard
              description="Список ключей компании в строковой таблице. Каждая строка показывает только операционные поля без лишних промежуточных блоков."
              title="Список ключей"
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--line-subtle)] text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      <th className="px-4 pb-3">Название</th>
                      <th className="px-4 pb-3">Создан</th>
                      <th className="px-4 pb-3">Последнее использование</th>
                      <th className="px-4 pb-3">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <ApiKeyCard item={item} key={item.id} onRevoke={() => setPendingRevokeId(item.id)} />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-col gap-3 rounded-[24px] border border-[var(--line-subtle)] bg-white/50 px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-[var(--text-secondary)]">
                  Показаны ключи {data ? data.offset + 1 : 0}-{data ? data.offset + items.length : items.length} из {data?.total ?? items.length}
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={safeOffset === 0}
                    onClick={() => setOffset(Math.max(safeOffset - PAGE_SIZE, 0))}
                    type="button"
                  >
                    Назад
                  </button>
                  <button
                    className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!hasNextPage}
                    onClick={() => setOffset(safeOffset + PAGE_SIZE)}
                    type="button"
                  >
                    Дальше
                  </button>
                </div>
              </div>
            </DataTableCard>
          ) : null}
        </section>
      </div>
    </div>
  )
}
