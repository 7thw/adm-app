"use client"

import { api } from "@/convex/_generated/api"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { AlertCircle, Loader2 } from "lucide-react"
import { DataTable } from "./_components/data-table"
import { SectionCards } from "./_components/section-cards"

export default function MediasPage() {
  const { isSignedIn, isLoaded } = useUser()

  // Use the working getAllMedia query - Convex functions handle admin authorization
  const mediaResponse = useQuery(api.media.getAllMedia, isSignedIn ? {} : "skip");

  // Process the data to ensure it matches the expected schema
  const mediaData = (mediaResponse || []).map(item => ({
    _id: item._id,
    title: item.title || "",
    mediaType: item.mediaType || "",
    mediaUrl: item.mediaUrl || "",
    duration: item.duration || 0, // Ensure duration is never undefined
    createdAt: item.createdAt || item._creationTime || 0,
    updatedAt: item.updatedAt || 0,
    description: item.description,
    thumbnailUrl: item.thumbnailUrl,
    fileSize: item.fileSize,
    contentType: item.contentType,
    uploadKey: item.uploadKey,
    userId: item.userId,
    uploadStatus: item.uploadStatus,
    _creationTime: item._creationTime
  }));

  // Debug logging
  console.log("Media response from Convex:", mediaResponse);
  console.log("Processed media data:", mediaData);

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


      {mediaData && mediaData.length > 0 ? (
        <DataTable data={mediaData} />
      ) : (
        <div className="p-8 text-center border border-dashed rounded-lg">
          <p className="text-muted-foreground mb-2">No media files found</p>
          <p className="text-sm text-muted-foreground">Upload your first media file to get started</p>
        </div>
      )}
    </div>
  )
}
