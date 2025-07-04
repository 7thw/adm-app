"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {DraggableContainer} from "@/components/dnd/draggable-container"
import {DraggableItem} from "@/components/dnd/draggable-item"
import { ArrowLeftIcon, SaveIcon, Plus, Settings, Trash2, GripVertical } from "lucide-react"
import { toast } from "sonner"

// Type definition for CoreMediaTableItem (kept for future use)
type CoreMediaTableItem = {
  id: string
  title: string
  type: string
  duration: number
  order: number
}

export default function CorePlaylistEditPage() {
  // Router for navigation
  const router = useRouter()
  const params = useParams()
  const corePlaylistId = params.corePlaylistId as Id<"corePlaylists">

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

  // Fetch data from Convex
  const corePlaylists = useQuery(api.admin.listCorePlaylists, {})
  const corePlaylist = corePlaylists?.find((p: any) => p._id === corePlaylistId)
  const coreSections = useQuery(api.admin.listCoreSections, { corePlaylistId })
  const coreCategories = useQuery(api.admin.listCoreCategories, {})

  // Mutations
  const updateCorePlaylistMutation = useMutation(api.admin.updateCorePlaylist)
  const deleteCorePlaylistMutation = useMutation(api.admin.deleteCorePlaylist)
  const reorderCoreSectionsMutation = useMutation(api.admin.reorderCoreSections)

  // Initialize data when it's loaded
  useEffect(() => {
    if (corePlaylist) {
      setTitle(corePlaylist.title)
      setDescription(corePlaylist.description || "")
      setCategoryId(corePlaylist.categoryId as Id<"coreCategories">)
      setStatus(corePlaylist.status as "draft" | "published")
    }
  }, [corePlaylist])

  // Handle adding new Core Section
  const handleAddCoreSection = () => {
    // TODO: Implement with createCoreSection mutation
    toast.success("Core Section added successfully")
  }

  // Handle drag end for Core Sections
  const handleDragEnd = (event: DragEndEvent) => {
    handleCoreSectionReorder(event)
  }

  // Handle drag over for cross-container drops (if needed in future)
  const handleDragOver = (event: DragOverEvent) => {
    // For now, we only handle Core Section reordering
    // Future: handle moving media between sections
  }

  // Handle Core Section reordering
  const handleCoreSectionReorder = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id && coreSections) {
      const oldIndex = coreSections.findIndex((section) => section._id === active.id)
      const newIndex = coreSections.findIndex((section) => section._id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedSections = arrayMove(coreSections, oldIndex, newIndex)
        
        // Calculate new order values
        const updates = reorderedSections.map((section, index) => ({
          coreSectionId: section._id,
          order: index + 1
        }))
        
        // Call the reorder mutation
        reorderCoreSectionsMutation({ sectionOrders: updates.map(u => ({ id: u.coreSectionId, order: u.order })) })
          .then(() => {
            toast.success("Core Sections reordered successfully")
          })
          .catch((error) => {
            console.error("Error reordering sections:", error)
            toast.error("Failed to reorder sections")
          })
      }
    }
  }

  // Handle saving core playlist
  const handleSave = async () => {
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
  const handleDelete = async () => {
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
          <div className="text-lg font-medium">Loading Core Playlist...</div>
          <div className="text-sm text-muted-foreground mt-1">Please wait while we fetch the data</div>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
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
              <Button onClick={handleAddCoreSection} variant="outline" className="add-section-button">
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {coreSections && coreSections.length > 0 ? (
              <div className="core-sections-container">
                <DraggableContainer
                  items={coreSections.map(section => ({ id: section._id }))}
                  onReorder={(items) => {
                    const reorderedSections = items.map((item, index) => ({
                      coreSectionId: item.id,
                      order: index + 1
                    }));
                    
                    reorderCoreSectionsMutation({ 
                      sectionOrders: reorderedSections.map(s => ({ 
                        id: s.coreSectionId, 
                        order: s.order 
                      }))
                    })
                    .then(() => {
                      toast.success("Core Sections reordered successfully");
                    })
                    .catch((error) => {
                      console.error("Error reordering sections:", error);
                      toast.error("Failed to reorder sections");
                    });
                  }}
                  className="space-y-4 draggable-sections-wrapper"
                >
                  {coreSections.map((coreSection) => (
                    <DraggableItem
                      key={coreSection._id}
                      id={coreSection._id}
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
                                <CardTitle className="text-lg section-title">{coreSection.title}</CardTitle>
                                <div className="flex items-center gap-2 mt-1 section-badges">
                                  <Badge variant="secondary" className="text-xs section-type-badge">
                                    {coreSection.sectionType}
                                  </Badge>
                                  {coreSection.isRequired && (
                                    <Badge variant="destructive" className="text-xs required-badge">
                                      Required
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground section-stats">
                                    {/* TODO: Add media count from sectionMedias */}
                                    {coreSection.minSelectMedia > 0 && (
                                      <>Min: {coreSection.minSelectMedia}</>
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
                          {/* TODO: Replace with SectionMediaTable component */}
                          <div className="core-media-table-wrapper">
                            <div className="text-sm text-muted-foreground p-4 text-center">
                              Media management will be implemented with SectionMediaTable component
                            </div>
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
                <Button onClick={handleAddCoreSection} className="add-first-section-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Core Section
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Dialog */}
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
                onClick={handleDelete}
                disabled={isDeleting || deleteConfirmText !== "DELETE"}
              >
                {isDeleting ? "Deleting..." : "Delete Playlist"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndContext>
  )
}
