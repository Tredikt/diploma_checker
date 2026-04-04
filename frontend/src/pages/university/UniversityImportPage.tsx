import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { importUniversityDiplomas } from '@/features/university/api/university-api'
import { universityQueryKeys } from '@/features/university/model/university-query'
import { getApiErrorMessage } from '@/shared/api/http-client'
import { DataTableCard } from '@/shared/ui/data/DataTableCard'
import { InlineMetric } from '@/shared/ui/data/InlineMetric'
import { InfoCard } from '@/shared/ui/feedback/InfoCard'
import { PageSection } from '@/shared/ui/feedback/PageSection'
import { FileField } from '@/shared/ui/forms/FileField'
import { FormMessage } from '@/shared/ui/forms/FormMessage'
import { EmptyState } from '@/shared/ui/states/EmptyState'

export function UniversityImportPage() {
  const queryClient = useQueryClient()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const importMutation = useMutation({
    mutationFn: importUniversityDiplomas,
    onSuccess: () => {
      setLocalError(null)
      void queryClient.invalidateQueries({ queryKey: universityQueryKeys.all })
    },
    onError: (error) => {
      setLocalError(getApiErrorMessage(error, 'Не удалось обработать файл. Проверьте формат и повторите попытку.'))
    },
  })

  function handleSubmit() {
    if (!selectedFile) {
      setLocalError('Выберите CSV или Excel файл для загрузки.')
      return
    }

    setLocalError(null)
    importMutation.mutate(selectedFile)
  }

  return (
    <div className="space-y-6">
      <PageSection
        eyebrow="Registry Import"
        title="Импорт реестра"
        description="Пакетная загрузка файла с итогом обработки."
        aside={<InfoCard description="Поддерживаются CSV, XLSX и XLS." label="Формат" title="Импорт реестра" tone="accent" />}
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <DataTableCard
          actions={
            <button
              className="rounded-full bg-[var(--bg-ink)] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-[var(--bg-ink-soft)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={importMutation.isPending}
              onClick={handleSubmit}
              type="button"
            >
              {importMutation.isPending ? 'Загружаем...' : 'Запустить импорт'}
            </button>
          }
          description="Файл для пакетной загрузки дипломов."
          title="Файл реестра"
        >
          <div className="space-y-5">
            <FileField
              accept=".csv,.xlsx,.xls"
              hint="Форматы: CSV, XLSX, XLS."
              label="Выберите файл"
              onChange={setSelectedFile}
            />

            {selectedFile ? (
              <div className="grid gap-4 md:grid-cols-2">
                <InlineMetric label="Файл" value={selectedFile.name} />
                <InlineMetric label="Размер" value={`${Math.max(1, Math.round(selectedFile.size / 1024))} KB`} />
              </div>
            ) : (
              <EmptyState
                description="После выбора файла здесь появится сводка."
                hint="Используйте файл только с данными реестра."
                title="Файл ещё не выбран"
              />
            )}

            {localError ? <FormMessage message={localError} tone="error" /> : null}
          </div>
        </DataTableCard>

        <DataTableCard description="Итог обработки файла." title="Результат импорта">
          {importMutation.data ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <InlineMetric label="Создано записей" value={String(importMutation.data.created)} />
                <InlineMetric label="Ошибок строк" value={String(importMutation.data.errors.length)} />
              </div>

              {importMutation.data.errors.length > 0 ? (
                <div className="rounded-[24px] border border-[var(--line-subtle)] bg-white/50 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Проблемные строки</h3>
                  <div className="mt-4 space-y-3">
                    {importMutation.data.errors.map((error) => (
                      <div className="rounded-[18px] border border-[rgba(178,79,67,0.18)] bg-[rgba(178,79,67,0.05)] px-4 py-3" key={`${error.row_number}-${error.detail}`}>
                        <div className="text-sm font-semibold text-[var(--text-primary)]">Строка {error.row_number}</div>
                        <div className="mt-1 text-sm text-[var(--text-secondary)]">{error.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <FormMessage message="Импорт завершён без ошибок строк." tone="success" />
              )}
            </div>
          ) : (
            <EmptyState
              description="Результат появится после запуска импорта."
              hint="Ошибки строк будут перечислены в этом блоке."
              title="Импорт ещё не запускался"
            />
          )}
        </DataTableCard>
      </div>
    </div>
  )
}
