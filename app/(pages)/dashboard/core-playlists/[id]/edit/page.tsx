"use client"

import React from "react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useMutation, useQuery } from "convex/react"
import { ArrowLeftIcon, GripVertical, Plus, SaveIcon, Settings, Trash2 } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { CoreMediaTable, CoreMediaTableItem } from "@/app/(pages)/dashboard/core-playlists/_components/core-media-table"
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

// Type definitions for mock data
type MockCoreSection = {
  coreSectionId: string
  coreSectionTitle: string
  coreSectionType: string
  isRequired: boolean
  minSelectMedia: number
  maxSelectMedia: number
  coreMediaItems: {
    coreMediaId: string
    title: string
    type: string
    duration: number
    isRequired: boolean
  }[]
}

// Main component for editing core playlists
export default function CorePlaylistEditPage() {
  // Router for navigation
  const router = useRouter()
  const params = useParams()
  const corePlaylistId = params.id as Id<"corePlaylists">

  // State for core playlist data
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState<Id<"coreCategories"> | null>(null)
  const [status, setStatus] = useState<"draft" | "published">("draft")

  // UI state
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  // Configure drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Mock data for Core Sections
  const [mockCoreSections, setMockCoreSections] = useState<MockCoreSection[]>([
    {
      coreSectionId: "section-1",
      coreSectionTitle: "Introduction",
      coreSectionType: "Sequential",
      isRequired: true,
      minSelectMedia: 1,
      maxSelectMedia: 0,
      coreMediaItems: [
        {
          coreMediaId: "media-1",
          title: "Welcome Video",
          type: "video",
          duration: 120,
          isRequired: true,
        },
        {
          coreMediaId: "media-2",
          title: "Course Overview",
          type: "document",
          duration: 300,
          isRequired: false,
        },
      ],
    },
    {
      coreSectionId: "section-2",
      coreSectionTitle: "Main Content",
      coreSectionType: "Choice",
      isRequired: false,
      minSelectMedia: 2,
      maxSelectMedia: 5,
      coreMediaItems: [
        {
          coreMediaId: "media-3",
          title: "Advanced Techniques",
          type: "video",
          duration: 600,
          isRequired: false,
        },
      ],
    },
  ])

  // Handle drag over for cross-container drops (if needed in future)
  const handleDragOver = (event: DragOverEvent) => {
    // For now, we only handle Core Section reordering
    // Future: handle moving media between sections
  }

  // Handle Core Section reordering
  const handleCoreSectionReorder = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setMockCoreSections((sections) => {
        const oldIndex = sections.findIndex((section) => section.coreSectionId === active.id)
        const newIndex = sections.findIndex((section) => section.coreSectionId === over.id)

        return arrayMove(sections, oldIndex, newIndex)
      })
      toast.success("Core Sections reordered successfully")
    }
  }

  // Mutations from the admin module
  const updateCorePlaylistMutation = useMutation(api.admin.updateCorePlaylist)
  const deleteCorePlaylistMutation = useMutation(api.admin.deleteCorePlaylist)

  // Fetch core playlist data
  const corePlaylists = useQuery(api.admin.listCorePlaylists, {})
  const coreCategories = useQuery(api.admin.listCoreCategories, {})

  // Find the current core playlist
  const corePlaylist = corePlaylists?.find(p => p._id === corePlaylistId)

  // Load core playlist data when available
  useEffect(() => {
    if (corePlaylist) {
      setTitle(corePlaylist.title || "")
      setDescription(corePlaylist.description || "")
      setCategoryId(corePlaylist.categoryId)
      setStatus(corePlaylist.status)
    }
  }, [corePlaylist])

  // Handle save
  const handleSave = async () => {
    if (!title.trim() || !categoryId) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSaving(true)
    try {
      await updateCorePlaylistMutation({
        corePlaylistId,
        title: title,
        description: description,
        categoryId: categoryId,
        status: status as "draft" | "published",
      })
      toast.success("Core Playlist updated successfully")
    } catch (error) {
      console.error("Error updating Core Playlist:", error)
      toast.error("Failed to update Core Playlist")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error('Please type "DELETE" to confirm')
      return
    }

    setIsDeleting(true)
    try {
      await deleteCorePlaylistMutation({ corePlaylistId })
      toast.success("Core Playlist deleted successfully")
      router.push("/dashboard/core-playlists")
    } catch (error) {
      console.error("Error deleting Core Playlist:", error)
      toast.error("Failed to delete Core Playlist")
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  if (!corePlaylist) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-lg font-medium">Loading Core Playlist...</div>
          <div className="text-sm text-muted-foreground mt-1">Please wait while we fetch the data</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 core-playlist-edit-page">
      {/* Header */}
      <div className="flex items-center justify-between page-header">
        <div className="flex items-center gap-4 header-left">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/core-playlists")}
            className="back-button"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Core Playlists
          </Button>
          <div className="header-title">
            <h1 className="text-2xl font-bold">Edit Core Playlist</h1>
            <p className="text-muted-foreground">Manage sections and media items</p>
          </div>
        </div>
        <div className="flex items-center gap-2 header-actions">
          <Button
            variant="outline"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="delete-button"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="save-button">
            <SaveIcon className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Core Playlist Details */}
      <Card className="core-playlist-details-card">
        <CardHeader>
          <CardTitle>Core Playlist Details</CardTitle>
          <CardDescription>Basic information about this Core Playlist</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter Core Playlist title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={categoryId || ""} onValueChange={(value) => setCategoryId(value as Id<"coreCategories">)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {coreCategories?.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter Core Playlist description"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as "draft" | "published")}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Core Sections */}
      <Card className="core-sections-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Core Sections</CardTitle>
              <CardDescription>Drag and drop to reorder sections</CardDescription>
            </div>
            <Button variant="outline" className="add-section-button">
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">
            Core Sections are managed in the "Core Sections" card below.
          </div>
        </CardContent>
      </Card>

    </div>
  )
}

// Router for navigation
const router = useRouter()
const params = useParams()
const corePlaylistId = params.id as Id<"corePlaylists">

// State for core playlist data
const [title, setTitle] = useState("")
const [description, setDescription] = useState("")
const [categoryId, setCategoryId] = useState<Id<"coreCategories"> | null>(null)
const [status, setStatus] = useState<"draft" | "published">("draft")

// UI state
const [isSaving, setIsSaving] = useState(false)
const [isDeleting, setIsDeleting] = useState(false)
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
const [deleteConfirmText, setDeleteConfirmText] = useState("")

// Configure drag-and-drop sensors
const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
)



// Mock data for Core Sections
const [mockCoreSections, setMockCoreSections] = React.useState<MockCoreSection[]>([
  {
    coreSectionId: "section-1",
    coreSectionTitle: "Introduction",
    coreSectionType: "Sequential",
    isRequired: true,
    minSelectMedia: 1,
    maxSelectMedia: 0,
    coreMediaItems: [
      {
        coreMediaId: "media-1",
        title: "Welcome Video",
        type: "video",
        duration: 120,
        isRequired: true,
      },
      {
        coreMediaId: "media-2",
        title: "Course Overview",
        type: "document",
        duration: 300,
        isRequired: false,
      },
    ],
  },
  {
    coreSectionId: "section-2",
    coreSectionTitle: "Main Content",
    coreSectionType: "Choice",
    isRequired: false,
    minSelectMedia: 2,
    maxSelectMedia: 5,
    coreMediaItems: [
      {
        coreMediaId: "media-3",
        title: "Advanced Techniques",
        type: "video",
        duration: 600,
        isRequired: false,
      },
    ],
  },
  {
    coreSectionId: "section-3",
    coreSectionTitle: "Integration",
    coreSectionType: "reflection",
    isRequired: false,
    minSelectMedia: 0,
    maxSelectMedia: 3,
    coreMediaItems: []
  }
])

// Convert mock media items to CoreMediaTableItem for data-table compatibility
const convertToCoreMediaTableItems = (coreMediaItems: MockCoreSection['coreMediaItems']): CoreMediaTableItem[] => {
  return coreMediaItems.map((item, index) => ({
    id: parseInt(item.coreMediaId.replace('media-', '')),
    coreMediaTitle: item.title,
    coreMediaType: item.type,
    duration: item.duration,
    order: index + 1,
  }))
}

// Handle adding new Core Section
const handleAddCoreSection = () => {
  const newId = `section-${Date.now()}`
  const newCoreSection: MockCoreSection = {
    coreSectionId: newId,
    coreSectionTitle: `New Core Section ${mockCoreSections.length + 1}`,
    coreSectionType: "practice",
    isRequired: false,
    minSelectMedia: 0,
    maxSelectMedia: 5,
    coreMediaItems: []
  }
  setMockCoreSections([...mockCoreSections, newCoreSection])
  toast.success("Core Section added successfully")
}

// Handle drag end for Core Sections
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event

  if (over && active.id !== over.id) {
    setMockCoreSections((sections) => {
      const oldIndex = sections.findIndex(section => section.coreSectionId === active.id)
      const newIndex = sections.findIndex(section => section.coreSectionId === over.id)

      const reorderedSections = arrayMove(sections, oldIndex, newIndex)
      console.log("Core Sections reordered:", reorderedSections)
      // TODO: Update Convex with new order
      return reorderedSections
    })
  }
}

// Handle drag over for cross-container drops (if needed in future)
const handleDragOver = (event: DragOverEvent) => {
  // For now, we only handle Core Section reordering
  // Future: handle moving media between sections
}

// Handle Core Media Item reordering within sections
const handleCoreMediaReorder = (coreSectionId: string, reorderedItems: CoreMediaTableItem[]) => {
  console.log(`Core Media reordered in section ${coreSectionId}:`, reorderedItems)
  // TODO: Update Convex with new order
  toast.success("Media items reordered successfully")
}

// Handle Core Section reordering
const handleCoreSectionReorder = (event: DragEndEvent) => {
  const { active, over } = event

  if (over && active.id !== over.id) {
    setMockCoreSections((sections) => {
      const oldIndex = sections.findIndex((section) => section.coreSectionId === active.id)
      const newIndex = sections.findIndex((section) => section.coreSectionId === over.id)

      return arrayMove(sections, oldIndex, newIndex)
    })
    toast.success("Core Sections reordered successfully")
  }
}

// Mutations from the admin module
const updateCorePlaylistMutation = useMutation(api.admin.updateCorePlaylist)
const deleteCorePlaylistMutation = useMutation(api.admin.deleteCorePlaylist)

// Fetch core playlist data
const corePlaylists = useQuery(api.admin.listCorePlaylists, {})
const corePlaylist = corePlaylists?.find((p: any) => p._id === corePlaylistId)

// Fetch categories
const categories = useQuery(api.admin.listCoreCategories, {})

// Initialize data when it's loaded
useEffect(() => {
  if (corePlaylist) {
    setTitle(corePlaylist.title)
    setDescription(corePlaylist.description || "")
    setCategoryId(corePlaylist.categoryId as Id<"coreCategories">)
    setStatus(corePlaylist.status as "draft" | "published")
  }
}, [corePlaylist])

// Handle saving core playlist
const handleSaveCorePlaylist = async () => {
  if (!corePlaylist || !title || !categoryId) return

  setIsSaving(true)

  try {
    await updateCorePlaylistMutation({
      corePlaylistId: corePlaylist._id,
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
      corePlaylistId: corePlaylist._id
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
    <div className="flex items-center justify-center h-64">
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


    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Core Sections</CardTitle>
            <CardDescription>
              Organize your Core Playlist content into sections. Each section can contain multiple media items.
            </CardDescription>
          </div>
          <Button onClick={() => handleAddCoreSection()} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Core Section
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {mockCoreSections.length > 0 ? (
          <div className="core-sections-container">
            <DraggableContainer
              items={mockCoreSections}
              onReorder={handleCoreSectionReorder}
              className="space-y-4 draggable-sections-wrapper"
            >
              {mockCoreSections.map((coreSection) => (
                <DraggableItem
                  key={coreSection.coreSectionId}
                  id={coreSection.coreSectionId}
                  className="p-0 border-0 bg-transparent draggable-section-item"
                  showDragHandle={false}
                >
                  <Card className="w-full core-section-card">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between section-header">
                        <div className="flex items-center gap-3 section-title-area">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 cursor-grab text-muted-foreground hover:text-foreground drag-handle-button"
                            data-drag-handle="true"
                          >
                            <GripVertical className="h-4 w-4" />
                          </Button>
                          <div className="section-metadata">
                            <CardTitle className="text-lg section-title">{coreSection.coreSectionTitle}</CardTitle>
                            <div className="flex items-center gap-2 mt-1 section-badges">
                              <Badge variant="secondary" className="text-xs section-type-badge">
                                {coreSection.coreSectionType}
                              </Badge>
                              {coreSection.isRequired && (
                                <Badge variant="destructive" className="text-xs required-badge">
                                  Required
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground section-stats">
                                {coreSection.coreMediaItems.length} media item{coreSection.coreMediaItems.length !== 1 ? 's' : ''}
                                {coreSection.minSelectMedia > 0 && (
                                  <> • Min: {coreSection.minSelectMedia}</>
                                )}
                                {coreSection.maxSelectMedia > 0 && (
                                  <> • Max: {coreSection.maxSelectMedia}</>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 section-actions">
                          <Button variant="outline" size="sm" className="add-media-button">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Media
                          </Button>
                          <Button variant="ghost" size="sm" className="settings-button">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive delete-button">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 section-content">
                      {/* Core Media Table for Core Media Items */}
                      <div className="core-media-table-wrapper">
                        <CoreMediaTable
                          data={convertToCoreMediaTableItems(coreSection.coreMediaItems)}
                          onReorder={(reorderedItems) =>
                            handleCoreMediaReorder(coreSection.coreSectionId, reorderedItems)
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                </DraggableItem>
              ))}
            </DraggableContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center empty-sections-state">
            <div className="rounded-full bg-muted p-4 mb-4 empty-icon">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2 empty-title">No Core Sections yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm empty-description">
              Core Sections organize your media content. Each section can contain multiple media items
              that subscribers will experience in sequence.
            </p>
            <Button onClick={() => handleAddCoreSection()} className="add-first-section-button">
              <Plus className="h-4 w-4 mr-2" />
              Add First Core Section
            </Button>
          </div>
        )}
      </CardContent>
    </Card>

    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure you want to delete this Core Playlist?</DialogTitle>
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
