"use client"

import { SignIn, SignUp, SignOutButton, useUser } from '@clerk/nextjs'
import { Authenticated, Unauthenticated } from 'convex/react'
import { cn } from '@/lib/utils'

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Unauthenticated>
        <SignIn 
          routing="hash"
          redirectUrl="/"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg"
            }
          }}
        />
      
      </Unauthenticated>
      
      <Authenticated>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">You're successfully signed in.</p>
        </div>
      </Authenticated>
    </div>
  )
}
