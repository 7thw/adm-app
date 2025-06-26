"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"

export default function AccessDeniedPage() {
  const { user } = useUser()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="max-w-md w-full border-red-200 bg-red-50">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-800">
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-red-700">
            This application is restricted to administrators only.
          </p>
          
          {user?.emailAddresses?.[0]?.emailAddress && (
            <div className="bg-white p-3 rounded border border-red-200">
              <p className="text-sm text-gray-600">Current user:</p>
              <p className="font-medium text-gray-800">
                {user.emailAddresses[0].emailAddress}
              </p>
            </div>
          )}
          
          <p className="text-sm text-red-600">
            If you believe you should have access, please contact your administrator.
          </p>
          
          <div className="pt-4">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/sign-in">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Sign In with Different Account
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
