import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Укажите корректный email.'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов.'),
})

export const universityRegistrationSchema = z.object({
  code: z.string().min(3, 'Код ВУЗа должен содержать минимум 3 символа.').max(50, 'Слишком длинный код.'),
  name: z.string().min(2, 'Укажите название организации.').max(255, 'Слишком длинное название.'),
  email: z.string().email('Укажите корректный email.'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов.').max(128, 'Пароль слишком длинный.'),
  public_key: z.string().max(5000, 'Публичный ключ слишком длинный.').optional().or(z.literal('')),
})

export const companyRegistrationSchema = z.object({
  company_name: z.string().min(2, 'Укажите название компании.').max(255, 'Слишком длинное название компании.'),
  email: z.string().email('Укажите корректный email.'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов.').max(128, 'Пароль слишком длинный.'),
})

export const studentRegistrationSchema = z.object({
  email: z.string().email('Укажите корректный email.'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов.').max(128, 'Пароль слишком длинный.'),
  last_name: z.string().min(2, 'Укажите фамилию.').max(100, 'Слишком длинная фамилия.'),
  first_name: z.string().min(2, 'Укажите имя.').max(100, 'Слишком длинное имя.'),
  patronymic: z.string().max(100, 'Слишком длинное отчество.').optional().or(z.literal('')),
  diploma_number: z.string().min(5, 'Номер диплома должен содержать минимум 5 символов.').max(50, 'Слишком длинный номер диплома.'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type UniversityRegistrationFormValues = z.infer<typeof universityRegistrationSchema>
export type CompanyRegistrationFormValues = z.infer<typeof companyRegistrationSchema>
export type StudentRegistrationFormValues = z.infer<typeof studentRegistrationSchema>
