import { z } from 'zod'

export const createUniversityDiplomaSchema = z.object({
  full_name: z.string().trim().min(3, 'Укажите ФИО полностью.'),
  year: z.coerce
    .number({ invalid_type_error: 'Укажите год выпуска.' })
    .int('Год выпуска должен быть целым числом.')
    .min(1950, 'Год выпуска должен быть не раньше 1950.')
    .max(2100, 'Проверьте год выпуска.'),
  specialty: z.string().trim().min(2, 'Укажите специальность.'),
  diploma_number: z
    .string()
    .trim()
    .min(4, 'Укажите номер диплома.')
    .max(64, 'Номер диплома слишком длинный.'),
})

export type CreateUniversityDiplomaFormValues = z.infer<typeof createUniversityDiplomaSchema>
