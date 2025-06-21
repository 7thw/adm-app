import { PricingTable } from '@clerk/nextjs'

export default function Page() {
  return (
    <PricingTable
      newSubscriptionRedirectUrl="https://my-app-url.com/dashboard"
    />
  )
}
