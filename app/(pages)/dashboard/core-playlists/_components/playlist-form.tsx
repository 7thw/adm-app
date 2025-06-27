"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { SaveIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

interface PlaylistFormProps {
  initialData?: {
    _id?: Id<"corePlaylists">
    title?: string
    description?: string
    categoryId?: Id<"playlistCategories">
    status?: "draft" | "published"
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
  const router = useRouter()
  const { user } = useUser()
  
  const [title, setTitle] = useState(initialData?.title || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [categoryId, setCategoryId] = useState<Id<"playlistCategories"> | "">(initialData?.categoryId || "")
  const [status, setStatus] = useState<"draft" | "published">(initialData?.status || "draft")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Get categories for dropdown
  const categories = useQuery(api.playlistCategories.getAll) || []
  
  // Convex mutations
  const createPlaylist = useMutation(api.corePlaylists.create)
  const updatePlaylist = useMutation(api.corePlaylists.update)
  const createUser = useMutation(api.users.createUser)
  const getUserByClerkId = useQuery(api.users.getUserByClerkId, 
    user ? { clerkId: user.id } : "skip"
  )
  
  // Helper function to ensure the user exists in Convex
  const ensureUserExists = async (): Promise<Id<"users"> | null> => {
    if (!user) return null
    
    // Check if user already exists in Convex
    if (getUserByClerkId) {
      return getUserByClerkId._id
    }
    
    // Create the user if they don't exist
    try {
      const userId = await createUser({
        name: user.fullName || "",
        email: user.primaryEmailAddress?.emailAddress || "",
        image: user.imageUrl,
        clerkId: user.id
      })
      return userId
    } catch (error) {
      console.error("Error creating user:", error)
      return null
    }
  }
  
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
      
      // Get the user ID from Clerk
      if (!user) {
        toast.error("You must be logged in to create a playlist")
        return
      }
      
      // Find or create the user in Convex
      const userId = await ensureUserExists()
      if (!userId) {
        toast.error("Failed to get user information")
        return
      }
      
      let playlistId: Id<"corePlaylists">
      
      if (isEdit && initialData?._id) {
        // Update existing playlist
        playlistId = await updatePlaylist({
          id: initialData._id,
          title,
          description: description || "",
          categoryId: categoryId as Id<"playlistCategories">,
          status
        })
        toast.success("Playlist updated successfully")
      } else {
        // Create new playlist
        playlistId = await createPlaylist({
          title,
          description: description || "",
          categoryId: categoryId as Id<"playlistCategories">,
          status,
          userId: userId as Id<"users">
        })
        toast.success("Playlist created successfully")
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
        <CardTitle>{isEdit ? "Edit Playlist" : "Playlist Details"}</CardTitle>
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
              onValueChange={(value) => setCategoryId(value as Id<"playlistCategories">)}
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
