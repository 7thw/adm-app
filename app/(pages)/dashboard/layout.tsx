"use client"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import { AppSidebar } from "./_components/app-sidebar"
import { SiteHeader } from "./_components/site-header"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Map routes to page titles
  const titleMap: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/dashboard/medias": "Medias",
    "/dashboard/core-playlists": "Playlists",
    "/dashboard/plans": "Subscription Plans",
    "/dashboard/subscribers": "Subscribers",
  }

  const title = titleMap[pathname] || "Dashboard"

  return (
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
        <SiteHeader title={title} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
