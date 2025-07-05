"use client"

import { useState } from "react"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

interface MediaItem {
  _id: Id<"coreMedias">
  title: string
  description?: string
  mediaType: "audio" | "video"
  duration: number
  mediaUrl: string
  thumbnailUrl?: string
}

interface MediaSelectorProps {
  mediaItems: MediaItem[]
  selectedMediaIds: Set<string>
  onSelectionChange: (selectedIds: Set<string>) => void
  onConfirm: () => void
  onCancel: () => void
}

export function MediaSelector({
  mediaItems,
  selectedMediaIds,
  onSelectionChange,
  onConfirm,
  onCancel,
}: MediaSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredMedia = mediaItems.filter(
    (media) =>
      media.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (media.description &&
        media.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleToggleSelection = (mediaId: string) => {
    const newSelection = new Set(selectedMediaIds)
    if (newSelection.has(mediaId)) {
      newSelection.delete(mediaId)
    } else {
      newSelection.add(mediaId)
    }
    onSelectionChange(newSelection)
  }

  const handleSelectAll = () => {
    const newSelection = new Set<string>()
    filteredMedia.forEach((media) => {
      newSelection.add(media._id.toString())
    })
    onSelectionChange(newSelection)
  }

  const handleClearSelection = () => {
    onSelectionChange(new Set())
  }

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <Label htmlFor="search-media">Search Media</Label>
          <Input
            id="search-media"
            placeholder="Search by title or description"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearSelection}
          >
            Clear Selection
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 border rounded-md">
        <div className="divide-y">
          {filteredMedia.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No media items found
            </div>
          ) : (
            filteredMedia.map((media) => {
              const isSelected = selectedMediaIds.has(media._id.toString())
              return (
                <div
                  key={media._id.toString()}
                  className="p-3 flex items-center gap-3 hover:bg-gray-50"
                >
                  <Checkbox
                    id={`media-${media._id}`}
                    checked={isSelected}
                    onCheckedChange={() =>
                      handleToggleSelection(media._id.toString())
                    }
                  />
                  <Label
                    htmlFor={`media-${media._id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="font-medium">{media.title}</div>
                    {media.description && (
                      <div className="text-sm text-gray-500">
                        {media.description}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      {media.mediaType} • {formatDuration(media.duration)}
                    </div>
                  </Label>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={selectedMediaIds.size === 0}
          onClick={onConfirm}
        >
          Add {selectedMediaIds.size} Selected
        </Button>
      </div>
    </div>
  )
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}
