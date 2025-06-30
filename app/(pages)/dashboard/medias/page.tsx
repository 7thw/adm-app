"use client"

import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { AlertCircle, Loader2 } from "lucide-react"
import { DataTable } from "./_components/data-table"
import { SectionCards } from "./_components/section-cards"
import { schema } from "./_components/data-table"

export default function MediasPage() {
  const { isSignedIn, isLoaded } = useUser()

  // Use the medias query from the API
  const mediaResponse = useQuery(api.admin.listMedias, isSignedIn ? {} : "skip");

  // Process the data to ensure it matches the expected schema
  const mediaData = (mediaResponse || []).map(item => ({
    _id: item._id,
    title: item.title || "",
    mediaType: item.mediaType || "audio", // Default to audio if not specified
    // Generate URLs from storage IDs or use embed URLs
    duration: item.duration || 0, // Ensure duration is never undefined
    description: item.description,
    thumbnailUrl: item.thumbnailUrl || undefined, // Convert null to undefined
    fileSize: item.fileSize,
    contentType: item.contentType,
    storageId: item.storageId,
    embedUrl: item.embedUrl,
    youtubeId: item.youtubeId,
    thumbnailStorageId: item.thumbnailStorageId,
    processingStatus: item.processingStatus || "completed",
    transcript: item.transcript,
    waveformData: item.waveformData,
    quality: item.quality,
    bitrate: item.bitrate,
    uploadedBy: item.uploadedBy,
    isPublic: item.isPublic,
    _creationTime: item._creationTime
  }));

  // Debug logging removed for production

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // Authentication required
  if (!isSignedIn) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-center p-8">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <span className="ml-2 text-destructive">Authentication required</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />


      {/* Always render the DataTable component, even when there are no media files */}
      <DataTable data={mediaData || []} />
    </div>
  )
}
