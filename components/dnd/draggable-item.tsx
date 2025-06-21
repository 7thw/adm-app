"use client"

import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVerticalIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DraggableItemProps {
  id: string | number
  children: React.ReactNode
  className?: string
  dragHandleClassName?: string
  showDragHandle?: boolean
}

export function DraggableItem({
  id,
  children,
  className,
  dragHandleClassName,
  showDragHandle = true,
}: DraggableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  // Apply transform and transition as CSS custom properties
  const customStyles = {
    "--transform": transform ? CSS.Transform.toString(transform) : "",
    "--transition": transition || "",
  } as React.CSSProperties

  return (
    <div
      ref={setNodeRef}
      style={customStyles}
      className={cn(
        "transform-gpu", // Use GPU for smoother transforms
        transform ? "translate3d(var(--transform), 0)" : "",
        transition ? "transition-transform duration-200" : "",
        "relative flex items-center gap-2 rounded-md border bg-background p-2",
        isDragging && "z-10 opacity-50 shadow-lg",
        className
      )}
      data-dragging={isDragging || undefined}
    >
      {showDragHandle && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "size-8 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing",
            dragHandleClassName
          )}
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="size-4" />
          <span className="sr-only">Drag handle</span>
        </Button>
      )}
      <div className="flex-1">{children}</div>
    </div>
  )
}
