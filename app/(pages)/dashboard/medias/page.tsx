"use client"

import { api } from "@/convex/_generated/api"
import { useQuery } from "convex/react"
import { DataTable } from "./_components/data-table"
import { SectionCards } from "./_components/section-cards"

export default function mediasPage() {
  // Fetch media data from Convex
  const mediaDataRaw = useQuery(api.media.getMedia);

  // Debug logging
  console.log("Raw media data from Convex:", mediaDataRaw);

  // Process data for the DataTable component
  const mediaData = mediaDataRaw ? mediaDataRaw.map((item: any) => ({
    ...item,
    // Ensure _id is properly formatted as a string for the DataTable
    _id: item._id.toString()
  })) : [];

  // More debug logging
  console.log("Processed media data for DataTable:", mediaData);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

      <SectionCards />
      {mediaData.length > 0 ? (
        <DataTable data={mediaData} />
      ) : (
        <div className="p-4 text-center">
          <p className="text-muted-foreground">No media data available. Check console for debugging information.</p>
        </div>
      )}
    </div>
  )
}
