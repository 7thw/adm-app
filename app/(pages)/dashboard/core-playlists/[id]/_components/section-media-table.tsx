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
import { Check, GripVertical, PlayCircle, Sparkles, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableRow
} from "@/components/ui/table"

// Define types for our component
type MediaDetails = {
  _id: Id<"medias">
  title: string
  description?: string
  mediaType: "audio" | "video"
  // For audio files uploaded to Convex storage
  storageId?: Id<"_storage">
  // For video embeds (YouTube, etc.)
  embedUrl?: string
  youtubeId?: string
  // Media metadata
  duration: number // in seconds
  fileSize?: number
  contentType?: string
  thumbnailStorageId?: Id<"_storage">
  thumbnailUrl?: string
  // Processing status
  processingStatus: "pending" | "processing" | "completed" | "failed"
  // Audio-specific metadata
  transcript?: string
  waveformData?: string
  quality?: string
  bitrate?: number
  // Ownership and access
  uploadedBy: Id<"users">
  isPublic: boolean
  _creationTime: number
}

// This type represents the raw data returned from Convex
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

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Fetch section media from Convex
  const sectionMediaResult = useQuery(api.admin.addMediaToSection ? api.admin.addMediaToSection : api.coreSectionMedia.getBySectionId, {
    sectionId
  }) as SectionMediaRaw[] || []

  // Fetch all media using admin API
  const allMedia = useQuery(api.admin.listMedias, { mediaType: undefined }) || []

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
  const updateSelection = useMutation(api.coreSectionMedia.updateSelection)
  const reorderMedia = useMutation(api.coreSectionMedia.reorderMedia)
  const removeMedia = useMutation(api.coreSectionMedia.removeMedia)

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
        mediaOrders
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

      // Update selection in Convex - use isRequired instead of selectMedia
      await updateSelection({ id, isRequired: selected })

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

      await removeMedia({ id })

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
            <span>Selected: {selectedCount} (No limit in edit mode)</span>
            {selectedCount > 0 && (
              <Badge variant="default">
                <Check className="h-3 w-3 mr-1" />
                {selectedCount} selected
              </Badge>
            )}
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
