import { useEffect } from 'react'

import { getMyProfile, refreshSession } from '@/features/auth/api/auth-api'
import { useSessionStore } from '@/app/store/session-store'

let bootstrapStarted = false

async function runAuthBootstrap() {
  const { beginBootstrap, clearSession, finishBootstrap, setProfile, setSession } = useSessionStore.getState()
  beginBootstrap()

  try {
    const refreshResponse = await refreshSession()

    setSession({
      accessToken: refreshResponse.access_token,
    })

    const profile = await getMyProfile()

    setProfile(profile)
    setSession({
      accessToken: refreshResponse.access_token,
      userId: profile.id,
      role: profile.role,
      pendingRole: profile.role,
      isAuthenticated: true,
      profile,
    })
  } catch {
    clearSession()
  } finally {
    finishBootstrap()
  }
}

export function useAuthBootstrap() {
  useEffect(() => {
    if (bootstrapStarted) {
      return
    }

    bootstrapStarted = true
    void runAuthBootstrap()
  }, [])
}
