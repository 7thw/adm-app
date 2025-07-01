"use client"

import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { useMutation, useQuery } from "convex/react"
import { useState, useEffect, useCallback, useRef } from "react"
import { AlertTriangle, ArrowLeftIcon, GripVertical, PlusIcon, SaveIcon, Trash2 } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { CoreSectionForm } from "@/components/core-playlists/core-section-form"
import { CoreSectionItem } from "@/components/core-playlists/core-section-item"
import { MediaSelector } from "@/components/core-playlists/media-selector"
import MediaPlayer from "@/components/medias/MediaPlayer"

// Types for core playlist data
type CoreSection = {
  _id: Id<"coreSections">
  title: string
  description?: string
  sectionType: "base" | "loop"
  coreSectionOrder: number
  minSelectMedia: number
  maxSelectMedia: number
}

type MediaItem = {
  _id: Id<"medias">
  title: string
  description?: string
  mediaType: "audio" | "video"
  duration: number
  mediaUrl: string
  thumbnailUrl?: string
}

type CoreSectionMedia = {
  _id: Id<"sectionMedias">
  sectionId: Id<"coreSections">
  mediaId: Id<"medias">
  order: number
  isOptional: boolean
  defaultSelected: boolean
}

// Type for core playlist
type CorePlaylist = {
  _id: Id<"corePlaylists">
  title: string
  description?: string
  status: "draft" | "published"
  categoryId: Id<"coreCategories">
  estimatedDuration?: number
  playCount: number
  averageRating?: number
  publishedAt?: number
  lastModifiedAt: number
}

// Main component for editing core playlists
export default function CorePlaylistEditPage() {
  // Router for navigation
  const router = useRouter()
  const params = useParams()
  const playlistId = params.id as Id<"corePlaylists">

  // State for core playlist data
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState<Id<"coreCategories"> | null>(null)
  const [status, setStatus] = useState<"draft" | "published">("draft")
  const [sections, setSections] = useState<CoreSection[]>([])
  const [allMedia, setAllMedia] = useState<MediaItem[]>([])

  // UI state
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [isCorePlaylistSaved, setIsCorePlaylistSaved] = useState(true)
  const [isAddingSectionOpen, setIsAddingSectionOpen] = useState(false)
  const [isEditingSectionOpen, setIsEditingSectionOpen] = useState(false)
  const [isAddingMedia, setIsAddingMedia] = useState(false)
  const [currentSectionId, setCurrentSectionId] = useState<Id<"coreSections"> | null>(null)
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set())
  const [editingSection, setEditingSection] = useState<CoreSection | null>(null)

  // Media player state
  const [currentMedia, setCurrentMedia] = useState<MediaItem | null>(null)
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)

  // Mutations from the admin module
  const createSectionMutation = useMutation(api.admin.createCoreSection)
  const addMediaToSectionMutation = useMutation(api.admin.addMediaToSection)
  const publishCorePlaylistMutation = useMutation(api.admin.publishCorePlaylist)
  const updateCorePlaylistMutation = useMutation(api.admin.updateCorePlaylist)
  const deleteCorePlaylistMutation = useMutation(api.admin.deleteCorePlaylist)
  const updateCoreSectionMutation = useMutation(api.admin.updateCoreSection)
  const removeCoreSectionMutation = useMutation(api.admin.removeCoreSection)
  const reorderCoreSectionsMutation = useMutation(api.admin.reorderCoreSections)

  // Fetch core playlist data
  const corePlaylists = useQuery(api.admin.listCorePlaylists)
  const corePlaylist = corePlaylists?.find((p: any) => p._id === playlistId)

  // Fetch sections data - we need to implement this since there's no direct query
  const allSections = useQuery(api.admin.listCoreSections)
  const fetchedSections = allSections?.filter((s: any) => s.playlistId === playlistId) || []

  // Fetch media data
  const media = useQuery(api.admin.listSectionMedias, playlistId)

  // Fetch categories
  const categories = useQuery(api.admin.listCoreCategories)

  // Initialize data when it's loaded
  useEffect(() => {
    if (corePlaylist) {
      setTitle(corePlaylist.title)
      setDescription(corePlaylist.description || "")
      setCategoryId(corePlaylist.categoryId as Id<"coreCategories">)
      setStatus(corePlaylist.status as "draft" | "published")
      setIsCorePlaylistSaved(true)
    }
  }, [corePlaylist])

  // DnD sensors for section reordering
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Function to update core playlist using the Convex mutation
  const updateCorePlaylist = async (
    id: Id<"corePlaylists">,
    data: {
      title: string,
      description?: string,
      categoryId: Id<"coreCategories">,
      status: "draft" | "published"
    }
  ) => {
    try {
      await updateCorePlaylistMutation({
        playlistId: id,
        title: data.title,
        description: data.description,
        categoryId: data.categoryId
      })
      return { success: true }
    } catch (error) {
      console.error("Error updating playlist:", error)
      toast.error("Failed to update playlist")
      return { success: false }
    }
  }

  const deleteCorePlaylist = async (id: Id<"corePlaylists">) => {
    try {
      await deleteCorePlaylistMutation({
        playlistId: id
      })
      return { success: true }
    } catch (error) {
      console.error("Error deleting playlist:", error)
      toast.error("Failed to delete playlist")
      return { success: false }
    }
  }

  const updateCoreSection = async (
    id: Id<"coreSections">,
    data: {
      title: string,
      description?: string,
      sectionType: "base" | "loop",
      minSelectMedia: number,
      maxSelectMedia: number
    }
  ) => {
    try {
      await updateCoreSectionMutation({
        sectionId: id,
        title: data.title,
        description: data.description,
        sectionType: data.sectionType,
        minSelectMedia: data.minSelectMedia,
        maxSelectMedia: data.maxSelectMedia
      })
      return { success: true }
    } catch (error) {
      console.error("Error updating section:", error)
      toast.error("Failed to update section")
      return { success: false }
    }
  }

  const deleteCoreSection = async (id: Id<"coreSections">) => {
    try {
      await removeCoreSectionMutation({
        sectionId: id
      })
      return { success: true }
    } catch (error) {
      console.error("Error deleting section:", error)
      toast.error("Failed to delete section")
      return { success: false }
    }
  }

  const reorderCoreSections = async (sectionOrders: { sectionId: Id<"coreSections">, order: number }[]) => {
    try {
      await reorderCoreSectionsMutation({
        sectionOrders: sectionOrders
      })
      return { success: true }
    } catch (error) {
      console.error("Error reordering sections:", error)
      toast.error("Failed to reorder sections")
      return { success: false }
    }
  }

  // Handle saving core playlist
  const handleSaveCorePlaylist = async (isAutoSave = false) => {
    if (!corePlaylist || !title || !categoryId) return

    if (!isAutoSave) setIsSaving(true)

    try {
      await updateCorePlaylist(corePlaylist._id, {
        title,
        description,
        categoryId,
        status
      })

      setIsCorePlaylistSaved(true)
      if (!isAutoSave) toast.success("Core playlist saved successfully")
    } catch (error) {
      console.error("Error saving core playlist:", error)
      if (!isAutoSave) toast.error("Failed to save core playlist")
    } finally {
      if (!isAutoSave) setIsSaving(false)
    }
  }

  // Auto-save effect
  useEffect(() => {
    if (!corePlaylist || !title || !categoryId) return

    // Don't auto-save if the corePlaylist was just loaded
    const isInitialLoad = useRef(true)
    if (isInitialLoad.current) {
      isInitialLoad.current = false
      return
    }

    // Set a timer to auto-save after 1 second of inactivity
    const timer = setTimeout(() => {
      handleSaveCorePlaylist(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [title, description, categoryId, status, corePlaylist, handleSaveCorePlaylist])

  useEffect(() => {
    if (fetchedSections && fetchedSections.length > 0) {
      const sortedSections = [...fetchedSections].sort((a: any, b: any) => a.order - b.order)

      // Map to our CoreSection type
      const mappedSections = sortedSections.map((section: any) => ({
        _id: section._id,
        title: section.title,
        description: section.description,
        sectionType: section.sectionType,
        coreSectionOrder: section.order,
        minSelectMedia: section.minSelectMedia,
        maxSelectMedia: section.maxSelectMedia
      })) as CoreSection[]

      setSections(mappedSections)
    }
  }, [fetchedSections])

  useEffect(() => {
    if (media && media.length > 0) {
      const allMediaItems = media.map((m: any) => ({
        _id: m._id,
        title: m.title,
        description: m.description,
        mediaUrl: m.embedUrl || "", // Use embedUrl for videos
        duration: m.duration,
        mediaType: m.mediaType,
        thumbnailUrl: m.thumbnailUrl
      })) as MediaItem[]

      setAllMedia(allMediaItems)
    }
  }, [media])

  const handleSectionDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    // Find the indices of the dragged and target sections
    const oldIndex = sections.findIndex((s) => s._id.toString() === active.id)
    const newIndex = sections.findIndex((s) => s._id.toString() === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // Create a new array with the updated order
    const updatedSections = [...sections]
    const [movedSection] = updatedSections.splice(oldIndex, 1)
    updatedSections.splice(newIndex, 0, movedSection)

    // Update the order property for each section
    updatedSections.forEach((section, index) => {
      section.coreSectionOrder = index + 1
    })

    // Update the UI
    setSections(updatedSections)

    // Prepare the data for the API call
    const sectionOrders = updatedSections.map((section) => ({
      sectionId: section._id,
      order: section.coreSectionOrder,
    }))

    // Call the API to update the order in the database
    reorderCoreSections(sectionOrders).catch(error => {
      console.error("Error reordering sections:", error)
      toast.error("Failed to reorder sections")
    })
  }, [sections, reorderCoreSections])

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!corePlaylist) return

    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm")
      return
    }

    setIsDeleting(true)

    try {
      await deleteCorePlaylist(corePlaylist._id)

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

  const handleAddSection = async (sectionData: {
    title: string
    type: "base" | "loop"
    maxSelectMedia?: number
  }) => {
    if (!corePlaylist) return

    try {
      const highestOrder = sections.length > 0
        ? Math.max(...sections.map(s => s.coreSectionOrder))
        : 0

      const newSectionId = await createSectionMutation({
        playlistId: corePlaylist._id,
        title: sectionData.title,
        sectionType: sectionData.type,
        minSelectMedia: 1,
        maxSelectMedia: sectionData.maxSelectMedia || 1,
        description: '', // Optional parameter
        isRequired: true, // Optional parameter with default
      })

      setSections(prev => [...prev, {
        _id: newSectionId,
        title: sectionData.title,
        description: '', // Empty description since it's not needed
        sectionType: sectionData.type,
        coreSectionOrder: highestOrder + 1,
        minSelectMedia: 1,
        maxSelectMedia: sectionData.maxSelectMedia || 1,
        isRequired: true,
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
      await updateCoreSection(
        sectionData._id,
        {
          title: sectionData.title,
          description: sectionData.description,
          sectionType: sectionData.sectionType,
          minSelectMedia: sectionData.minSelectMedia,
          maxSelectMedia: sectionData.maxSelectMedia,
        }
      )

      setSections(prev => prev.map(section => section._id === sectionData._id ? sectionData : section))
      toast.success("Section updated successfully")
    } catch (error) {
      console.error("Error updating section:", error)
      toast.error("Failed to update section")
    }
  }

  const handleDeleteSection = async (sectionId: Id<"coreSections">) => {
    try {
      await deleteCoreSection(sectionId)

      // Update UI to reflect deletion
      setSections(sections.filter((section) => section._id !== sectionId))
      toast.success("Section deleted")
    } catch (error) {
      console.error("Error deleting section:", error)
      toast.error("Failed to delete section")
    }
  }

  // Handle media playback
  const handlePlayMedia = (media: MediaItem) => {
    setCurrentMedia(media)
    setIsPlayerOpen(true)
  }

  const handleClosePlayer = () => {
    setIsPlayerOpen(false)
    setCurrentMedia(null)
  }

  if (!corePlaylist) {
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
          <h1 className="text-l font-bold">Edit Core corePlaylist</h1>
        </div>

        {/* Delete Button and Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={isDeleting}
            >
              Delete Playlist
            </Button>
          </DialogTrigger>
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
                disabled={isSaving}
                className="gap-2"
              >
                <SaveIcon className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Core corePlaylist"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Core corePlaylist metadata */}
        <Card>
          <CardHeader>
            <CardTitle>corePlaylist Details</CardTitle>
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
                  onValueChange={(value) => setCategoryId(value as Id<"coreCategories">)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category: any) => (
                      <SelectItem key={category._id.toString()} value={category._id as Id<"coreCategories">}>
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

        {/* Sections */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">corePlaylist Sections</h2>
            <Sheet open={isAddingSectionOpen} onOpenChange={setIsAddingSectionOpen}>
              <SheetTrigger asChild>
                <Button
                  className="gap-2"
                  disabled={!isCorePlaylistSaved}
                  title={!isCorePlaylistSaved ? "Save the playlist first before adding sections" : "Add a new section"}
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
                    disabled={!isCorePlaylistSaved}
                    onClick={() => {
                      if (!isCorePlaylistSaved) {
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
                    value={editingSection.sectionType}
                    onValueChange={(value) => setEditingSection({
                      ...editingSection,
                      sectionType: value as "base" | "loop"
                    })}
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
                    value={editingSection.maxSelectMedia || 0}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      maxSelectMedia: parseInt(e.target.value) || 0
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
                      return addMediaToSectionMutation({
                        sectionId: currentSectionId,
                        mediaId: mediaId as Id<"medias">,
                        isOptional: false, // Not optional by default
                        defaultSelected: true // Selected by default when adding
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
