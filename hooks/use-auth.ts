"use client"

import { useUser } from '@clerk/nextjs'
import { useConvexAuth } from 'convex/react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useEffect } from 'react'

export function useAuth() {
  const { isLoaded: clerkLoaded, isSignedIn, user } = useUser()
  const { isLoading: convexLoading, isAuthenticated } = useConvexAuth()
  const storeUser = useMutation(api.users.store)

  // Store user in Convex when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      storeUser().catch(console.error)
    }
  }, [isAuthenticated, user, storeUser])

  return {
    isLoading: !clerkLoaded || convexLoading,
    isAuthenticated: isSignedIn && isAuthenticated,
    user,
    clerkUser: user,
  }
}

export default useAuth