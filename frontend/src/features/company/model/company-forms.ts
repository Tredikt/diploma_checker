import { z } from 'zod'

export const companyVerificationSearchSchema = z.object({
  university_code: z.string().trim().min(2, 'Укажите код ВУЗа.').max(64, 'Слишком длинный код ВУЗа.'),
  diploma_number: z.string().trim().min(2, 'Укажите номер диплома.').max(128, 'Слишком длинный номер диплома.'),
})

export const companyApiKeyCreateSchema = z.object({
  key_label: z.string().trim().min(2, 'Укажите название ключа.').max(120, 'Слишком длинное название ключа.').nullable().optional(),
})

export type CompanyVerificationSearchFormValues = z.infer<typeof companyVerificationSearchSchema>
export type CompanyApiKeyCreateFormValues = z.infer<typeof companyApiKeyCreateSchema>
