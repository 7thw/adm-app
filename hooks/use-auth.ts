"use client"

import { useUser } from '@clerk/nextjs'
import { useConvexAuth } from 'convex/react'


/**
 * Custom hook for authentication state management
 * Combines Clerk and Convex auth states
 * User data is synced from Clerk to Convex via webhooks
 */
export function useAuth() {
  const { isLoaded: clerkLoaded, isSignedIn, user } = useUser()
  const { isLoading: convexLoading, isAuthenticated } = useConvexAuth()
  
  // User data is synchronized through Clerk webhooks to Convex
  // We don't need to explicitly sync on client-side anymore

  return {
    isLoading: !clerkLoaded || convexLoading,
    isAuthenticated: isSignedIn && isAuthenticated,
    user,
    clerkUser: user,
  }
}

export default useAuth