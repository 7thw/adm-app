"use client"

import { Id } from "@/convex/_generated/dataModel"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, PlusIcon, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface CoreSectionItemProps {
  id: Id<"coreSections">
  title: string
  description?: string
  sectionType: "base" | "loop"
  mediaCount: number
  minSelectMedia: number
  maxSelectMedia: number
  onEdit: () => void
  onDelete: () => void
  onAddMedia: () => void
}

export function CoreSectionItem({
  id,
  title,
  description,
  sectionType,
  mediaCount,
  minSelectMedia,
  maxSelectMedia,
  onEdit,
  onDelete,
  onAddMedia,
}: CoreSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 p-4 bg-white border rounded-lg shadow-sm"
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-center h-full cursor-grab"
      >
        <GripVertical className="w-5 h-5 text-gray-400" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{title}</h3>
          <Badge variant={sectionType === "base" ? "default" : "secondary"}>
            {sectionType === "base" ? "Base" : "Loop"}
          </Badge>
        </div>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <span>Media: {mediaCount}</span>
          <span>•</span>
          <span>Min: {minSelectMedia}</span>
          <span>•</span>
          <span>Max: {maxSelectMedia}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Button size="sm" variant="outline" onClick={onAddMedia}>
          <PlusIcon className="w-4 h-4 mr-1" />
          Add Media
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit}>
          Edit
        </Button>
        <Button size="sm" variant="destructive" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
