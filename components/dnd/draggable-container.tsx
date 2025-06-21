"use client"

import * as React from "react"
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"

import { cn } from "@/lib/utils"

interface DraggableContainerProps<T extends { id: UniqueIdentifier }> {
  items: T[]
  onReorder?: (items: T[]) => void
  children: React.ReactNode
  className?: string
  strategy?: "vertical" | "horizontal"
  modifiers?: any[]
}

export function DraggableContainer<T extends { id: UniqueIdentifier }>({
  items,
  onReorder,
  children,
  className,
  strategy = "vertical",
  modifiers = [restrictToVerticalAxis],
}: DraggableContainerProps<T>) {
  const [internalItems, setInternalItems] = React.useState<T[]>(items)
  const itemIds = React.useMemo(() => internalItems.map((item) => item.id), [internalItems])
  
  // Update internal items when external items change
  React.useEffect(() => {
    setInternalItems(items)
  }, [items])

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end event
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      setInternalItems((items) => {
        const oldIndex = itemIds.indexOf(active.id)
        const newIndex = itemIds.indexOf(over.id)
        
        const newItems = arrayMove(items, oldIndex, newIndex)
        
        // Call onReorder callback if provided
        if (onReorder) {
          onReorder(newItems)
        }
        
        return newItems
      })
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={modifiers}
    >
      <SortableContext
        items={itemIds}
        strategy={strategy === "vertical" ? verticalListSortingStrategy : undefined}
      >
        <div className={cn("relative", className)}>
          {children}
        </div>
      </SortableContext>
    </DndContext>
  )
}
