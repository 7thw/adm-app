"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"
import MediaPlayer from "./MediaPlayer"

// Define the MediaItem type based on what's used in the app
interface MediaItem {
  _id: Id<"medias">
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

interface MediaPlayerModalProps {
  isOpen: boolean
  onClose: () => void
  media: MediaItem
  autoPlay?: boolean
}

export function MediaPlayerModal({
  isOpen,
  onClose,
  media,
  autoPlay = false
}: MediaPlayerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl flex flex-col">
        <DialogHeader>
          <DialogTitle>Play Media</DialogTitle>
        </DialogHeader>
        <MediaPlayer
          className="flex-1 w-[100%]"
          src={media.fileUrl}
          title={media.title}
          description={media.description || ""}
          onError={(error) => {
            console.error("Media playback error:", error);
            toast.error(`Playback failed: ${error}`);
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
