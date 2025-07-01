"use client"

import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useQuery } from "convex/react"
import { ArrowLeftIcon, LoaderIcon, PlayIcon, Clock, Users, Layers } from "lucide-react"
import { notFound, useRouter } from "next/navigation"
import React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface PreviewPageProps {
  params: Promise<{
    id: string
  }>
}

export default function PlaylistPreviewPage({ params }: PreviewPageProps) {
  const router = useRouter()
  
  // Use React.use() to unwrap the params promise
  const unwrappedParams = React.use(params) as { id: string }
  const id = unwrappedParams.id

  // Fetch playlist preview data - moved before validation to fix React Hooks rule
  const playlistPreview = useQuery(api.admin.getPlaylistPreview, { 
    playlistId: id as Id<"corePlaylists"> 
  })
  
  // Fetch playlist stats
  const playlistStats = useQuery(api.admin.getPlaylistStats, { 
    playlistId: id as Id<"corePlaylists"> 
  })

  // Check if id is valid
  if (!id || !/^[\w\d]+$/.test(id)) {
    return notFound()
  }

  // Loading state
  if (playlistPreview === undefined || playlistStats === undefined) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Not found state
  if (!playlistPreview) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Playlist Not Found</h1>
          <p className="text-muted-foreground">The requested playlist could not be found.</p>
        </div>
      </div>
    )
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const totalMediaCount = playlistPreview.sections.reduce(
    (total, section) => total + section.medias.length, 0
  )

  const totalDuration = playlistPreview.sections.reduce(
    (total, section) => total + section.medias.reduce(
      (sectionTotal, media) => sectionTotal + (media.media?.duration || 0), 0
    ), 0
  )

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => router.push(`/dashboard/core-playlists/${id}`)}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Playlist Preview</h1>
          <p className="text-muted-foreground">Mobile-optimized preview of your playlist</p>
        </div>
      </div>

      {/* Playlist Header Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{playlistPreview.title}</CardTitle>
              <CardDescription className="text-base">
                {playlistPreview.description}
              </CardDescription>
              <div className="flex items-center gap-4">
                <Badge variant={playlistPreview.status === "published" ? "default" : "outline"}>
                  {playlistPreview.status === "published" ? "Published" : "Draft"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Category: {playlistPreview.category?.name || "Unknown"}
                </span>
                {playlistPreview.difficulty && (
                  <Badge variant="secondary" className="capitalize">
                    {playlistPreview.difficulty}
                  </Badge>
                )}
              </div>
            </div>
            
            {playlistPreview.thumbnailStorageId && (
              <div className="w-24 h-24 rounded-lg bg-muted border overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <PlayIcon className="h-8 w-8 text-primary" />
                </div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Layers className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{playlistStats?.sectionsCount || 0}</div>
            <div className="text-sm text-muted-foreground">Sections</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <PlayIcon className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{totalMediaCount}</div>
            <div className="text-sm text-muted-foreground">Media Items</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{formatDuration(totalDuration)}</div>
            <div className="text-sm text-muted-foreground">Duration</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{playlistStats?.userPlaylistsCount || 0}</div>
            <div className="text-sm text-muted-foreground">User Copies</div>
          </CardContent>
        </Card>
      </div>

      {/* Sections Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Playlist Sections</CardTitle>
          <CardDescription>
            Preview of all sections and their media content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {playlistPreview.sections.map((section, index) => (
            <div key={section._id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{section.title}</h3>
                  {section.description && (
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {section.sectionType}
                  </Badge>
                  <Badge variant="secondary">
                    {section.medias.length} media
                  </Badge>
                </div>
              </div>
              
              {/* Media Items */}
              <div className="grid gap-2 pl-4">
                {section.medias.map((media) => (
                  <div 
                    key={media._id} 
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/10 hover:bg-muted/20 transition-colors"
                  >
                    <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                      <PlayIcon className="h-4 w-4 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {media.media?.title || "Unknown Media"}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="capitalize">{media.media?.mediaType}</span>
                        {media.media?.duration && (
                          <>
                            <span>•</span>
                            <span>{formatDuration(media.media.duration)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {media.defaultSelected && (
                        <Badge variant="default" className="text-xs">
                          Default
                        </Badge>
                      )}
                      {media.isOptional && (
                        <Badge variant="outline" className="text-xs">
                          Optional
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                
                {section.medias.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No media items in this section
                  </div>
                )}
              </div>
              
              {index < playlistPreview.sections.length - 1 && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}
          
          {playlistPreview.sections.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No sections found. Add sections to see them here.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/core-playlists/${id}/edit`)}
        >
          Edit Playlist
        </Button>
        <Button
          onClick={() => router.push(`/dashboard/core-playlists`)}
        >
          Back to Playlists
        </Button>
      </div>
    </div>
  )
}