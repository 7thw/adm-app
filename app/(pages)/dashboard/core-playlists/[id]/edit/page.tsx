"use client"

import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useMutation, useQuery } from "convex/react"
import { useState, useEffect } from "react"
import { ArrowLeftIcon, SaveIcon } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Main component for editing core playlists
export default function CorePlaylistEditPage() {
  // Router for navigation
  const router = useRouter()
  const params = useParams()
  const playlistId = params.id as Id<"corePlaylists">

  // State for core playlist data
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState<Id<"playlistCategories"> | null>(null)
  const [status, setStatus] = useState<"draft" | "published">("draft")

  // UI state
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  // Mutations from the admin module
  const updateCorePlaylistMutation = useMutation(api.admin.updateCorePlaylist)
  const deleteCorePlaylistMutation = useMutation(api.admin.deleteCorePlaylist)

  // Fetch core playlist data
  const corePlaylists = useQuery(api.admin.listCorePlaylists)
  const corePlaylist = corePlaylists?.find((p: any) => p._id === playlistId)

  // Fetch categories
  const categories = useQuery(api.admin.listPlaylistCategories)

  // Initialize data when it's loaded
  useEffect(() => {
    if (corePlaylist) {
      setTitle(corePlaylist.title)
      setDescription(corePlaylist.description || "")
      setCategoryId(corePlaylist.categoryId as Id<"playlistCategories">)
      setStatus(corePlaylist.status as "draft" | "published")
    }
  }, [corePlaylist])

  // Handle saving core playlist
  const handleSaveCorePlaylist = async () => {
    if (!corePlaylist || !title || !categoryId) return

    setIsSaving(true)

    try {
      await updateCorePlaylistMutation({
        playlistId: corePlaylist._id,
        title,
        description,
        categoryId,
        status
      })

      toast.success("Core playlist saved successfully")
    } catch (error) {
      console.error("Error saving core playlist:", error)
      toast.error("Failed to save core playlist")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!corePlaylist) return

    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm")
      return
    }

    setIsDeleting(true)

    try {
      await deleteCorePlaylistMutation({
        playlistId: corePlaylist._id
      })

      toast.success("Core playlist deleted successfully")
      router.push("/dashboard/core-playlists")
    } catch (error) {
      console.error("Error deleting core playlist:", error)
      toast.error("Failed to delete core playlist")
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  if (!corePlaylist) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center">
          <p>Loading core playlist...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/core-playlists")}>
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="text-2xl font-bold">Edit Core Playlist</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            disabled={isSaving}
            onClick={handleSaveCorePlaylist}
            className="gap-2"
          >
            <SaveIcon className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Core Playlist"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isDeleting}
          >
            Delete Playlist
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Playlist Details</CardTitle>
          <CardDescription>Basic information about the playlist</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter playlist title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter playlist description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={categoryId ? categoryId.toString() : ""}
                onValueChange={(value) => setCategoryId(value as Id<"playlistCategories">)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category: any) => (
                    <SelectItem key={category._id.toString()} value={category._id.toString()}>
                      {category.title || category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as "draft" | "published")}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections will be implemented in a future update */}
      <Card>
        <CardHeader>
          <CardTitle>Playlist Sections</CardTitle>
          <CardDescription>Sections and media management (coming soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Section management functionality will be implemented in the next phase.
          </p>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this playlist?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Type DELETE to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="mt-4"
          />
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting || deleteConfirmText !== "DELETE"}
            >
              {isDeleting ? "Deleting..." : "Delete Playlist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
