"use client"

import { useRouter } from "next/navigation"
import { List, BadgeCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Id } from "@/convex/_generated/dataModel"

interface PlaylistCardProps {
  playlist: {
    _id: Id<"corePlaylists">
    title: string
    description: string
    status: "draft" | "published"
    categoryId: Id<"playlistCategories">
    _creationTime?: number
  }
  getCategoryName: (categoryId: string) => string
}

export function PlaylistCard({ playlist, getCategoryName }: PlaylistCardProps) {
  const router = useRouter()
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <List className="mr-2 h-5 w-5 text-primary" />
            {playlist.title}
          </CardTitle>
          <Badge variant={playlist.status === "published" ? "default" : "outline"}>
            {playlist.status === "published" ? "Published" : "Draft"}
          </Badge>
        </div>
        <CardDescription>{playlist.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <div>Category</div>
            <div className="font-medium">{getCategoryName(playlist.categoryId)}</div>
          </div>
          <div className="flex justify-between text-sm">
            <div>Status</div>
            <div className="font-medium">{playlist.status}</div>
          </div>
          {playlist._creationTime && (
            <div className="flex justify-between text-sm">
              <div>Created</div>
              <div className="font-medium">{new Date(playlist._creationTime).toLocaleDateString()}</div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => router.push(`/dashboard/core-playlists/${playlist._id}`)}
        >
          View Details
        </Button>
        <Button 
          variant="secondary"
          onClick={() => router.push(`/dashboard/core-playlists/${playlist._id}/edit`)}
        >
          Edit
        </Button>
      </CardFooter>
    </Card>
  )
}
