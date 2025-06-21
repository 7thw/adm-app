"use client"
import ConvexProviderWithClerk from "@/components/ConvexClientProvider";
import { UserProfile } from "@clerk/nextjs";

const UserProfilePage = () => {
  return (
    <ConvexProviderWithClerk>
      <div className="h-full flex items-center justify-center p-9">
        <UserProfile path="/user-profile" routing="path" />
      </div>
    </ConvexProviderWithClerk>
  )
}


export default UserProfilePage;
