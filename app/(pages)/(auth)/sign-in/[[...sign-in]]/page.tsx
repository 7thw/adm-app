"use client"

import ConvexProviderWithClerk from "@/components/ConvexClientProvider";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <ConvexProviderWithClerk>
      <div className="flex min-w-screen justify-center my-[5rem]">
        <SignIn fallbackRedirectUrl="/" signUpUrl="/sign-up" />
      </div>
    </ConvexProviderWithClerk>
  );
}
