import ConvexProviderWithClerk from "@/components/ConvexClientProvider";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <ConvexProviderWithClerk>
      <div className="flex min-w-screen justify-center my-[5rem]">
        <SignUp fallbackRedirectUrl="/" signInUrl="/sign-in" />
      </div>
    </ConvexProviderWithClerk>
  );
}
