"use client"

import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { SaveIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

interface PlaylistFormProps {
  initialData?: {
    _id?: Id<"corePlaylists">
    title?: string
    description?: string
    categoryId?: Id<"coreCategories">
    status?: "draft" | "published"
  }
  onSuccess?: (playlistId: Id<"corePlaylists">) => void
  submitLabel?: string
  isEdit?: boolean
}

export function PlaylistForm({
  initialData,
  onSuccess,
  submitLabel = "Create corePlaylist",
  isEdit = false
}: PlaylistFormProps) {
  const router = useRouter()
  const { user } = useUser()

  const [title, setTitle] = useState(initialData?.title || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [categoryId, setCategoryId] = useState<Id<"coreCategories"> | "">(initialData?.categoryId || "")
  const [status, setStatus] = useState<"draft" | "published">(initialData?.status || "draft")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get categories for dropdown
  const categories = useQuery(api.admin.listCoreCategories, { includeInactive: false }) || []

  // Convex mutations
  const createPlaylist = useMutation(api.admin.createCorePlaylist)
  const updatePlaylist = useMutation(api.admin.updateCorePlaylist)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Title is required")
      return
    }

    if (!categoryId) {
      toast.error("Category is required")
      return
    }

    try {
      setIsSubmitting(true)

      let playlistId: Id<"corePlaylists">

      if (isEdit && initialData?._id) {
        // Update existing playlist
        await updatePlaylist({
          playlistId: initialData._id,
          title,
          description: description || "",
          categoryId: categoryId as unknown as Id<"coreCategories">
        })
        playlistId = initialData._id
        toast.success("corePlaylist updated successfully")
      } else {
        // Create new playlist
        playlistId = await createPlaylist({
          title,
          description: description || "",
          categoryId: categoryId as unknown as Id<"coreCategories">,
          status,
        })
        toast.success("corePlaylist created successfully")
      }

      if (onSuccess) {
        onSuccess(playlistId)
      }

    } catch (error) {
      console.error("Error saving playlist:", error)
      toast.error(isEdit ? "Failed to update playlist" : "Failed to create playlist")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit corePlaylist" : "corePlaylist Details"}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Update the information for this playlist"
            : "Enter the basic information for your new playlist"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter playlist title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter playlist description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={categoryId ? categoryId.toString() : ""}
              onValueChange={(value) => setCategoryId(value as unknown as Id<"coreCategories">)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem
                    key={category._id.toString()}
                    value={category._id.toString()}
                  >
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isEdit && (
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
          )}
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            className="gap-2"
            disabled={isSubmitting || !title || !categoryId}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⏳</span>
                {isEdit ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <SaveIcon className="h-4 w-4" />
                {submitLabel}
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
