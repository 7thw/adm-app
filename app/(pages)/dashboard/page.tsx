"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { SignInButton, useClerk } from '@clerk/nextjs'
import { Authenticated, Unauthenticated } from 'convex/react'

import data from "./data.json"

export default function Page() {
  const { signOut } = useClerk()
  return (
    <>
      <Authenticated>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 72)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >

          <AppSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  <SectionCards />
                  <div className="px-4 lg:px-6">
                    <ChartAreaInteractive />
                    {/* Temporary Force Logout Button */}
                    <div className="mt-4 flex justify-center">
                      <Button
                        variant="destructive"
                        onClick={() => {
                          signOut(() => {
                            window.location.href = "/";
                          });
                        }}
                      >
                        Force Logout (Temporary)
                      </Button>
                    </div>
                  </div>
                  <DataTable data={data} />
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </Authenticated >
      <Unauthenticated>
        <SignInButton />
      </Unauthenticated>
    </>
  )
}
