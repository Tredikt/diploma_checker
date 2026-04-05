import { Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'

import { AppShellLayout } from '@/app/layouts/AppShellLayout'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { AppHomeRedirect } from '@/app/router/AppHomeRedirect'
import { RoleRoute } from '@/app/router/RoleRoute'
import { RouteGuard } from '@/app/router/RouteGuard'
import { LoadingState } from '@/shared/ui/states/LoadingState'

function withSuspense(node: ReactNode) {
  return <Suspense fallback={<LoadingState title="Подготавливаем интерфейс" />}>{node}</Suspense>
}

const routerFallback = <LoadingState title="Загружаем маршрут" />

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/auth/login" replace />,
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        lazy: async () => {
          const module = await import('@/pages/auth/LoginPage')
          return { Component: module.LoginPage }
        },
      },
      {
        path: 'register/:role',
        lazy: async () => {
          const module = await import('@/pages/auth/RegisterPage')
          return { Component: module.RegisterPage }
        },
      },
      {
        path: 'registration-complete',
        lazy: async () => {
          const module = await import('@/pages/auth/RegistrationCompletePage')
          return { Component: module.RegistrationCompletePage }
        },
      },
      {
        path: 'pending-review',
        lazy: async () => {
          const module = await import('@/pages/auth/PendingReviewPage')
          return { Component: module.PendingReviewPage }
        },
      },
    ],
    HydrateFallback: () => routerFallback,
  },
  {
    path: '/verify/:token?',
    lazy: async () => {
      const module = await import('@/pages/public-verify/PublicVerifyPage')
      return { Component: module.PublicVerifyPage }
    },
    HydrateFallback: () => routerFallback,
  },
  {
    path: '/app',
    element: (
      <RouteGuard>
        <AppShellLayout>
          <Outlet />
        </AppShellLayout>
      </RouteGuard>
    ),
    children: [
      {
        index: true,
        element: <AppHomeRedirect />,
      },
      {
        path: 'university',
        element: (
          <RoleRoute role="university">
            <Outlet />
          </RoleRoute>
        ),
        children: [
          {
            path: 'registry',
            lazy: async () => {
              const module = await import('@/pages/university/UniversityRegistryPage')
              return { Component: module.UniversityRegistryPage }
            },
          },
          {
            path: 'import',
            lazy: async () => {
              const module = await import('@/pages/university/UniversityImportPage')
              return { Component: module.UniversityImportPage }
            },
          },
          {
            path: 'create',
            lazy: async () => {
              const module = await import('@/pages/university/UniversityCreateDiplomaPage')
              return { Component: module.UniversityCreateDiplomaPage }
            },
          },
          {
            path: 'diploma/:verificationHash',
            lazy: async () => {
              const module = await import('@/pages/university/UniversityDiplomaDetailPage')
              return { Component: module.UniversityDiplomaDetailPage }
            },
          },
        ],
      },
      {
        path: 'company',
        element: (
          <RoleRoute role="company">
            <Outlet />
          </RoleRoute>
        ),
        children: [
          {
            path: 'verification',
            lazy: async () => {
              const module = await import('@/pages/company/CompanyVerificationPage')
              return { Component: module.CompanyVerificationPage }
            },
          },
          {
            path: 'api-keys',
            lazy: async () => {
              const module = await import('@/pages/company/CompanyApiKeysPage')
              return { Component: module.CompanyApiKeysPage }
            },
          },
          {
            path: 'limits',
            lazy: async () => {
              const module = await import('@/pages/company/CompanyLimitsPage')
              return { Component: module.CompanyLimitsPage }
            },
          },
        ],
      },
      {
        path: 'student',
        element: (
          <RoleRoute role="student">
            <Outlet />
          </RoleRoute>
        ),
        children: [
          {
            path: 'home',
            lazy: async () => {
              const module = await import('@/pages/student/StudentHomePage')
              return { Component: module.StudentHomePage }
            },
          },
        ],
      },
    ],
  },
  {
    path: '*',
    lazy: async () => {
      const module = await import('@/shared/ui/states/NotFoundState')
      return {
        Component: () => withSuspense(<module.NotFoundState />),
      }
    },
  },
])
