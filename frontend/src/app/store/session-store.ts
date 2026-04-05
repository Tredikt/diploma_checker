import { create } from 'zustand'

import type { SessionState, UserProfile, UserRole } from '@/shared/types/auth'

interface SessionStore extends SessionState {
  setSession: (session: Partial<SessionState>) => void
  clearSession: () => void
  setPendingRole: (role: UserRole | null) => void
  setProfile: (profile: UserProfile | null) => void
  finishBootstrap: () => void
  beginBootstrap: () => void
}

const initialState: SessionState = {
  accessToken: null,
  userId: null,
  role: null,
  isAuthenticated: false,
  pendingRole: 'student',
  isBootstrapping: true,
  profile: null,
}

export const useSessionStore = create<SessionStore>((set) => ({
  ...initialState,
  setSession: (session) =>
    set((state) => ({
      ...state,
      ...session,
      isAuthenticated: Boolean(session.accessToken ?? state.accessToken),
    })),
  clearSession: () =>
    set({
      ...initialState,
      isBootstrapping: false,
    }),
  setPendingRole: (role) => set({ pendingRole: role }),
  setProfile: (profile) => set({ profile }),
  beginBootstrap: () => set({ isBootstrapping: true }),
  finishBootstrap: () => set({ isBootstrapping: false }),
}))
