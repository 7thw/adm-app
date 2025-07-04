"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { CorePlaylistBuilder } from "../_components/core-playlist-builder"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface CorePlaylistPageProps {
  params: {
    corePlaylistId: string
  }
}

export default function CorePlaylistPage({ params }: CorePlaylistPageProps) {
  const router = useRouter()
  const corePlaylistId = params.corePlaylistId as Id<"corePlaylists">

  // Fetch all playlists from Convex and filter client-side for the specific playlist
  const playlists = useQuery(api.admin.listCorePlaylists, {}) || []
  const corePlaylist = playlists.find((p) => p._id === corePlaylistId)

  // Mock data for Core Sections (until we have the actual Convex queries)
  const mockCoreSections = [
    {
      coreSectionId: "section-1",
      coreSectionTitle: "Opening Meditation",
      coreSectionType: "meditation",
      isRequired: true,
      minSelectMedia: 1,
      maxSelectMedia: 1,
      order: 1,
      coreMediaItems: [
        {
          coreMediaId: "media-1",
          coreMediaTitle: "Breath Awareness Introduction",
          coreMediaType: "audio",
          duration: 300,
          order: 1,
        },
        {
          coreMediaId: "media-2", 
          coreMediaTitle: "Body Scan Preparation",
          coreMediaType: "audio",
          duration: 180,
          order: 2,
        }
      ]
    },
    {
      coreSectionId: "section-2",
      coreSectionTitle: "Core Practice",
      coreSectionType: "practice",
      isRequired: true,
      minSelectMedia: 2,
      maxSelectMedia: 5,
      order: 2,
      coreMediaItems: [
        {
          coreMediaId: "media-3",
          coreMediaTitle: "Mindful Movement Sequence",
          coreMediaType: "video",
          duration: 900,
          order: 1,
        }
      ]
    },
    {
      coreSectionId: "section-3",
      coreSectionTitle: "Integration",
      coreSectionType: "reflection",
      isRequired: false,
      minSelectMedia: 0,
      maxSelectMedia: 3,
      order: 3,
      coreMediaItems: []
    }
  ]

  // Handle adding new Core Section
  const handleAddCoreSection = () => {
    toast.info("Add Core Section functionality coming soon")
    // TODO: Implement add core section logic
  }

  // Handle Core Section reordering
  const handleUpdateCoreSections = (updatedCoreSections: any[]) => {
    console.log("Reordering Core Sections:", updatedCoreSections)
    toast.success("Core Sections reordered successfully")
    // TODO: Implement Convex mutation to update section order
  }

  // Handle Core Media Item reordering within sections
  const handleUpdateCoreMediaItems = (coreSectionId: string, coreMediaItems: any[]) => {
    console.log(`Reordering media items in section ${coreSectionId}:`, coreMediaItems)
    toast.success("Media items reordered successfully")
    // TODO: Implement Convex mutation to update media item order
  }

  if (corePlaylist === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading Core Playlist...</span>
        </div>
      </div>
    )
  }

  if (corePlaylist === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-xl font-semibold mb-2">Core Playlist not found</h2>
        <p className="text-muted-foreground mb-4">
          The Core Playlist you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => router.push("/dashboard/core-playlists")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Core Playlists
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/core-playlists")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Core Playlists
        </Button>
      </div>

      {/* Core Playlist Builder */}
      <CorePlaylistBuilder
        corePlaylistId={corePlaylistId}
        corePlaylistTitle={corePlaylist.title}
        coreSections={mockCoreSections}
        onAddCoreSection={handleAddCoreSection}
        onUpdateCoreSections={handleUpdateCoreSections}
        onUpdateCoreMediaItems={handleUpdateCoreMediaItems}
      />
    </div>
  )
}
