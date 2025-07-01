"use client"

import { useMutation, useQuery } from "convex/react"
import { SaveIcon, Upload, X } from "lucide-react"
import Image from "next/image"
import { useState, useRef } from "react"
import { toast } from "sonner"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

interface PlaylistFormProps {
  initialData?: {
    _id?: Id<"corePlaylists">
    title?: string
    description?: string
    categoryId?: Id<"coreCategories">
    status?: "draft" | "published"
    thumbnailStorageId?: Id<"_storage">
  }
  onSuccess?: (playlistId: Id<"corePlaylists">) => void
  submitLabel?: string
  isEdit?: boolean
}

export function PlaylistForm({
  initialData,
  onSuccess,
  submitLabel = "Create Playlist",
  isEdit = false
}: PlaylistFormProps) {
  const [title, setTitle] = useState(initialData?.title || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [categoryId, setCategoryId] = useState<Id<"coreCategories"> | "">(
    initialData?.categoryId || ""
  )
  const [status, setStatus] = useState<"draft" | "published">(
    initialData?.status || "draft"
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Thumbnail upload state
  const [thumbnailFile, setThumbnailFile] = useState<File | undefined>(undefined)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | undefined>(
    // Using a placeholder until thumbnail logic is complete
    "https://via.placeholder.com/400x200"
  )
  const [thumbnailStorageId, setThumbnailStorageId] = useState<
    Id<"_storage"> | undefined
  >(initialData?.thumbnailStorageId || undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get categories for dropdown
  const categories = useQuery(api.admin.listCoreCategories, {})

  // Mutations
  const createCorePlaylist = useMutation(api.admin.createCorePlaylist)
  const updateCorePlaylist = useMutation(api.admin.updateCorePlaylist)
  const generateUploadUrl = useMutation(api.admin.generateUploadUrl)

  // Temporarily disable thumbnail fetching logic
  /*
  const { data: thumbnailUrl } = useQuery(
    api.r2Upload.getMediaUrl,
    thumbnailStorageId ? { storageId: thumbnailStorageId } : "skip"
  )

  useEffect(() => {
    if (thumbnailUrl) {
      setThumbnailPreview(thumbnailUrl)
    }
  }, [thumbnailUrl])
  */

  const handleThumbnailSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setThumbnailFile(file)
      setThumbnailPreview(URL.createObjectURL(file))
    }
  }

  const removeThumbnail = () => {
    setThumbnailFile(undefined)
    setThumbnailPreview(undefined)
    setThumbnailStorageId(undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!categoryId) {
      toast.error("Please select a category.")
      return
    }
    setIsSubmitting(true)

    try {
      let finalThumbnailStorageId = thumbnailStorageId

      // 1. Handle thumbnail upload if a new file is selected
      if (thumbnailFile) {
        const postUrl = await generateUploadUrl()
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": thumbnailFile.type },
          body: thumbnailFile
        })
        const { storageId: newStorageId } = await result.json()
        finalThumbnailStorageId = newStorageId
        toast.success("Thumbnail uploaded successfully!")
      }

      // 2. Create or update the playlist
      if (isEdit && initialData?._id) {
        // Update existing playlist
        await updateCorePlaylist({
          corePlaylistId: initialData._id,
          title,
          description,
          categoryId: categoryId as Id<"coreCategories">,
          status,
          thumbnailStorageId: finalThumbnailStorageId
        })
        toast.success("Playlist updated successfully!")
        if (onSuccess) {
          onSuccess(initialData._id)
        }
      } else {
        // Create new playlist
        const newPlaylistId = await createCorePlaylist({
          title,
          description,
          categoryId: categoryId as Id<"coreCategories">,
          thumbnailStorageId: finalThumbnailStorageId
        })
        toast.success("Playlist created successfully!")
        if (onSuccess) {
          onSuccess(newPlaylistId)
        }
      }
    } catch (error) {
      console.error(error)
      toast.error(
        isEdit ? "Failed to update playlist." : "Failed to create playlist."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Playlist" : "Create New Playlist"}</CardTitle>
          <CardDescription>
            {isEdit
              ? "Update the details of the existing playlist."
              : "Fill in the details to create a new core playlist."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Morning Meditation"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of the playlist."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={categoryId}
              onValueChange={(value) =>
                setCategoryId(value as Id<"coreCategories">)
              }
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Thumbnail Image</Label>
            <div className="flex items-center gap-4">
              {thumbnailPreview && (
                <div className="relative w-32 h-32 rounded-lg border overflow-hidden">
                  <Image
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={removeThumbnail}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="thumbnail-file-input"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "cursor-pointer",
                      "gap-2"
                    )}
                  >
                    <Upload className="h-4 w-4" />
                    {thumbnailPreview ? "Change Thumbnail" : "Upload Thumbnail"}
                  </Label>
                  {thumbnailPreview && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={removeThumbnail}
                    >
                      Remove
                    </Button>
                  )}
                  <input
                    id="thumbnail-file-input"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailSelect}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload an image (max 5MB) for the playlist thumbnail
                </p>
              </div>
            </div>
          </div>

          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as "draft" | "published")
                }
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
