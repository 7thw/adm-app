"use client"

import { ArrowLeftIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Id } from "@/convex/_generated/dataModel"
import CorePlaylistForm from "../_components/playlist-form"

export default function NewCorePlaylistPage() {
  const router = useRouter()

  const handleSuccess = (corePlaylistId: Id<"corePlaylists">) => {
    // Redirect to the edit page immediately after successful creation
    router.push(`/dashboard/core-playlists/${corePlaylistId}/edit`)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/core-playlists">
            <Button variant="outline" size="icon">
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Create New Core Playlist</h1>
        </div>
      </div>

      <CorePlaylistForm
        onSuccess={handleSuccess}
        submitLabel="Create Core Playlist"
      />
    </div>
  )
}
