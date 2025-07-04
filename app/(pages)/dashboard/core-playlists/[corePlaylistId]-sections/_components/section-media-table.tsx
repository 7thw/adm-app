"use client"

import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
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
import { useMutation, useQuery } from "convex/react"
import { Check, GripVertical, Minus, PlayCircle, Plus, Sparkles, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableRow
} from "@/components/ui/table"
import { Doc } from "@/convex/_generated/dataModel"
import {DraggableContainer} from "@/components/dnd/draggable-container";
import {Checkbox} from "@/components/ui/checkbox";
import {Loader2} from "lucide-react";
import {useRouter} from "next/navigation";
interface CorePlaylistPageProps {
  params: {
    corePlaylistId: string
  }
}
export default function CorePlaylistPage({ params }: CorePlaylistPageProps) {
  const router = useRouter()
  // Fetch all playlists from Convex and filter client-side for the specific playlist
  const playlists = useQuery(api.admin.listCorePlaylists, {}) || []
  const corePlaylist = playlists.find((p) => p._id === params.corePlaylistId)
  if (!corePlaylist) {
    return (
      <div className="text-center p-4 border rounded-md bg-muted/10">
        <p className="text-muted-foreground">Loading playlist...</p>
      </div>
    )
  }
}

// Use Convex-generated types as source of truth
type MediaDetails = Doc<"medias">
// SectionMediaRaw represents the join table between sections and media

// Use Convex schema directly instead of custom type definitions
// This avoids redundant type definitions that can drift from the schema
type SectionMediaRaw = {
  _id: Id<"sectionMedias">
  _creationTime: number
  sectionId: Id<"coreSections">
  mediaId: Id<"medias">
  order: number
  isRequired?: boolean
  isOptional?: boolean
  defaultSelected?: boolean
}

// This type represents the data structure used in the UI
type SectionMediaItem = {
  _id: Id<"sectionMedias">
  sectionId: Id<"coreSections">
  mediaId: Id<"medias">
  order: number
  selectMedia: boolean // Mapped from isRequired/defaultSelected
  media: MediaDetails | null
}

type SectionMediaTableProps = {
  sectionId: Id<"coreSections">
  maxSelectMedia?: number
  onPlayMedia?: (media: MediaDetails) => void
}

// Sortable item component for drag and drop
function SortableMediaRow({ item, onToggleSelect, onDelete, onPlayMedia }: {
  item: SectionMediaItem
  onToggleSelect: (id: Id<"sectionMedias">, selected: boolean) => void
  onDelete: (id: Id<"sectionMedias">) => void
  onPlayMedia?: (media: MediaDetails) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item._id.toString() })

  // Using inline styles is necessary for drag and drop functionality with @dnd-kit
  // The transform values are dynamically calculated during dragging
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-10">
        <div {...attributes} {...listeners} className="cursor-grab p-1 hover:bg-muted rounded">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell className="w-10">
        {/* <Checkbox
          checked={item.selectMedia}
          onCheckedChange={(checked) => onToggleSelect(item._id, !!checked)}
        /> */}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <div>
            <div className="font-medium">{item.media?.title}</div>
            <div className="text-sm text-muted-foreground">{item.media?.description}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={item.media?.mediaType === "audio" ? "outline" : "default"}>
          {item.media?.mediaType}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-2">
          {item.media && onPlayMedia && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPlayMedia(item.media!)}
              title={`Play ${item.media.title}`}
              aria-label={`Play ${item.media.title}`}
            >
              <PlayCircle className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => onDelete(item._id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function SectionMediaTable({ sectionId, maxSelectMedia, onPlayMedia }: SectionMediaTableProps) {
  // State for tracking selected count
  const [selectedCount, setSelectedCount] = useState(0)

  // State for batch operations
  const [batchSelectedIds, setBatchSelectedIds] = useState<Set<Id<"sectionMedias">>>(new Set())
  const [showBatchActions, setShowBatchActions] = useState(false)
  const [availableMediaForBatch, setAvailableMediaForBatch] = useState<Doc<"medias">[]>([])
  const [showMediaSelector, setShowMediaSelector] = useState(false)

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Fetch section media from Convex
  const sectionMediaResult = useQuery(api.admin.listSectionMedia, { coreSectionId: sectionId

  }) as SectionMediaRaw[] || []

  // Fetch all media using admin API
  const allMedia = useQuery(api.admin.listCoreMedias, { mediaType: undefined }) || []

  // Transform raw data into SectionMediaItem format
  const sectionMedias = sectionMediaResult.map(item => {
    // Find the corresponding media item
    const media = allMedia.find(m => m._id.toString() === item.mediaId.toString()) || null

    return {
      ...item,
      selectMedia: item.isRequired || false,
      media
    }
  }).filter(item => item.media !== null) as SectionMediaItem[]

  // Sort media by order
  const sortedMedia = [...sectionMedias].sort((a, b) => a.order - b.order)

  // Update selected count when media loads
  useEffect(() => {
    if (sectionMedias.length > 0) {
      setSelectedCount(sectionMedias.filter(item => item.selectMedia).length)
    }
  }, [sectionMedias])

  // Mutations
  const updateSelection = useMutation(api.admin.updateSectionMediaSelection)
  const reorderMedia = useMutation(api.admin.reorderSectionMedia)
  const removeMedia = useMutation(api.admin.removeSectionMedia)

  // Batch operations mutations
  const batchAddMedias = useMutation(api.admin.batchAddMediasToSection)
  const batchRemoveMedias = useMutation(api.admin.batchRemoveMediasFromSection)

  // Handle media drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = sortedMedia.findIndex(item => item._id.toString() === active.id)
      const newIndex = sortedMedia.findIndex(item => item._id.toString() === over.id)

      // Reorder the media items
      const reordered = [...sortedMedia]
      const [removed] = reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, removed)

      // Update order property
      const mediaOrders = reordered.map((item, index) => ({
        id: item._id,
        order: index + 1
      }))

      // Save the new order to the database
      reorderMedia({
        coreSectionId: sectionId,
        reorderedItems: mediaOrders
      })
    }
  }

  // Handle toggle select
  const handleToggleSelect = useCallback(async (id: Id<"sectionMedias">, selected: boolean) => {
    try {
      // Check if we're at max selection limit
      if (selected && maxSelectMedia && selectedCount >= maxSelectMedia) {
        toast.error(`You can only select up to ${maxSelectMedia} media items`)
        return
      }

      // Update selection in Convex
      await updateSelection({ 
        sectionMediaId: id, 
        defaultSelected: selected 
      })

      // Update local state
      setSelectedCount(prev => selected ? prev + 1 : prev - 1)
    } catch (error) {
      console.error("Error toggling selection:", error)
      toast.error("Failed to update selection")
    }
  }, [maxSelectMedia, selectedCount, updateSelection])

  // Handle deleting media from section
  const handleDelete = async (id: Id<"sectionMedias">) => {
    try {
      // Check if the item is selected before removing
      const item = sortedMedia.find(item => item._id === id)
      const wasSelected = item?.selectMedia || false

      await removeMedia({ sectionMediaId: id })

      // Update the selected count if needed
      if (wasSelected) {
        setSelectedCount(prev => prev - 1)
      }

      toast.success("Media removed from section")
    } catch (error) {
      console.error("Error removing media:", error)
      toast.error("Failed to remove media")
    }
  }

  // Batch operation handlers
  const handleBatchSelect = (id: Id<"sectionMedias">, selected: boolean) => {
    const newSelection = new Set(batchSelectedIds)
    if (selected) {
      newSelection.add(id)
    } else {
      newSelection.delete(id)
    }
    setBatchSelectedIds(newSelection)
    setShowBatchActions(newSelection.size > 0)
  }

  const handleBatchSelectAll = () => {
    const allIds = new Set(sortedMedia.map(item => item._id))
    setBatchSelectedIds(allIds)
    setShowBatchActions(true)
  }

  const handleBatchClear = () => {
    setBatchSelectedIds(new Set())
    setShowBatchActions(false)
  }

  const handleBatchRemove = async () => {
    if (batchSelectedIds.size === 0) return

    try {
      const mediaIds = Array.from(batchSelectedIds).map(id => {
        const item = sortedMedia.find(media => media._id === id)
        return item?.mediaId
      }).filter(Boolean) as Id<"medias">[]

      await batchRemoveMedias({
        coreSectionId: sectionId,
        coreMediaIds: mediaIds
      })

      toast.success(`Removed ${batchSelectedIds.size} media items`)
      handleBatchClear()
    } catch (error) {
      console.error("Error batch removing media:", error)
      toast.error("Failed to remove selected media")
    }
  }

  const handleBatchAdd = async (selectedMediaIds: Id<"medias">[]) => {
    if (selectedMediaIds.length === 0) return

    try {
      const result = await batchAddMedias({
        coreSectionId: sectionId,
        coreMediaIds: selectedMediaIds
      })

      toast.success(`Added ${result.addedCount} media items` +
        (result.skippedCount > 0 ? ` (${result.skippedCount} already existed)` : ""))
      setShowMediaSelector(false)
    } catch (error) {
      console.error("Error batch adding media:", error)
      toast.error("Failed to add selected media")
    }
  }

  if (sortedMedia.length === 0) {
    return (
      <div className="text-center p-4 border rounded-md bg-muted/10">
        <p className="text-muted-foreground">No media items added to this section yet.</p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="border rounded-md overflow-hidden">
        <div className="bg-muted/20 p-2 text-sm border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span>Selected: {selectedCount} (No limit in edit mode)</span>
              {showBatchActions && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {batchSelectedIds.size} items selected for batch operations
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBatchRemove}
                    className="gap-1"
                  >
                    <Minus className="h-3 w-3" />
                    Remove Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBatchClear}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedCount > 0 && (
                <Badge variant="default">
                  <Check className="h-3 w-3 mr-1" />
                  {selectedCount} selected
                </Badge>
              )}

              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowMediaSelector(true)}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Media
                </Button>

                {!showBatchActions ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBatchSelectAll}
                    className="gap-1"
                  >
                    <Select />
                    Select All
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBatchClear}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <Table>
          <TableBody>
            <SortableContext
              items={sortedMedia.map(item => item._id.toString())}
              strategy={verticalListSortingStrategy}
            >
              {sortedMedia.map((item) => (
                <SortableMediaRow
                  key={item._id.toString()}
                  item={item}
                  onToggleSelect={handleToggleSelect}
                  onDelete={handleDelete}
                  onPlayMedia={onPlayMedia}
                />
              ))}
            </SortableContext>
          </TableBody>
        </Table>
      </div>
    </DndContext>
  )
}
