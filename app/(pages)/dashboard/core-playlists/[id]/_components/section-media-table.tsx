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
import { Check, GripVertical, PlayCircle, Sparkles, Trash2, X } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableRow
} from "@/components/ui/table"

// Define types for our component
type MediaDetails = {
  _id: Id<"media">
  title: string
  description: string
  mediaType: "audio" | "video"
  fileUrl: string
  fileKey: string
  fileSize: number
  contentType: string
  userId: string
  createdAt: string
  updatedAt: string
  duration?: number
  _creationTime: number
}

// This type represents the raw data returned from Convex
type SectionMediaRaw = {
  _id: Id<"sectionMedia">
  _creationTime: number
  sectionId: Id<"coreSections">
  mediaId: Id<"media">
  order: number
  isRequired?: boolean
  createdAt: number
}

// This type represents the data structure used in the UI
type SectionMediaItem = {
  _id: Id<"sectionMedia">
  sectionId: Id<"coreSections">
  mediaId: Id<"media">
  order: number
  selectMedia: boolean // Mapped from isRequired
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
  onToggleSelect: (id: Id<"sectionMedia">, selected: boolean) => void
  onDelete: (id: Id<"sectionMedia">) => void
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
  const sectionMediaResult = useQuery(api.coreSectionMedia.getBySectionId, {
    sectionId
  }) as SectionMediaRaw[] || []
  
  // Fetch media details for each section media item
  const mediaIds = sectionMediaResult.map(item => item.mediaId)
  const mediaDetails = useQuery(api.media.getByIds, { ids: mediaIds }) || []
  
  // Transform raw data into SectionMediaItem format
  const sectionMedia = sectionMediaResult.map(item => {
    const media = mediaDetails.find(m => m._id.equals(item.mediaId)) || null
    return {
      ...item,
      selectMedia: item.isRequired || false,
      media
    }
  }).filter(item => item.media !== null) as SectionMediaItem[]

  // Sort media by order
  const sortedMedia = [...sectionMedia].sort((a, b) => a.order - b.order)

  // Update selected count when media loads
  useEffect(() => {
    if (sectionMedia.length > 0) {
      setSelectedCount(sectionMedia.filter(item => item.selectMedia).length)
    }
  }, [sectionMedia])

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
        coreSectionId: sectionId,
        mediaOrders
      })
    }
  }

  // Handle toggling media selection
  const handleToggleSelect = async (id: Id<"sectionMedia">, selected: boolean) => {
    try {
      // No limits enforced in edit page - allow unlimited selection for editing purposes
      await updateSelection({ id, selectMedia: selected })

      // Update the selected count
      setSelectedCount(prev => selected ? prev + 1 : prev - 1)

      toast.success(`Media ${selected ? 'selected' : 'unselected'} successfully`)
    } catch (error) {
      console.error("Error updating selection:", error)
      toast.error("Failed to update selection")
    }
  }

  // Handle deleting media from section
  const handleDelete = async (id: Id<"sectionMedia">) => {
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
