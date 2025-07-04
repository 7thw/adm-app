"use client"

import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { useQuery } from "convex/react"
import { AlertCircle } from "lucide-react"
import { DataTable } from "./_components/data-table"
import { SectionCards } from "./_components/section-cards"
// import { schema } from "./_components/data-table"  // Import the schema

export default function MediasPage() {
  // Use the medias query from the API - default values now handled server-side
  const mediaData = useQuery(api.admin.listCoreMedias, {});

  // Note: Authentication is handled by middleware and backend functions

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />


      {/* Always render the DataTable component, even when there are no media files */}
      <DataTable data={mediaData || []} />
    </div>
  )
}
