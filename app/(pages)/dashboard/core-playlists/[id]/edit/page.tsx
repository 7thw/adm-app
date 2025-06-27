"use client"

import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useMutation, useQuery } from "convex/react"
import { AlertTriangle, ArrowLeftIcon, GripVertical, PlusIcon, SaveIcon, Trash2 } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { SectionMediaTable } from "../_components/section-media-table"

import { MediaPlayerModal } from "@/components/medias/MediaPlayerModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

// Type definitions for our components
type CoreSection = {
  _id: Id<"coreSections">
  title: string
  description: string
  type: "base" | "loop"
  order: number
  maxSelectMedia?: number
  maxLoopTimer?: number
  countDownTimer?: number
}

type MediaItem = {
  _id: Id<"media">
  title: string
  description: string
  fileUrl: string
  duration?: number
  mediaType: "audio" | "video"
  fileKey: string
  fileSize: number
  contentType: string
  createdAt: string
  updatedAt: string
  userId: string
}

type CoreSectionMedia = {
  _id: Id<"sectionMedia">
  sectionId: Id<"coreSections">
  mediaId: Id<"media">
  order: number
  isRequired?: boolean
}

// Sortable Section component for drag and drop
function SortableSection({ section, onEdit, onDelete, children }: {
  section: CoreSection
  onEdit: (section: CoreSection) => void
  onDelete: (sectionId: Id<"coreSections">) => void
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section._id.toString() })

  // Using inline styles is necessary for drag and drop functionality with @dnd-kit
  // The transform values are dynamically calculated during dragging
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties

  return (
    <div ref={setNodeRef} style={style} className="mb-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div {...attributes} {...listeners} className="cursor-grab p-1 hover:bg-muted rounded">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{section.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={section.type === "base" ? "outline" : "default"}>
                    {section.type === "base" ? "Base" : "Loop"}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(section)}>
                    <SaveIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(section._id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <CardDescription>{section.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </div>
  )
}

export default function CorePlaylistEditPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  // State for playlist editing
  const [title, setTitle] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [categoryId, setCategoryId] = useState<Id<"playlistCategories"> | "">("")
  const [status, setStatus] = useState<"draft" | "published">("draft")
  const [isSaving, setIsSaving] = useState(false)
  const [isPlaylistSaved, setIsPlaylistSaved] = useState(false)
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)

  // State for section management
  const [sections, setSections] = useState<CoreSection[]>([])
  const [editingSection, setEditingSection] = useState<CoreSection | null>(null)
  const [isAddingSectionOpen, setIsAddingSectionOpen] = useState(false)

  // State for media management
  const [sectionMedia, setSectionMedia] = useState<Record<string, CoreSectionMedia[]>>({})
  const [allMedia, setAllMedia] = useState<MediaItem[]>([])
  const [isAddingMedia, setIsAddingMedia] = useState(false)
  const [currentSectionId, setCurrentSectionId] = useState<Id<"coreSections"> | null>(null)
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set())

  // State for media player
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false)
  const [currentPlayingMedia, setCurrentPlayingMedia] = useState<MediaItem | null>(null)

  // State for delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Fetch data from Convex
  const playlist = useQuery(api.corePlaylists.getByStringId, { id: id })
  const categories = useQuery(api.playlistCategories.getAll) || []
  const fetchedSections = useQuery(api.coreSections.getByCorePlaylistId,
    playlist ? { playlistId: playlist._id as Id<"corePlaylists"> } : "skip"
  ) || []
  const media = useQuery(api.media.getAllMedia) || []

  // Mutations
  const updatePlaylist = useMutation(api.corePlaylists.update)
  const createSection = useMutation(api.coreSections.create)
  const deletePlaylist = useMutation(api.corePlaylists.remove)
  const updateSection = useMutation(api.coreSections.update)
  const deleteSection = useMutation(api.coreSections.remove)
  const reorderSections = useMutation(api.coreSections.reorder)
  const addMedia = useMutation(api.coreSectionMedia.addMedia)

  useEffect(() => {
    if (playlist) {
      setTitle(playlist.title)
      setDescription(playlist.description)
      setCategoryId(playlist.categoryId as Id<"playlistCategories">)
      setStatus(playlist.status as "draft" | "published")
      setIsPlaylistSaved(true) // Consider existing playlists as already saved
    }
  }, [playlist])

  // Auto-save effect
  useEffect(() => {
    // Only set up auto-save if we have a valid playlist and required fields
    if (playlist && title && categoryId) {
      // Clear any existing timeout
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
      }

      // Set a new timeout for auto-saving
      const timeout = setTimeout(() => {
        handleSavePlaylist(true) // Pass true to indicate it's an auto-save
      }, 2000) // Auto-save after 2 seconds of inactivity

      setAutoSaveTimeout(timeout)
    }

    // Clean up the timeout when component unmounts
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
      }
    }
  }, [title, description, categoryId, status])

  useEffect(() => {
    if (fetchedSections.length > 0) {
      const sortedSections = [...fetchedSections].sort((a, b) => a.order - b.order)
      setSections(sortedSections)
    }
  }, [fetchedSections])

  useEffect(() => {
    if (media.length > 0) {
      setAllMedia(media)
    }
  }, [media])

  const handleSectionDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setSections((sections) => {
        const oldIndex = sections.findIndex(s => s._id.toString() === active.id)
        const newIndex = sections.findIndex(s => s._id.toString() === over.id)

        const reordered = [...sections]
        const [removed] = reordered.splice(oldIndex, 1)
        reordered.splice(newIndex, 0, removed)

        const withNewOrder = reordered.map((section, index) => ({
          ...section,
          order: index + 1
        }))

        const sectionOrders = withNewOrder.map(s => ({
          id: s._id,
          order: s.order
        }))
        reorderSections({ sectionOrders })

        return withNewOrder
      })
    }
  }, [])

  const handleSavePlaylist = async (isAutoSave = false) => {
    if (!playlist) return

    // Validate required fields
    if (!title) {
      if (!isAutoSave) toast.error("Title is required")
      return
    }

    if (!categoryId) {
      if (!isAutoSave) toast.error("Category is required")
      return
    }

    try {
      if (!isAutoSave) setIsSaving(true)

      await updatePlaylist({
        id: playlist._id as Id<"corePlaylists">,
        title,
        description,
        categoryId: categoryId as Id<"playlistCategories">,
        status
      })

      setIsPlaylistSaved(true)

      if (!isAutoSave) {
        toast.success("Playlist updated successfully")
      }
    } catch (error) {
      console.error("Error updating playlist:", error)
      if (!isAutoSave) {
        toast.error("Failed to update playlist")
      }
    } finally {
      if (!isAutoSave) setIsSaving(false)
    }
  }

  const handleDeletePlaylist = async () => {
    if (!playlist) return

    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm")
      return
    }

    setIsDeleting(true)

    try {
      await deletePlaylist({
        id: playlist._id as Id<"corePlaylists">,
      })

      toast.success("Playlist deleted successfully")
      router.push("/dashboard/core-playlists")
    } catch (error) {
      console.error("Error deleting playlist:", error)
      toast.error("Failed to delete playlist")
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleAddSection = async (sectionData: {
    title: string
    type: "base" | "loop"
    maxSelectMedia?: number
  }) => {
    if (!playlist) return

    try {
      const highestOrder = sections.length > 0
        ? Math.max(...sections.map(s => s.order))
        : 0

      const newSectionId = await createSection({
        playlistId: playlist._id as Id<"corePlaylists">,
        title: sectionData.title,
        description: "", // Empty description since it's not needed
        sectionType: sectionData.type,
        order: highestOrder + 1,
        maxSelectMedia: sectionData.maxSelectMedia || 0
      })

      setSections(prev => [...prev, {
        _id: newSectionId,
        title: sectionData.title,
        description: "", // Empty description since it's not needed
        type: sectionData.type,
        order: highestOrder + 1,
        maxSelectMedia: sectionData.maxSelectMedia
      }])

      setIsAddingSectionOpen(false)
      toast.success("Section added successfully")
    } catch (error) {
      console.error("Error adding section:", error)
      toast.error("Failed to add section")
    }
  }

  const handleEditSection = async (sectionData: CoreSection) => {
    try {
      await updateSection({
        id: sectionData._id,
        title: sectionData.title,
        description: sectionData.description,
        type: sectionData.type,
        maxSelectMedia: sectionData.maxSelectMedia
      })

      setSections(prev => prev.map(s =>
        s._id === sectionData._id ? sectionData : s
      ))

      setEditingSection(null)
      toast.success("Section updated successfully")
    } catch (error) {
      console.error("Error updating section:", error)
      toast.error("Failed to update section")
    }
  }

  const handleDeleteSection = async (sectionId: Id<"coreSections">) => {
    try {
      await deleteSection({ id: sectionId })

      setSections(prev => prev.filter(s => s._id !== sectionId))

      toast.success("Section deleted successfully")
    } catch (error) {
      console.error("Error deleting section:", error)
      toast.error("Failed to delete section")
    }
  }

  // Handle media playback
  const handlePlayMedia = (media: MediaItem) => {
    console.log(' Play button clicked for media:', media.title)
    setCurrentPlayingMedia(media)
    setIsPlayerModalOpen(true)
  }

  // Handle player close
  const handleClosePlayer = () => {
    console.log(' Closing media player')
    setIsPlayerModalOpen(false)
    setCurrentPlayingMedia(null)
  }

  if (!playlist) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
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
          <h1 className="text-l font-bold">Edit Core Playlist</h1>
        </div>

        {/* Delete Button and Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={isSaving || isDeleting}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Playlist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Delete Playlist
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the playlist
                and all its sections. Media files will not be deleted.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="confirm" className="text-sm font-medium">
                Type <span className="font-bold">DELETE</span> to confirm
              </Label>
              <Input
                id="confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePlaylist}
                disabled={deleteConfirmText !== "DELETE" || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete Playlist"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Media Player Modal */}
        {currentPlayingMedia && (
          <MediaPlayerModal
            isOpen={isPlayerModalOpen}
            onClose={handleClosePlayer}
            media={currentPlayingMedia}
            autoPlay={true}
          />
        )}

        <Button
          onClick={() => handleSavePlaylist(false)}
          disabled={isSaving}
          className="gap-2"
        >
          <SaveIcon className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Playlist"}
        </Button>

      </div>

      {/* Playlist metadata */}
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

          <div className="grid grid-cols-2 gap-1">
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

      {/* Sections */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Playlist Sections</h2>
          <Sheet open={isAddingSectionOpen} onOpenChange={setIsAddingSectionOpen}>
            <SheetTrigger asChild>
              <Button
                className="gap-2"
                disabled={!isPlaylistSaved}
                title={!isPlaylistSaved ? "Save the playlist first before adding sections" : "Add a new section"}
              >
                <PlusIcon className="h-4 w-4" />
                Add Section
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Add New Section</SheetTitle>
                <SheetDescription>
                  Create a new section for this playlist. Sections can contain multiple media items.
                </SheetDescription>
              </SheetHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="section-title">Title</Label>
                  <Input id="section-title" placeholder="Enter section title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section-type">Type</Label>
                  <Select defaultValue="base">
                    <SelectTrigger id="section-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="base">Base (plays once)</SelectItem>
                      <SelectItem value="loop">Loop (repeats)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section-max-select">Max Selectable Media</Label>
                  <Input
                    id="section-max-select"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Enter maximum number of media items"
                    onKeyDown={(e) => {
                      // Allow only numbers, backspace, delete, tab, arrows
                      if (!/[0-9]/.test(e.key) &&
                        !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                        e.preventDefault()
                      }
                    }}
                  />
                </div>
                <Button
                  className="w-full mt-4"
                  disabled={!isPlaylistSaved}
                  onClick={() => {
                    if (!isPlaylistSaved) {
                      toast.error("Please save the playlist first before adding sections")
                      return
                    }

                    const titleEl = document.getElementById("section-title") as HTMLInputElement
                    const typeEl = document.querySelector("#section-type [data-value]") as HTMLElement
                    const maxSelectEl = document.getElementById("section-max-select") as HTMLInputElement

                    if (!titleEl.value.trim()) {
                      toast.error("Section title is required")
                      return
                    }

                    handleAddSection({
                      title: titleEl.value,
                      type: (typeEl?.getAttribute("data-value") || "base") as "base" | "loop",
                      maxSelectMedia: maxSelectEl.value ? parseInt(maxSelectEl.value) : undefined
                    })
                  }}>
                  Add Section
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleSectionDragEnd}
        >
          <SortableContext
            items={sections.map(s => s._id.toString())}
            strategy={verticalListSortingStrategy}
          >
            {sections.map((section) => (
              <SortableSection
                key={section._id.toString()}
                section={section}
                onEdit={setEditingSection}
                onDelete={handleDeleteSection}
              >
                <div className="space-y-2">
                  {/* Media table will go here */}
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Media Items</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => {
                        setCurrentSectionId(section._id)
                        setIsAddingMedia(true)
                      }}
                    >
                      <PlusIcon className="h-3 w-3" />
                      Add Media
                    </Button>
                  </div>

                  <SectionMediaTable
                    sectionId={section._id}
                    maxSelectMedia={section.maxSelectMedia}
                    onPlayMedia={handlePlayMedia}
                  />
                </div>
              </SortableSection>
            ))}
          </SortableContext>
        </DndContext>

        {sections.length === 0 && (
          <div className="text-center p-8 border rounded-md bg-muted/10">
            <p className="text-muted-foreground">No sections found. Add a section to get started.</p>
          </div>
        )}
      </div>

      {/* Edit Section Sheet */}
      {editingSection && (
        <Sheet open={!!editingSection} onOpenChange={(open) => !open && setEditingSection(null)}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Edit Section</SheetTitle>
              <SheetDescription>
                Make changes to the section details.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-section-title">Title</Label>
                <Input
                  id="edit-section-title"
                  value={editingSection.title}
                  onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-section-description">Description</Label>
                <Textarea
                  id="edit-section-description"
                  value={editingSection.description}
                  onChange={(e) => setEditingSection({ ...editingSection, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-section-type">Type</Label>
                <Select
                  value={editingSection.type}
                  onValueChange={(value) => setEditingSection({ ...editingSection, type: value as "base" | "loop" })}
                >
                  <SelectTrigger id="edit-section-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="base">Base (plays once)</SelectItem>
                    <SelectItem value="loop">Loop (repeats)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-section-max-select">Max Selectable Media</Label>
                <Input
                  id="edit-section-max-select"
                  type="number"
                  value={editingSection.maxSelectMedia?.toString() || ""}
                  onChange={(e) => setEditingSection({
                    ...editingSection,
                    maxSelectMedia: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                />
              </div>
              <Button className="w-full mt-4" onClick={() => handleEditSection(editingSection)}>
                Save Changes
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Add Media Sheet */}
      <Sheet open={isAddingMedia} onOpenChange={(open) => {
        if (!open) {
          setSelectedMediaIds(new Set())
        }
        setIsAddingMedia(open)
      }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add Media</SheetTitle>
            <SheetDescription>
              Select media items to add to this section.
            </SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Available Media</Label>
              <div className="border rounded-md divide-y max-h-96 overflow-y-auto">
                {allMedia.map((media) => {
                  const mediaId = media._id.toString()
                  const isSelected = selectedMediaIds.has(mediaId)
                  return (
                    <div key={mediaId} className="p-3 flex items-center gap-3">
                      <Checkbox
                        id={`media-${mediaId}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedMediaIds)
                          if (checked) {
                            newSelected.add(mediaId)
                          } else {
                            newSelected.delete(mediaId)
                          }
                          setSelectedMediaIds(newSelected)
                        }}
                      />
                      <Label htmlFor={`media-${mediaId}`} className="flex-1 cursor-pointer">
                        <div className="font-medium">{media.title}</div>
                        <div className="text-sm text-muted-foreground">{media.description}</div>
                      </Label>
                    </div>
                  )
                })}
              </div>
            </div>
            <Button
              className="w-full"
              disabled={selectedMediaIds.size === 0 || !currentSectionId}
              onClick={async () => {
                if (!currentSectionId) return

                try {
                  // Add each selected media to the section
                  const promises = Array.from(selectedMediaIds).map(mediaId => {
                    return addMedia({
                      coreSectionId: currentSectionId,
                      mediaId: mediaId as Id<"media">,
                      selectMedia: true // Select by default when adding
                    })
                  })

                  await Promise.all(promises)

                  toast.success(`Added ${selectedMediaIds.size} media items to section`)
                  setIsAddingMedia(false)
                  setSelectedMediaIds(new Set())
                } catch (error) {
                  console.error("Error adding media:", error)
                  toast.error("Failed to add media to section")
                }
              }}
            >
              Add Selected Media
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
