import React from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Volume2 } from "lucide-react"

// Proper React component for media cell player
const MediaCellPlayer: React.FC<{ 
  media: any // Replace with proper media type
}> = ({ media }) => {
  const [openPlayer, setOpenPlayer] = React.useState(false)
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  // Helper function to get the media URL
  const getMediaUrl = () => {
    // Use storageId to generate URL or use embedUrl if available
    if (media.storageId) {
      return `/api/media/${media.storageId}`
    } else if (media.embedUrl) {
      return media.embedUrl
    } else if (media.youtubeId) {
      return `https://www.youtube.com/watch?v=${media.youtubeId}`
    }
    return ""
  }

  // Helper function to determine if media is playable
  const isPlayable = () => {
    return media.mediaType === "audio" && (media.storageId || media.embedUrl || media.youtubeId)
  }

  // Helper function to get media source type
  const getMediaSourceType = () => {
    if (media.storageId) return "local"
    if (media.embedUrl || media.youtubeId) return "external"
    return "unknown"
  }

  // Helper function to get player type
  const getPlayerType = () => {
    if (media.mediaType === "audio") return "audio"
    if (media.mediaType === "video") return "video"
    return "unknown"
  }

  if (!isClient) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Play className="h-4 w-4" />
      </Button>
    )
  }

  if (!isPlayable()) {
    return (
      <span className="text-xs text-muted-foreground">
        Not playable
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpenPlayer(!openPlayer)}
        className="h-8 w-8 p-0"
      >
        {openPlayer ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      
      {openPlayer && (
        <div className="flex items-center gap-2">
          <audio
            src={getMediaUrl()}
            controls
            autoPlay
            className="h-8"
            onEnded={() => setOpenPlayer(false)}
            preload="none"
          />
        </div>
      )}
    </div>
  )
}

export { MediaCellPlayer }
